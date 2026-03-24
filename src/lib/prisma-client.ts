import { PrismaClient } from "@prisma/client";
import { prisma as prismaBase } from "./prisma";

// Reexport tipado para manter o IntelliSense sincronizado com o client gerado.
export const prisma: PrismaClient = prismaBase;
