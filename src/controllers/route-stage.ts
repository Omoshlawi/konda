import { NextFunction, Request, Response } from "express";
import { RouteStagesModel } from "../models";
import { RouteStageschema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getRouteStages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await RouteStagesModel.findMany({
      where: { voided: false, routeId: req.params.routeId! },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RouteStagesModel.findUniqueOrThrow({
      where: {
        id: req.params.routeStageId,
        voided: false,
        routeId: req.params.routeId!,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteStageschema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RouteStagesModel.create({
      data: { ...validation.data, routeId: req.params.routeId! },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteStageschema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RouteStagesModel.update({
      where: {
        id: req.params.routeStageId,
        voided: false,
        routeId: req.params.routeId!,
      },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RouteStageschema.partial().safeParseAsync(
      req.body
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RouteStagesModel.update({
      where: {
        id: req.params.routeStageId,
        voided: false,
        routeId: req.params.routeId!,
      },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RouteStagesModel.update({
      where: {
        id: req.params.routeStageId,
        voided: false,
        routeId: req.params.routeId!,
      },
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

export const purgeRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RouteStagesModel.delete({
      where: {
        id: req.params.routeStageId,
        voided: false,
        routeId: req.params.routeId!,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
