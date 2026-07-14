import { PrismaClient } from '@prisma/client';
import { seedMenuCatalog } from './data/seedMenuCatalog';

const prisma = new PrismaClient();

async function main() {
  await seedMenuCatalog(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
