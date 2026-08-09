/**
 * Mock Data para el Mapa Interactivo
 * 20 propiedades distribuidas en ciudades de Bolivia
 */

export interface Property {
  id: string
  title: string
  address: string
  city: string
  price: number
  bedrooms: number
  bathrooms: number
  area: number
  lat: number
  lng: number
  image: string
  type: 'house' | 'apartment' | 'land'
  status: 'available' | 'sold' | 'rented'
  /** Categoría original del inmueble (ProductCategoryEnum) — para filtros del mapa */
  categoria?: string
  /** Tipo de operación (OperationType: VENTA | ALQUILER | ANTICRETICO) — para filtros del mapa */
  operacion?: string
  /** Datos extra para el modal de detalle */
  cocheras?: number
  superficieConstruida?: number
  anoConstruccion?: number | null
  codigoInmueble?: string
  descripcion?: string | null
}

export const mockProperties: Property[] = [
  // COCHABAMBA (8 propiedades)
  {
    id: '1',
    title: 'Casa Moderna en Cala Cala',
    address: 'Calle 10, Cala Cala',
    city: 'Cochabamba',
    price: 285000,
    bedrooms: 4,
    bathrooms: 3,
    area: 280,
    lat: -17.3833,
    lng: -66.1667,
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },
  {
    id: '2',
    title: 'Departamento en Torre Europa',
    address: 'Av. Heroínas 450',
    city: 'Cochabamba',
    price: 145000,
    bedrooms: 2,
    bathrooms: 2,
    area: 95,
    lat: -17.3944,
    lng: -66.1569,
    image: 'https://images.unsplash.com/photo-1502672230176-e5b2f6264f31?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '3',
    title: 'Terreno en Zona Norte',
    address: 'Av. Santa Cruz 234',
    city: 'Cochabamba',
    price: 89000,
    bedrooms: 0,
    bathrooms: 0,
    area: 420,
    lat: -17.3656,
    lng: -66.1523,
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop',
    type: 'land',
    status: 'available'
  },
  {
    id: '4',
    title: 'Casa con Jardín en Tempranillo',
    address: 'Calle Los Claveles 45',
    city: 'Cochabamba',
    price: 320000,
    bedrooms: 5,
    bathrooms: 4,
    area: 350,
    lat: -17.3723,
    lng: -66.1789,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },
  {
    id: '5',
    title: 'Penthouse Vista Valle',
    address: 'Av. Ballivián 789',
    city: 'Cochabamba',
    price: 485000,
    bedrooms: 3,
    bathrooms: 3,
    area: 180,
    lat: -17.4012,
    lng: -66.1654,
    image: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'sold'
  },
  {
    id: '6',
    title: 'Casa Colonial Reformada',
    address: 'Calle Sucre 123',
    city: 'Cochabamba',
    price: 198000,
    bedrooms: 3,
    bathrooms: 2,
    area: 145,
    lat: -17.3890,
    lng: -66.1556,
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },
  {
    id: '7',
    title: 'Departamento Estudiantil',
    address: 'Calle Colombia 56',
    city: 'Cochabamba',
    price: 75000,
    bedrooms: 1,
    bathrooms: 1,
    area: 45,
    lat: -17.3767,
    lng: -66.1478,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'rented'
  },
  {
    id: '8',
    title: 'Casa de Campo en Tiquipaya',
    address: 'Carretera Antigua',
    city: 'Cochabamba',
    price: 225000,
    bedrooms: 4,
    bathrooms: 3,
    area: 380,
    lat: -17.3534,
    lng: -66.2012,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },

  // QUILLACOLLO (4 propiedades)
  {
    id: '9',
    title: 'Casa Nueva en Quillacollo',
    address: 'Av. Principal 456',
    city: 'Quillacollo',
    price: 165000,
    bedrooms: 3,
    bathrooms: 2,
    area: 120,
    lat: -17.3956,
    lng: -66.2834,
    image: 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },
  {
    id: '10',
    title: 'Departamento Moderno',
    address: 'Calle 6 de Agosto 78',
    city: 'Quillacollo',
    price: 98000,
    bedrooms: 2,
    bathrooms: 2,
    area: 85,
    lat: -17.4012,
    lng: -66.2767,
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '11',
    title: 'Terreno Residencial',
    address: 'Barrio Urkupiña',
    city: 'Quillacollo',
    price: 55000,
    bedrooms: 0,
    bathrooms: 0,
    area: 250,
    lat: -17.3889,
    lng: -66.2890,
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=300&fit=crop',
    type: 'land',
    status: 'available'
  },
  {
    id: '12',
    title: 'Casa con Piscina',
    address: 'Av. Perimetral 234',
    city: 'Quillacollo',
    price: 265000,
    bedrooms: 4,
    bathrooms: 3,
    area: 220,
    lat: -17.3934,
    lng: -66.2701,
    image: 'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },

  // SANTA CRUZ (4 propiedades)
  {
    id: '13',
    title: 'Penthouse de Lujo',
    address: 'Calle Sucre 560',
    city: 'Santa Cruz',
    price: 595000,
    bedrooms: 4,
    bathrooms: 4,
    area: 320,
    lat: -17.7833,
    lng: -63.1833,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '14',
    title: 'Casa Campestre',
    address: 'Carretera a Warnes',
    city: 'Santa Cruz',
    price: 380000,
    bedrooms: 5,
    bathrooms: 4,
    area: 450,
    lat: -17.7756,
    lng: -63.1789,
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&h=300&fit=crop',
    type: 'house',
    status: 'available'
  },
  {
    id: '15',
    title: 'Departamento Equipado',
    address: 'Av. San Martín 345',
    city: 'Santa Cruz',
    price: 135000,
    bedrooms: 2,
    bathrooms: 2,
    area: 90,
    lat: -17.7890,
    lng: -63.1756,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '16',
    title: 'Lote en Urbanización',
    address: 'Urb. Equipetrol',
    city: 'Santa Cruz',
    price: 72000,
    bedrooms: 0,
    bathrooms: 0,
    area: 300,
    lat: -17.7801,
    lng: -63.1876,
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0d9c?w=400&h=300&fit=crop',
    type: 'land',
    status: 'available'
  },

  // LA PAZ (4 propiedades)
  {
    id: '17',
    title: 'Departamento en Sopocachi',
    address: 'Calle Jaén 234',
    city: 'La Paz',
    price: 185000,
    bedrooms: 2,
    bathrooms: 2,
    area: 75,
    lat: -16.5056,
    lng: -68.1334,
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '18',
    title: 'Casa en San Miguel',
    address: 'Av. Mariscal Santa Cruz 678',
    city: 'La Paz',
    price: 325000,
    bedrooms: 4,
    bathrooms: 3,
    area: 210,
    lat: -16.5134,
    lng: -68.1256,
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&h=300&fit=crop',
    type: 'house',
    status: 'sold'
  },
  {
    id: '19',
    title: 'Penthouse con Vista',
    address: 'Zona Sur',
    city: 'La Paz',
    price: 675000,
    bedrooms: 5,
    bathrooms: 4,
    area: 380,
    lat: -16.4978,
    lng: -68.1290,
    image: 'https://images.unsplash.com/photo-1600573472592-991b9b3e1b67?w=400&h=300&fit=crop',
    type: 'apartment',
    status: 'available'
  },
  {
    id: '20',
    title: 'Terreno en Achumani',
    address: 'Calle 15 de Calacoto',
    city: 'La Paz',
    price: 125000,
    bedrooms: 0,
    bathrooms: 0,
    area: 180,
    lat: -16.5090,
    lng: -68.1389,
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=300&fit=crop',
    type: 'land',
    status: 'available'
  },
]
