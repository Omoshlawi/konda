import { NextFunction, Request, Response } from "express";

export const cookieToHeader = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookieToken = req.cookies["session-token"];
    const sessionToken = req.header("x-access-token");
    req.headers["x-access-token"] = sessionToken ?? cookieToken;
    next();
  } catch (error) {
    next(error);
  }
};
