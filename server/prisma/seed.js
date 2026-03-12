const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Create Queue
  const queue = await prisma.queue.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Main Queue',
    },
  });
  console.log('Main queue created:', queue);

  // Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN'
    }
  });
  console.log('Admin user created:', admin.username);

  // Initialize Settings
  await prisma.setting.upsert({
    where: { key: 'requireReason' },
    update: {},
    create: { key: 'requireReason', value: 'false' }
  });
  console.log('Default settings initialized');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
