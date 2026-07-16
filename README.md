# Sistema-de-Valuos-Inmobiliarios-Dirigido-
# GeoPricer Avalúos Pro

### Sistema Profesional de Avalúos Inmobiliarios para Bolivia

---

# Descripción General

GeoPricer Avalúos Pro es una plataforma web especializada para la elaboración, gestión y emisión de avalúos inmobiliarios técnicos.

El sistema está orientado principalmente a:

* Administradores
* Arquitectos
* Ingenieros Civiles
* Valuadores

No está diseñado como un portal inmobiliario público tradicional, sino como una herramienta profesional de uso interno para la valoración técnica de inmuebles.

---

# Objetivos del Sistema

Permitir:

* Registro de inmuebles
* Gestión de propietarios
* Gestión de solicitantes
* Elaboración de avalúos técnicos
* Cálculo de valor de terreno
* Cálculo de valor de construcción
* Cálculo de depreciación
* Homologación de comparables
* Gestión de fotografías
* Gestión documental
* Generación de reportes PDF
* Generación de mapas de ubicación
* Generación de radar de equipamientos cercanos
* Base de datos de comparables de mercado
* Gestión de alquileres
* Gestión de anticréticos
* Auditoría de cambios

---

# Tecnologías

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* Shadcn/UI
* React Hook Form
* Zod
* Leaflet
* OpenStreetMap

## Backend

* Next.js Full Stack
* API Routes
* Server Actions

## Base de Datos

* PostgreSQL
* PostGIS

## ORM

* Prisma ORM

## Archivos

* MinIO

## PDF

* Puppeteer

## Infraestructura

* VPS Contabo
* Dominio GoDaddy
* Docker
* Docker Compose
* Nginx

---

# Roles del Sistema

## Administrador

Permisos:

* Crear usuarios
* Editar usuarios
* Desactivar usuarios
* Asignar roles
* Gestionar parámetros globales
* Gestionar tablas de homologación
* Gestionar factores de ajuste
* Ver todos los avalúos
* Aprobar avalúos
* Generar reportes

---

## Arquitecto

Permisos:

* Crear avalúos
* Editar avalúos
* Registrar construcciones
* Subir fotografías
* Generar reportes

---

## Ingeniero Civil

Permisos:

* Crear avalúos
* Registrar depreciaciones
* Registrar valores de reposición
* Revisar construcciones
* Generar reportes

---

# Módulos del Sistema

## Seguridad

* Usuarios
* Roles
* Permisos
* Sesiones
* Login Attempts
* Auditoría

## Inmuebles

* Registro de inmuebles
* Geolocalización
* Fotografías
* Categorías

## Avalúos

* Avalúos comerciales
* Avalúos de alquiler
* Avalúos de venta rápida
* Avalúos de capital comercial

## Terrenos

* Valor unitario
* Morfología
* Forma del lote
* Frente
* Fondo
* Esquina
* Tipo de vía

## Construcciones

* Año de construcción
* Vida útil
* Estado de conservación
* Categoría constructiva
* Valor de reposición
* Depreciación

## Mercado

* Comparables de venta
* Comparables de alquiler

## Documentos

* Folio Real
* Catastro
* Impuestos
* Planos
* Avalúos PDF

## Mapas

* Ubicación del inmueble
* Radar de equipamientos
* Capturas para PDF

---

# Estructura General de Base de Datos

## Seguridad

users

roles

permissions

role_user

role_permissions

sessions

login_attempts

audit_logs

---

## Inmuebles

product_category

products

product_locations

product_images

---

## Avalúos

avaluos

terrenos

construcciones

factores_homologacion

resultados_avaluo

avaluo_entorno

avaluo_mapas

---

## Mercado

comparables_venta

comparables_alquiler

---

## Documentos

documentos

---

# Tabla Principal de Inmuebles

products

Campos principales:

* codigo_inmueble
* nombre
* categoria
* operacion
* precio_usd
* precio_bob
* superficie_util
* superficie_construida
* ambientes
* habitaciones
* banos
* cocheras
* ano_construccion
* descripcion

---

# Tipos de Operación

