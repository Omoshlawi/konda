import { UsersModel } from "@/models";
import { User } from "../../dist/prisma";
import { NextFunction, Request, Response } from "express";
import { APIException } from "@/utils/exceptions";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user: User = (req as any).user;
    if (!user.isAdmin) {
      throw new APIException(403, {
        detail: "Must be an admin to access resource",
      });
    }
    return next();
  } catch (error) {
    next(error);
  }
};
