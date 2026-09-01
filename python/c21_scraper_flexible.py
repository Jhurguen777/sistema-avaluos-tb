"""
C21 Scraper Flexible - Con API JSON
Scrapea propiedades de Century 21 Bolivia usando el endpoint JSON
Acepta cualquier URL con diferentes filtros (tipo, operación, ubicación, etc.)
"""

import json
import time
import requests
from typing import List, Dict, Set
import sys
import os
from datetime import datetime


class C21FlexibleScraper:
    """Scraper flexible para C21 que acepta cualquier URL con filtros"""

    def __init__(self, start_url: str):
        self.start_url = start_url
        self.properties = []
        self.seen_urls: Set[str] = set()  # Para evitar duplicados
        self.base_coords = self.extract_coordinates_from_url(start_url)

    def extract_coordinates_from_url(self, url: str) -> str:
        """Extrae las coordenadas de la URL proporcionada"""
        try:
            # Buscar el patrón de coordenadas en la URL
            if "coordenadas_" in url:
                # Extraer desde "coordenadas_" hasta el siguiente "/" o "?"
                coords_start = url.index("coordenadas_") + len("coordenadas_")
                coords_end = coords_start

                # Encontrar el final (puede ser /, ? o fin de string)
                for i in range(coords_start, len(url)):
                    if url[i] in ['/', '?']:
                        break
                    coords_end = i + 1

                coords = url[coords_start:coords_end]
                print(f"Coordenadas extraídas: {coords}")
                return coords
            else:
                print("No se encontraron coordenadas en la URL, usando coordenadas por defecto (toda Bolivia)")
                # Coordenadas por defecto para toda Bolivia
                return "-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6"
        except Exception as e:
            print(f"Error extrayendo coordenadas: {e}")
            return "-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6"

    def get_base_url(self, url: str) -> str:
        """Extrae la URL base sin coordenadas, parámetros ni número de página"""
        try:
            # Eliminar todo desde "coordenadas_" en adelante
            if "coordenadas_" in url:
                base_end = url.index("coordenadas_")

                # Verificar si hay /pagina_N/ antes de coordenadas
                before_coords = url[:base_end]
                if "/pagina_" in before_coords:
                    # Eliminar /pagina_N/ completamente
                    # La URL debe ser: /tipo_X/operacion_Y/layout_mapa
                    # Buscar la última aparición de /layout_mapa/
                    if "/layout_mapa" in before_coords:
                        layout_mapa_start = before_coords.index("/layout_mapa")
                        # Buscar si hay /pagina_ antes de /layout_mapa/
                        before_layout = before_coords[:layout_mapa_start]
                        if "/pagina_" in before_layout:
                            # Eliminar desde /pagina_ hasta /layout_mapa/
                            pagina_start = before_layout.index("/pagina_")
                            base_url = before_layout[:pagina_start] + "/layout_mapa"
                        else:
                            base_url = before_coords[:layout_mapa_start] + "/layout_mapa"
                        return base_url.rstrip('/layout_mapa') + "/layout_mapa"
                elif "/layout_mapa/" in before_coords:
                    base_url = before_coords[:before_coords.index("/layout_mapa/")] + "/layout_mapa"
                else:
                    base_url = before_coords.rstrip('/')

                return base_url
            else:
                # Si no hay coordenadas, usar la URL tal cual
                return url.split('?')[0]  # Eliminar parámetros
        except Exception as e:
            print(f"Error obteniendo URL base: {e}")
            import traceback
            traceback.print_exc()
            return "https://c21.com.bo/v/resultados/tipo_casa/operacion_venta/layout_mapa"

    def parse_property_from_json(self, prop: Dict) -> Dict:
        """Parsea una propiedad del JSON al formato deseado"""
        property_data = {}

        try:
            # Código único con ID real de la inmobiliaria (CEN-117146)
            id_propiedad = prop.get('id')
            if id_propiedad:
                property_data['codigo'] = f"CEN-{id_propiedad}"

            # Categoría (tipo de propiedad)
            tipo_propiedad = prop.get('tipoPropiedad', '')
            if tipo_propiedad:
                property_data['categoria'] = str(tipo_propiedad).lower()

            # Tipo de operación
            tipo_operacion = prop.get('tipoOperacion', 'venta')
            if tipo_operacion == 'anticretico':
                tipo_operacion = 'anticretico'
            property_data['tipo_operacion'] = tipo_operacion

            # Título (encabezado)
            encabezado = prop.get('encabezado', '')
            if encabezado:
                # Limpiar el título
                titulo = encabezado.replace('CASA EN VENTA', '').strip()
                titulo = titulo.replace('CASA EN ALQUILER', '').strip()
                titulo = titulo.replace('DEPARTAMENTO EN VENTA', '').strip()
                titulo = titulo.replace('DEPARTAMENTO EN ALQUILER', '').strip()
                if len(titulo) > 5:
                    property_data['titulo'] = titulo

            # Si no hay título, crear uno genérico
            if 'titulo' not in property_data:
                property_data['titulo'] = f"{tipo_propiedad} en {tipo_operacion}"

            # Precio
            precios = prop.get('precios', {})
            if precios and 'vista' in precios:
                precio_vista = precios['vista']
                if precio_vista and 'precioFormat' in precio_vista:
                    property_data['precio'] = precio_vista['precioFormat']

            # Ubicación separada (país, departamento, municipio, calle)
            ubicacion = {}
            pais = prop.get('pais', '')
            estado = prop.get('estado', '')
            municipio = prop.get('municipio', '')
            calle = prop.get('calle', '')

            if pais:
                ubicacion['pais'] = pais
            if estado:
                ubicacion['departamento'] = estado
            if municipio:
                ubicacion['municipio'] = municipio
            if calle:
                ubicacion['calle'] = calle

            if ubicacion:
                property_data['ubicacion'] = ubicacion

            # Coordenadas
            lat = prop.get('lat')
            lon = prop.get('lon')
            if lat is not None and lon is not None:
                property_data['coordenadas'] = {
                    'latitud': lat,
                    'longitud': lon
                }

            # Características
            caracteristicas = {}

            # Área de terreno
            m2T = prop.get('m2T')
            if m2T:
                caracteristicas['area_terreno'] = f"{m2T}m² Terreno"

            # Área de construcción
            m2C = prop.get('m2C')
            if m2C:
                caracteristicas['area_construccion'] = f"{m2C}m² Construcción"

            # Habitaciones (recamaras)
            recamaras = prop.get('recamaras')
            if recamaras:
                caracteristicas['habitaciones'] = f"{recamaras} Rec."

            # Baños
            banos = prop.get('banos')
            if banos:
                caracteristicas['banos'] = f"{banos} Baños"

            # Estacionamientos
            estacionamientos = prop.get('estacionamientos')
            if estacionamientos:
                caracteristicas['estacionamientos'] = f"{estacionamientos} Estac."

            if caracteristicas:
                property_data['caracteristicas'] = caracteristicas

            # Fechas (publicación, modificación, días)
            fechas = {}
            fecha_alta = prop.get('fechaAlta', '')
            fecha_mod = prop.get('fechaModificacion', '')
            dias_mod = prop.get('diasModificacionTxt', '')

            if fecha_alta:
                fechas['publicacion'] = fecha_alta
            if fecha_mod:
                fechas['modificacion'] = fecha_mod
            if dias_mod:
                fechas['dias_modificacion'] = dias_mod

            if fechas:
                property_data['fechas'] = fechas

            # URL
            url_correcta = prop.get('urlCorrectaPropiedad', '')
            if url_correcta:
                property_data['url'] = f"https://c21.com.bo{url_correcta}"

            # Imagen (primera foto)
            fotos = prop.get('fotos', {})
            if fotos and 'propiedadThumbnail' in fotos:
                thumbnails = fotos['propiedadThumbnail']
                if thumbnails and len(thumbnails) > 0:
                    property_data['imagen'] = thumbnails[0]

        except Exception as e:
            print(f"    [ERROR] Error parseando propiedad: {e}")

        return property_data

    def scrape_all_pages(self):
        """Extrae todas las propiedades usando paginación"""
        try:
            print(f"\n{'='*60}")
            print("EXTRAYENDO PROPIEDADES CON PAGINACIÓN AUTOMÁTICA")
            print(f"{'='*60}\n")

            print(f"URL de inicio: {self.start_url}\n")

            # Extraer URL base y coordenadas
            base_url = self.get_base_url(self.start_url)
            coords = self.base_coords

            print(f"URL base: {base_url}")
            print(f"Coordenadas: {coords}\n")

            page_num = 1
            total_hits = 0

            while True:
                # Construir URL según número de página
                if page_num == 1:
                    url = f"{base_url}/coordenadas_{coords}?json=true"
                else:
                    url = f"{base_url}/pagina_{page_num}/coordenadas_{coords}?json=true"

                print(f"\n{'='*60}")
                print(f"PÁGINA {page_num}")
                print(f"{'='*60}")

                try:
                    # Hacer la petición
                    response = requests.get(url, timeout=60)

                    if response.status_code != 200:
                        print(f"Error HTTP: {response.status_code}")
                        break

                    # Parsear JSON
                    data = response.json()
                    results = data.get('results', [])
                    total_hits = data.get('totalHits', 0)

                    if len(results) == 0:
                        print("No hay más resultados - PROCESO COMPLETADO")
                        break

                    print(f"totalHits: {total_hits}")
                    print(f"Propiedades en esta página: {len(results)}")

                    # Procesar cada propiedad
                    new_properties = 0
                    for prop in results:
                        try:
                            # Extraer datos de la propiedad (incluye código con ID real)
                            property_data = self.parse_property_from_json(prop)

                            # Evitar duplicados por ID de la propiedad
                            if property_data:
                                prop_id = prop.get('id')
                                prop_url = property_data.get('url', '')
                                clave = prop_url or prop_id
                                if clave and clave not in self.seen_urls:
                                    self.seen_urls.add(clave)
                                    self.properties.append(property_data)
                                    new_properties += 1

                        except Exception as e:
                            continue

                    print(f"Propiedades nuevas: {new_properties}")
                    print(f"Total acumulado: {len(self.properties)}")

                    if new_properties == 0:
                        print("No hay propiedades nuevas - PROCESO COMPLETADO")
                        break

                    page_num += 1

                    # Pequeña pausa para no sobrecargar el servidor
                    time.sleep(1)

                except Exception as e:
                    print(f"Error procesando página {page_num}: {e}")
                    break

            print(f"\n{'='*60}")
            print(f"PROCESO COMPLETADO")
            print(f"{'='*60}")
            print(f"\nResumen:")
            print(f"  Páginas procesadas: {page_num - 1}")
            print(f"  TotalHits disponible: {total_hits}")
            print(f"  Propiedades únicas extraídas: {len(self.properties)}")

        except Exception as e:
            print(f"Error durante el scraping: {e}")
            import traceback
            traceback.print_exc()

    def get_folder_name(self, tipo: str, operacion: str) -> str:
        """Genera el nombre de la carpeta: C21/C21-tipo+operacion(fecha)"""
        fecha = datetime.now().strftime("%Y-%m-%d")
        return f"C21/C21-{tipo}{operacion}({fecha})"

    def save_to_json(self, filename: str = "c21_propiedades.json", folder_name: str = None):
        """Guarda los datos en JSON dentro de una carpeta específica"""
        try:
            # Si se proporciona nombre de carpeta, crearla y guardar ahí
            if folder_name:
                # Crear la carpeta si no existe
                if not os.path.exists(folder_name):
                    os.makedirs(folder_name)
                    print(f"[OK] Carpeta creada: {folder_name}/")

                # Ruta completa del archivo
                filepath = os.path.join(folder_name, filename)
            else:
                filepath = filename

            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.properties, f, ensure_ascii=False, indent=2)

            print(f"\n{'='*60}")
            print(f"[OK] Datos guardados en: {filepath}")
            print(f"[OK] Total de propiedades únicas: {len(self.properties)}")
            print(f"{'='*60}")
        except Exception as e:
            print(f"Error al guardar: {e}")


