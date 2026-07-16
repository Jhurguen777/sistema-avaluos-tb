const bcrypt = require('bcryptjs');

async function generateHash() {
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nSQL para insertar el usuario:');
  console.log(`INSERT INTO users (id, email, name, password, role, "isActive", "emailVerified", "createdAt", "updatedAt")`);
  console.log(`VALUES ('admin-user-001', 'admin@geopricer.com', 'Administrador', '${hash}', 'ADMIN', true, NOW(), NOW(), NOW());`);
}

generateHash().catch(console.error);
