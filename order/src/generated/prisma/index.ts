import { PrismaClient } from "./client.js";

export { PrismaClient };

export enum OrderStatus {
  PENDING = "PENDING",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  ARRIVING = "ARRIVING",
}

export namespace Prisma {
  export type TransactionClient = PrismaClient;
}
