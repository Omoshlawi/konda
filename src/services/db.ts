import { PrismaClient } from "../../dist/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient().$extends({
    name: "fullName",
    result: {
      person: {
        name: {
          needs: { firstName: true, lastName: true },
          compute({ firstName, lastName }) {
            if (!firstName && !lastName) return null;
            if (firstName && lastName) return `${firstName} ${lastName}`;
            if (!firstName) return lastName;
            if (!lastName) return firstName;
          },
        },
      },
    },
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