def main():
    """Función principal"""
    print("=" * 60)
    print("C21 SCRAPER FLEXIBLE")
    print("=" * 60)
    print("\nEste scraper acepta cualquier URL de C21 Bolivia")
    print("y extrae todas las propiedades con paginación automática.\n")

    # Ejemplos de URLs con diferentes filtros
    ejemplos = """
EJEMPLOS DE URLS CON DIFERENTES FILTROS:

1. CASAS EN VENTA (actual):
   https://c21.com.bo/v/resultados/tipo_casa/operacion_venta/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6

2. DEPARTAMENTOS EN VENTA:
   https://c21.com.bo/v/resultados/tipo_departamento/operacion_venta/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6

3. TERRENOS EN VENTA:
   https://c21.com.bo/v/resultados/tipo_terreno/operacion_venta/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6

4. CASAS EN ALQUILER:
   https://c21.com.bo/v/resultados/tipo_casa/operacion_alquiler/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6

5. DEPARTAMENTOS EN ANTICRÉTICO:
   https://c21.com.bo/v/resultados/tipo_departamento/operacion_anticretico/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6

FORMATO DE URL:
   https://c21.com.bo/v/resultados/tipo_{TIPO}/operacion_{OPERACION}/layout_mapa/coordenadas_{LAT1},{LON1},{LAT2},{LON2},{ZOOM}

TIPOS: casa, departamento, terreno, local_comercial, oficina, galpon, etc.
OPERACIONES: venta, alquiler, anticretico
"""

    if len(sys.argv) > 1:
        # URL pasada como argumento
        url = sys.argv[1]
        print(f"URL recibida: {url}\n")
    else:
        # Solicitar URL al usuario
        print(ejemplos)
        url = input("\nIngresa la URL de C21 (o presiona Enter para usar casas en venta): ").strip()

        if not url:
            # Usar URL por defecto (casas en venta)
            url = "https://c21.com.bo/v/resultados/tipo_casa/operacion_venta/layout_mapa/coordenadas_-10.01212955790814,-59.08447265625,-24.547123179730765,-73.01513671875,6"
            print(f"Usando URL por defecto: casas en venta\n")

    # Crear scraper y extraer propiedades
    scraper = C21FlexibleScraper(url)
    scraper.scrape_all_pages()

    # Detectar tipo y operación de la URL para crear la carpeta
    tipo = "casas"  # default
    operacion = "venta"  # default

    # Detectar tipo de propiedad
    if 'tipo_departamento' in url:
        tipo = "deptos"
    elif 'tipo_casa' in url:
        tipo = "casas"
    elif 'tipo_terreno' in url:
        tipo = "terrenos"
    elif 'tipo_local' in url:
        tipo = "locales"
    elif 'tipo_oficina' in url:
        tipo = "oficinas"
    elif 'tipo_galpon' in url:
        tipo = "galpones"

    # Detectar tipo de operación
    if 'operacion_venta' in url:
        operacion = "venta"
    elif 'operacion_alquiler' in url:
        operacion = "alquiler"
    elif 'operacion_anticretico' in url:
        operacion = "anticretico"

    # Crear nombre de carpeta
    folder_name = scraper.get_folder_name(tipo, operacion)

    # Nombre del archivo JSON
    filename = f"{tipo}_{operacion}.json"

    # Guardar resultados en la carpeta creada
    if scraper.properties:
        scraper.save_to_json(filename, folder_name)
    else:
        print("\nNo se encontraron propiedades")


if __name__ == "__main__":
    main()
