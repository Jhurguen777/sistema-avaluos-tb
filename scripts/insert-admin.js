// Script para insertar usuario admin directamente en PostgreSQL
const bcrypt = require('bcryptjs');

async function main() {
  const hash = '$2b$10$SJt86vRrxS5IfjWd9fGkOOBXuRlKlHgmnB6sFjywy7t648Mfg6WTO';

  console.log('Ejecuta este SQL en tu base de datos PostgreSQL:');
  console.log('\nPuedes usar pgAdmin, psql en PowerShell, o una herramienta similar.\n');
  console.log('--- SQL ---');
  console.log(`INSERT INTO users (id, email, name, password, role, "isActive", "emailVerified", "createdAt", "updatedAt")`);
  console.log(`VALUES (`);
  console.log(`  'admin-user-001',`);
  console.log(`  'admin@geopricer.com',`);
  console.log(`  'Administrador',`);
  console.log(`  '${hash}',`);
  console.log(`  'ADMIN',`);
  console.log(`  true,`);
  console.log(`  NOW(),`);
  console.log(`  NOW(),`);
  console.log(`  NOW()`);
  console.log(`)`);
  console.log(`ON CONFLICT (email) DO UPDATE SET`);
  console.log(`  name = EXCLUDED.name,`);
  console.log(`  password = EXCLUDED.password,`);
  console.log(`  role = EXCLUDED.role,`);
  console.log(`  "isActive" = EXCLUDED."isActive";`);
  console.log('--- FIN SQL ---');
  console.log('\nO abre Prisma Studio con:');
  console.log('npx prisma studio');
  console.log('\nY agrega el usuario manualmente con estos datos:');
  console.log('Email: admin@geopricer.com');
  console.log('Password: admin123');
  console.log('Hash (en campo password): ' + hash);
  console.log('Role: ADMIN');
  console.log('isActive: true');
}

main();
