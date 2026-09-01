"""
RE/MAX Bolivia Scraper Flexible - Con API JSON
Scrapea propiedades de RE/MAX Bolivia usando el endpoint JSON
Acepta cualquier URL con diferentes filtros (tipo, ubicación, etc.)
Funciona idéntico a c21_scraper_flexible.py
"""

import json
import time
import requests
from typing import List, Dict, Set
import sys
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs


class RemaxFlexibleScraper:
    """Scraper flexible para RE/MAX que acepta cualquier URL"""

    def __init__(self, start_url: str):
        self.start_url = start_url
        self.properties = []
        self.seen_urls: Set[str] = set()

    def extract_type_and_location_from_url(self, url: str) -> tuple:
        """Extrae tipo y ubicación de la URL de RE/MAX"""
        try:
            # Formato esperado: https://remax.bo/search/{TIPO}/{UBICACION}?...
            parsed = urlparse(url)
            path_parts = parsed.path.strip('/').split('/')

            if len(path_parts) >= 2 and path_parts[0] == 'search':
                property_type = path_parts[1]  # casa, departamento, terreno
                location = path_parts[2] if len(path_parts) > 2 else 'santa-cruz'
                return property_type, location
            else:
                print("Formato de URL no reconocido")
                return "casa", "santa-cruz"
        except Exception as e:
            print(f"Error extrayendo tipo y ubicación: {e}")
            return "casa", "santa-cruz"

    def parse_property_from_api(self, prop: Dict) -> Dict:
        """Parsea una propiedad del API de RE/MAX al formato estándar (igual a C21)"""
        property_data = {}

        try:
            # Código único con ID real de la inmobiliaria (REM-51337)
            id_propiedad = prop.get('id')
            if id_propiedad:
                property_data['codigo'] = f"REM-{id_propiedad}"

            # Categoría/tipo de propiedad
            listing_info = prop.get('listing_information', {})
            subtype = listing_info.get('subtype_property', {})
            if subtype and isinstance(subtype, dict):
                categoria = subtype.get('name', '').lower()
                if categoria:
                    property_data['categoria'] = categoria

            # Tipo de operación
            transaction_type = prop.get('transaction_type', {})
            if transaction_type and isinstance(transaction_type, dict):
                tipo_op = transaction_type.get('name', 'Venta').lower()
                if 'venta' in tipo_op:
                    property_data['tipo_operacion'] = 'venta'
                elif 'alquiler' in tipo_op or 'renta' in tipo_op:
                    property_data['tipo_operacion'] = 'alquiler'
                else:
                    property_data['tipo_operacion'] = tipo_op

            # Título (usar el slug)
            slug = prop.get('slug', '')
            if slug:
                # Limpiar el slug para crear título
                titulo = slug.replace('-', ' ').title()
                # Limpiar palabras comunes
                titulo = titulo.replace('Venta ', '').replace('Casa ', '').strip()
                if len(titulo) > 5:
                    property_data['titulo'] = titulo
            else:
                property_data['titulo'] = f"{property_data.get('categoria', 'Propiedad')} en {property_data.get('tipo_operacion', 'venta')}"

            # Precio
            price_info = prop.get('price', {})
            if price_info and isinstance(price_info, dict):
                amount = price_info.get('price_in_dollars')
                if amount:
                    property_data['precio'] = f"{amount:,.0f} USD".replace(',', '.')

            # Ubicación separada (país, departamento, municipio, calle/zona)
            ubicacion = {}
            location = prop.get('location', {})

            if location and isinstance(location, dict):
                # País (Bolivia es el único país)
                ubicacion['pais'] = 'Bolivia'

                # Departamento/Estado
                state = location.get('state', {}) if isinstance(location.get('state'), dict) else {}
                city_data = location.get('city', {})
                province = city_data.get('province', {}) if isinstance(city_data, dict) else {}

                if isinstance(province, dict):
                    state_from_province = province.get('state', {})
                    if isinstance(state_from_province, dict) and state_from_province.get('name'):
                        ubicacion['departamento'] = state_from_province['name']
                    elif state.get('name'):
                        ubicacion['departamento'] = state['name']

                # Municipio/Ciudad
                city = location.get('city', {})
                if isinstance(city, dict) and city.get('name'):
                    ubicacion['municipio'] = city['name']

                # Zona/Barrio
                zone = location.get('zone', {})
                if isinstance(zone, dict) and zone.get('name'):
                    ubicacion['zona'] = zone['name']

                # Calle/Dirección
                first_address = location.get('first_address', '')
                if first_address:
                    ubicacion['calle'] = first_address

                if ubicacion:
                    property_data['ubicacion'] = ubicacion

            # Coordenadas
            lat = location.get('latitude') if location else None
            lon = location.get('longitude') if location else None
            if lat and lon:
                try:
                    property_data['coordenadas'] = {
                        'latitud': float(lat),
                        'longitud': float(lon)
                    }
                except:
                    pass

            # Características
            caracteristicas = {}

            if listing_info and isinstance(listing_info, dict):
                # Área de terreno
                land_m2 = listing_info.get('land_m2')
                if land_m2:
                    caracteristicas['area_terreno'] = f"{land_m2}m² Terreno"

                # Área de construcción
                construction_area = listing_info.get('construction_area_m')
                if construction_area:
                    caracteristicas['area_construccion'] = f"{construction_area}m² Construcción"

                # Habitaciones
                bedrooms = listing_info.get('number_bedrooms')
                if bedrooms and bedrooms > 0:
                    caracteristicas['habitaciones'] = f"{bedrooms} Rec."

                # Baños
                bathrooms = listing_info.get('number_bathrooms')
                if bathrooms and bathrooms > 0:
                    caracteristicas['banos'] = f"{bathrooms} Baños"

                # Ambientes
                total_rooms = listing_info.get('total_number_rooms')
                if total_rooms and total_rooms > 0:
                    caracteristicas['ambientes'] = f"{total_rooms} Amb."

            if caracteristicas:
                property_data['caracteristicas'] = caracteristicas

            # Fechas
            fechas = {}
            date_listing = prop.get('date_of_listing', '')

            if date_listing:
                fechas['publicacion'] = date_listing

            # Fecha de actualización (del precio)
            if price_info and isinstance(price_info, dict):
                updated_at = price_info.get('updated_at', '')
                if updated_at:
                    # Formatear fecha (viene como ISO)
                    try:
                        from datetime import datetime
                        dt = datetime.fromisoformat(updated_at.replace('T', ' ').replace('.000000Z', '').replace('Z', ''))
                        fechas['modificacion'] = dt.strftime('%Y-%m-%d')
                    except:
                        fechas['modificacion'] = updated_at[:10] if len(updated_at) >= 10 else updated_at

            if fechas:
                property_data['fechas'] = fechas

            # URL
            slug = prop.get('slug', '')
            if slug:
                property_data['url'] = f"https://remax.bo/property/{slug}"

            # Imagen (primera foto)
            default_image = prop.get('default_imagen', {})
            if default_image and isinstance(default_image, dict):
                image_url = default_image.get('url') or default_image.get('link')
                if image_url:
                    # Completar URL si es relativa
                    if not image_url.startswith('http'):
                        image_url = f"https://s3.us-east-1.amazonaws.com/images.remax.bo/{image_url}"
                    property_data['imagen'] = image_url

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

            # Extraer tipo y ubicación de la URL
            property_type, location = self.extract_type_and_location_from_url(self.start_url)
            print(f"Tipo detectado: {property_type}")
            print(f"Ubicación detectada: {location}\n")

            # Construir URL base del API
            base_url = f"https://remax.bo/api/search/{property_type}/{location}"

            page_num = 1
            total_hits = 0

            while True:
                # Construir URL con parámetros
                params = {'page': page_num}

                print(f"\n{'='*60}")
                print(f"PÁGINA {page_num}")
                print(f"{'='*60}")

                try:
                    # Hacer la petición
                    response = requests.get(base_url, params=params, timeout=60)

                    if response.status_code != 200:
                        print(f"Error HTTP: {response.status_code}")
                        break

                    # Parsear JSON
                    data = response.json()
                    results = data.get('data', [])
                    total_hits = data.get('total', 0)
                    last_page = data.get('last_page', 1)

                    if len(results) == 0:
                        print("No hay más resultados - PROCESO COMPLETADO")
                        break

                    print(f"totalHits: {total_hits}")
                    print(f"last_page: {last_page}")
                    print(f"Propiedades en esta página: {len(results)}")

                    # Procesar cada propiedad
                    new_properties = 0
                    for prop in results:
                        try:
                            # Extraer datos de la propiedad (incluye código con ID real)
                            property_data = self.parse_property_from_api(prop)

                            # Evitar duplicados por ID
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

                    # Verificar si llegamos a la última página
                    if page_num >= last_page:
                        print("Llegamos a la última página - PROCESO COMPLETADO")
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
            print(f"  Páginas procesadas: {page_num}")
            print(f"  TotalHits disponible: {total_hits}")
            print(f"  Propiedades únicas extraídas: {len(self.properties)}")

        except Exception as e:
            print(f"Error durante el scraping: {e}")
            import traceback
            traceback.print_exc()

    def get_folder_name(self, tipo: str, operacion: str) -> str:
        """Genera el nombre de la carpeta: REMAX/REM-tipo+operacion(fecha)"""
        fecha = datetime.now().strftime("%Y-%m-%d")
        return f"REMAX/REM-{tipo}{operacion}({fecha})"

    def save_to_json(self, filename: str = "remax_propiedades.json", folder_name: str = None):
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
    print("RE/MAX BOLIVIA SCRAPER FLEXIBLE")
    print("=" * 60)
    print("\nEste scraper acepta cualquier URL de RE/MAX Bolivia")
    print("y extrae todas las propiedades con paginación automática.\n")

    if len(sys.argv) > 1:
        # URL pasada como argumento
        url = sys.argv[1]
        print(f"URL recibida: {url}\n")
    else:
        # Solicitar URL al usuario
        print("Ejemplos de URLs:")
        print("  https://remax.bo/search/casa/santa-cruz")
        print("  https://remax.bo/search/departamento/cochabamba")
        print()
        url = input("\nIngresa la URL de RE/MAX (o presiona Enter para usar casas en Santa Cruz): ").strip()

        if not url:
            # Usar URL por defecto
            url = "https://remax.bo/search/casa/santa-cruz"
            print(f"Usando URL por defecto: casas en Santa Cruz\n")

    # Crear scraper y extraer propiedades
    scraper = RemaxFlexibleScraper(url)
    scraper.scrape_all_pages()

    # Detectar tipo y operación de la URL para crear la carpeta
    tipo, location = scraper.extract_type_and_location_from_url(url)

    # Mapear tipo al formato de carpeta
    tipo_map = {
        'casa': 'casas',
        'departamento': 'deptos',
        'departamento-o-penthouse': 'deptos',
        'terreno': 'terrenos',
        'local': 'locales',
        'oficina': 'oficinas',
        'galpon': 'galpones'
    }
    tipo_folder = tipo_map.get(tipo, tipo)

    # Por defecto es venta (RE/MAX es mayormente venta)
    operacion = 'venta'

    # Crear nombre de carpeta
    folder_name = scraper.get_folder_name(tipo_folder, operacion)

    # Nombre del archivo JSON
    filename = f"{tipo_folder}_{operacion}.json"

    # Guardar resultados en la carpeta creada
    if scraper.properties:
        scraper.save_to_json(filename, folder_name)
    else:
        print("\nNo se encontraron propiedades")


if __name__ == "__main__":
    main()
