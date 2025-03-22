import { NextFunction, Request, Response } from "express";

const isUUID = (value: string) => {
  const regex =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/;
  return regex.test(value);
};

export const validateUUIDPathParam =
  (paramName: string) =>
  async (req: Request, response: Response, next: NextFunction) => {
    try {
      req;
      if (!isUUID(req.params[paramName] as string))
        throw { status: 404, errors: { detail: "Not found" } };
      return next();
    } catch (error) {
      return next(error);
    }
  };

export const validateRegexPathParamas =
  (paramName: string, regex: RegExp) =>
  async (req: Request, response: Response, next: NextFunction) => {
    try {
      req;
      if (!regex.test(req.params[paramName] as string))
        throw { status: 404, errors: { detail: "Not found" } };
      return next();
    } catch (error) {
      return next(error);
    }
  };

export const validateCustomPathParam = (
  paramName: string,
  validator: (value: string) => boolean
) => {
  return async (req: Request, response: Response, next: NextFunction) => {
    try {
      req;
      if (!validator(req.params[paramName] as string))
        throw { status: 404, errors: { detail: "Not found" } };
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
