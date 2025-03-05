import { UsersModel } from "@/models";
import { TokenPayload } from "@/types";
import { configuration } from "@/utils/constants";
import { APIException } from "@/utils/exceptions";
import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError, verify } from "jsonwebtoken";

const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("x-access-token");
  try {
    if (!token)
      throw new APIException(401, { detail: "Unauthorized - Token missing" });
    const { userId, type: tokenType }: TokenPayload = verify(
      token,
      configuration.auth.auth_secrete as string
    ) as TokenPayload;
    if (tokenType !== "access")
      throw new APIException(401, {
        detail: "Unauthorized - Invalid token type",
      });

    const user = await UsersModel.findUnique({
      where: { id: userId },
      include: { person: true },
    });
    if (!user)
      throw new APIException(401, { detail: "Unauthorized - Invalid Token" });

    req.user = user;
    return next();
  } catch (error: unknown) {
    if (error instanceof TokenExpiredError) {
      return next(
        new APIException(401, { detail: "Unauthorized - Token expired" })
      );
    } else if (error instanceof JsonWebTokenError) {
      return next(
        new APIException(401, { detail: "Unauthorized - Invalid Token" })
      );
    } else if (error instanceof APIException) {
      return next(error);
    }
    return next(new APIException(500, { detail: "Internal Server Error" }));
  }
};

export default authenticate;
