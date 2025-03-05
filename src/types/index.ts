import { type User } from "../../dist/prisma";

export interface TokenPayload {
  userId: string; //user id
  type: "refresh" | "access";
  organizationId?: string;
  roles?: string[] | string; // Array of role ids or "*" for group admin
  // personId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
