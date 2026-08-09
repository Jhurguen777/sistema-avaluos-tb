#!/bin/sh
set -e

# Binario de prisma invocado directamente (sin depender de npx ni symlinks)
PRISMA="node ./node_modules/prisma/build/index.js"

# Marcador de inicializacion completada. Vive en el volumen 'avaluos_initflag'
# (persiste entre restarts). Su existencia evita repetir schema-sync + seeds
# en CADA arranque, lo que antes podia destruir datos con --accept-data-loss.
# Para forzar re-inicializacion (ej. cambio de schema.prisma):
#   docker compose -f docker-compose.prod.yml run --rm avaluos-app rm /initflag/done
INIT_FLAG="/initflag/done"

echo "=== GeoPricer Avaluos — Inicializacion ==="

# 1) Esperar a que la BD acepte conexiones TCP
echo ">>> Esperando a la base de datos (avaluos-db:5432)..."
until nc -z avaluos-db 5432; do
  echo "    BD no disponible, reintentando en 2s..."
  sleep 2
done
echo "    [OK] BD alcanzable."

# 2) Habilitar PostGIS (idempotente)
echo ">>> Habilitando extension PostGIS..."
$PRISMA db execute --file ./prisma/init-postgis.sql --schema ./prisma/schema.prisma
echo "    [OK] PostGIS listo."

# 3) Sincronizar schema + seeds: SOLO la primera vez (marcador /initflag/done).
#    Esto evita correr 'db push --accept-data-loss' en cada restart, lo cual
#    podria destruir datos silenciosamente si schema.prisma llegara a cambiar.
if [ ! -f "$INIT_FLAG" ]; then
  echo ">>> Primera inicializacion detectada (no existe $INIT_FLAG)."

  echo ">>> Sincronizando schema (prisma db push)..."
  $PRISMA db push --accept-data-loss --skip-generate --schema ./prisma/schema.prisma
  echo "    [OK] Schema sincronizado."

  echo ">>> Ejecutando seed maestro (admin + categorias + config)..."
  node ./prisma-dist/seed-all.js
  echo "    [OK] Seed completado."

  touch "$INIT_FLAG"
  echo "    [OK] Inicializacion marcada como completa ($INIT_FLAG)."
else
  echo ">>> Inicializacion ya completada antes ($INIT_FLAG existe). Se omite schema-sync y seeds."
fi

# 4) Arrancar el servidor Next.js (exec para que reciba SIGTERM correctamente)
echo ">>> Iniciando Next.js en el puerto ${PORT:-3000}..."
exec node server.js
