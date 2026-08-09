# syntax=docker/dockerfile:1

# =============================================================================
# GeoPricer Avalúos — Imagen de producción (Next.js 16 standalone)
# Multi-stage: deps → builder → runner (alpine, mínima)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: deps — instala dependencias y genera el cliente Prisma
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma

# npm ci dispara el postinstall (prisma generate) → engine correcto para alpine
RUN npm ci

# -----------------------------------------------------------------------------
# Stage 2: builder — build de Next.js + transpilación de seeders a JS
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build de Next.js → genera .next/standalone
RUN npm run build

# Transpilar los seeders (TypeScript) a JavaScript CommonJS puro,
# para poder correrlos en el runner con `node` (sin ts-node ni devDeps).
RUN npx tsc prisma/seed.ts prisma/seed-categorias.ts prisma/seed-config.ts prisma/seed-all.ts \
      --outDir prisma-dist \
      --module commonjs --moduleResolution node --target ES2017 \
      --esModuleInterop --skipLibCheck --types node

# -----------------------------------------------------------------------------
# Stage 3: runner — imagen final mínima de producción
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# netcat-openbsd: para esperar a la BD en el entrypoint
RUN apk add --no-cache netcat-openbsd

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# --- Build standalone de Next.js ---
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# --- Prisma: schema, CLI, cliente y engine (para db push + seeds en runtime) ---
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma-dist ./prisma-dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
# bcryptjs: usado por el seeder del admin al hashear la contraseña
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# --- Entrypoint ---
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Volumen para documentos subidos por los usuarios (persiste entre restarts)
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
VOLUME ["/app/public/uploads"]

# Marcador de inicializacion (volumen avaluos_initflag en el compose de prod).
# Debe existir y ser escribible por nextjs ANTES del 'USER nextjs' para que,
# al montarse el named volume, herede esta propiedad (sino seria de root).
RUN mkdir -p /initflag && chown -R nextjs:nodejs /initflag

EXPOSE 3000

USER nextjs

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
