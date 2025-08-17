import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Optional helper for graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