* Venta
* Alquiler
* Anticrético

---

# Tipos de Inmueble

* Casa
* Departamento
* Penthouse
* Terreno
* Local Comercial
* Oficina
* Galpón
* Quinta
* Monoambiente
* Dúplex
* Condominio
* Edificio
* Cochera
* Habitación
* Otros

---

# Flujo de Avalúo

1. Registrar inmueble
2. Registrar ubicación
3. Registrar fotografías
4. Registrar documentos
5. Registrar características del terreno
6. Registrar características constructivas
7. Registrar comparables
8. Calcular homologación
9. Calcular depreciación
10. Calcular valor comercial
11. Generar mapas
12. Generar radar de equipamientos
13. Generar PDF final

---

# Radar de Equipamientos

El sistema deberá generar automáticamente un análisis del entorno basado en la ubicación geográfica del inmueble.

Equipamientos a considerar:

* Hospitales
* Clínicas
* Universidades
* Colegios
* Mercados
* Parques
* Bancos
* Iglesias
* Transporte Público
* Centros Comerciales
* Entidades Públicas

Para cada equipamiento se almacenará:

* Nombre
* Tipo
* Dirección
* Distancia
* Coordenadas

---

# Mapa de Radar

El sistema deberá generar:

* Captura de ubicación
* Captura de radar
* Radio configurable (250m, 500m, 750m, 1000m)

Estas capturas formarán parte del PDF final.

---

# Homologación

Factores configurables:

* Factor Ubicación
* Factor Vía
* Factor Frente
* Factor Esquina
* Factor Morfológico
* Factor Servicios
* Factor Equipamiento

Restricción:

Ningún factor podrá superar el valor 1.50.

---

# Depreciación

Vida útil estándar:

50 años

Cálculo:

Depreciación = Años Transcurridos / Vida Útil

---

# Resultados del Avalúo

El sistema almacenará:

* Valor Terreno
* Valor Reposición
* Depreciación
* Valor Construcción
* Valor Comercial
* Valor Venta Rápida
* Valor Alquiler
* Valor Capital Comercial

---

# Comparables de Mercado

## Venta

* Precio Oferta
* Precio Cierre
* Precio por m²

## Alquiler

* Precio Oferta
* Precio Cierre
* Precio por m²

---

# Documentos Soportados

* Folio Real
* Catastro
* Impuestos
* Planos
* Fotografías
* Avalúo PDF

---

# Auditoría

Toda modificación deberá registrar:

* Usuario
* Acción
* Fecha
* Registro afectado
* Valor anterior
* Valor nuevo
* Dirección IP

---

# Requisitos del Sistema

## Requisitos Mínimos

* Node.js 18.x o superior
* npm 9.x o superior / yarn 1.22.x o superior / pnpm 8.x o superior
* PostgreSQL 14.x o superior (con extensión PostGIS)
* Docker 20.x y Docker Compose 2.x (para despliegue en contenedores)
* Mínimo 2GB RAM
* Mínimo 10GB espacio en disco

## Requisitos Opcionales

* MinIO (para almacenamiento de archivos local o en la nube)
* Nginx (para producción como reverse proxy)
* VPS con al menos 2CPU y 4GB RAM (para producción)

---

# Instalación y Configuración

## 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/Sistema-de-Valuos-Inmobiliarios-Dirigido-.git
cd Sistema-de-Valuos-Inmobiliarios-Dirigido-
```

## 2. Instalar Dependencias

```bash
npm install
# o
yarn install
# o
pnpm install
```

## 3. Configurar Base de Datos

### Opción A: PostgreSQL Local

```bash
# Crear base de datos
createdb geopricer_avaluos

# Habilitar extensión PostGIS
psql -d geopricer_avaluos -c "CREATE EXTENSION postgis;"
```

### Opción B: Docker (Recomendado para Desarrollo)

```bash
# Levantar contenedor PostgreSQL
docker-compose up -d postgres

