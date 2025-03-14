import { NextFunction, Request, Response } from "express";
import { RoutesModel } from "../models";
import { RouteSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await RoutesModel.findMany({
      where: { voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutesModel.findUniqueOrThrow({
      where: { id: req.params.routeId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutesModel.create({
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutesModel.update({
      where: { id: req.params.routeId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteSchema.partial().safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutesModel.update({
      where: { id: req.params.routeId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutesModel.update({
      where: { id: req.params.routeId, voided: false },
      data: {
        voided: true,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const purgeRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutesModel.delete({
      where: { id: req.params.routeId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
