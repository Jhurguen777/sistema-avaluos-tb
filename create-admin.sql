-- Crear usuario administrador
-- Password: admin123
-- El hash es de bcrypt (cost factor 10)

INSERT INTO users (id, email, name, password, role, "isActive", "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-user-id-001',
  'admin@geopricer.com',
  'Administrador',
  '$2a$10$YourBcryptHashHereWillBeGenerated', -- Reemplazar con hash real
  'ADMIN',
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

SELECT 'Usuario administrador creado' as message;
