import { UsersModel } from "@/models";
import logger from "@/services/logger";
import { TokenPayload } from "@/types";
import { configuration } from "@/utils/constants";
import { APIException } from "@/utils/exceptions";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";

const optionallyAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("x-access-token");
  if (!token) {
    return next();
  }
  try {
    const { userId, type: tokenType }: TokenPayload = verify(
      token,
      configuration.auth.auth_secrete as string
    ) as TokenPayload;
    if (tokenType !== "access") {
      logger.warn("[Optional-auth] Unauthorized - Invalid token type");
      return next();
    }

    const user = await UsersModel.findUnique({
      where: { id: userId },
      include: { person: true },
    });
    if (!user) {
      logger.warn(
        "[Optional-auth] Unauthorized - Invalid Token when optionally authenticating"
      );
      return next();
    }
    req.user = user;
    return next();
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      logger.warn("[Optional-auth] Unauthorized - Token expired");
      return next();
    } else if (error instanceof JsonWebTokenError) {
      logger.warn("[Optional-auth] Unauthorized - Invalid Token");
      return next();
    }
    return next(new APIException(500, { detail: "Internal Server Error" }));
  }
};

export default optionallyAuthenticate;
