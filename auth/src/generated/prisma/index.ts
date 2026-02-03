export class PrismaClient {
  [key: string]: any;

  constructor(_options?: unknown) {
    // Stub client for typechecking/builds without generated Prisma output.
  }
}

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}