# Esperar unos segundos y verificar
docker-compose logs postgres
```

## 4. Configurar Variables de Entorno

Copiar el archivo de ejemplo:

```bash
cp .env.example .env
```

Editar `.env` con tus credenciales (ver sección Variables de Entorno abajo).

## 5. Ejecutar Migraciones

```bash
npx prisma migrate dev
# o
npm run db:migrate
```

## 6. Generar Cliente Prisma

```bash
npx prisma generate
# o
npm run db:generate
```

## 7. (Opcional) Sembrar Base de Datos

```bash
npx prisma db seed
# o
npm run db:seed
```

## 8. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

El sistema estará disponible en: http://localhost:3000

---

# Variables de Entorno

Crear archivo `.env` con las siguientes variables:

## Base de Datos

```env
# PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/geopricer_avaluos?schema=public"
```

## Autenticación

```env
# NextAuth
NEXTAUTH_SECRET="tu-secret-super-seguro-cambiar-esto"
NEXTAUTH_URL="http://localhost:3000"
```

## Almacenamiento (MinIO/S3)

```env
# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="tu-access-key"
MINIO_SECRET_KEY="tu-secret-key"
MINIO_USE_SSL="false"
MINIO_BUCKET="geopricer-avaluos"
```

## API Externas

```env
# Mapas (OpenStreetMap es gratuito, opcional: Google Maps)
NEXT_PUBLIC_MAPBOX_TOKEN="tu-token-si-usas-mapbox"
NEXT_PUBLIC_GOOGLE_MAPS_KEY="tu-api-key-si-usas-google-maps"
```

## Configuración de la Aplicación

```env
# URL de la aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Configuración PDF
NEXT_PUBLIC_PDF_DOWNLOAD_TIMEOUT="30000"
```

---

# Scripts de Desarrollo

## Disponibles en package.json

```bash
# Desarrollo
npm run dev              # Inicia servidor en modo desarrollo

# Producción
npm run build           # Construye la aplicación para producción
npm run start           # Inicia servidor en modo producción

# Base de Datos
npm run db:migrate      # Ejecuta migraciones pendientes
npm run db:generate     # Genera cliente Prisma
npm run db:seed         # Sembrar datos iniciales
npm run db:reset        # Resetea base de datos (peligroso)
npm run db:studio       # Abre Prisma Studio (visor de DB)

# Calidad de Código
npm run lint            # Verifica linting de código
npm run lint:fix        # Corrige problemas de linting automáticamente
npm run format          # Formatea código con Prettier
npm run type-check      # Verifica tipos TypeScript

# Testing
npm run test            # Ejecuta tests
npm run test:watch      # Ejecuta tests en modo watch
npm run test:coverage   # Ejecuta tests con cobertura
```

---

# Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        USUARIOS                              │
│  [Administradores] [Arquitectos] [Ingenieros] [Valuadores]  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      NEXT.JS APP                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │                  FRONTEND LAYER                     │    │
│  │  [React Components] [Shadcn/UI] [Leaflet Maps]      │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │                  API LAYER                          │    │
│  │  [API Routes] [Server Actions] [NextAuth]          │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │                  BUSINESS LAYER                     │    │
│  │  [Avalúos] [Homologación] [Depreciación] [PDF]     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │     MinIO       │ │   OpenStreet    │
│   + PostGIS     │ │  (Archivos)     │ │      Map        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

## Flujo de Datos Simplificado

```
Usuario → Next.js → Prisma ORM → PostgreSQL
                ↓
            MinIO (PDF/Imágenes)
                ↓
            OpenStreetMap (Mapas)
```

---

# Fase 1 (MVP)

Incluye:

* Autenticación
* Roles
* Inmuebles
* Fotografías
* Avalúos
* Terrenos
* Construcciones
* Depreciación
* Comparables
* PDF
* Mapas
* Radar de equipamientos

---

# Fase 2

Incluye:

* Catastro avanzado
* Estadísticas de mercado
* Historial de precios
* Dashboards
* Automatización de homologación
* Reportes ejecutivos
* Integración con fuentes externas

---

# Objetivo Final

Convertir GeoPricer Avalúos Pro en una plataforma profesional de valoración inmobiliaria para Bolivia, permitiendo a arquitectos e ingenieros generar avalúos técnicos completos, respaldados por evidencia documental, geográfica y de mercado.
