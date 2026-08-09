-- Habilita la extensión PostGIS en la base de datos.
-- Es idempotente (IF NOT EXISTS), seguro de re-ejecutar.
-- Requerida por los módulos `mapas` y `radar` (queries geoespaciales crudas).
CREATE EXTENSION IF NOT EXISTS postgis;
