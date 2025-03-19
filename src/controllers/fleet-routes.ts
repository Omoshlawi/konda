import { NextFunction, Request, Response } from "express";
import { FleetRoutesModel } from "../models";
import { FleetRouteSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getFleetRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await FleetRoutesModel.findMany({
      where: { voided: false, fleetId: req.params.fleetId! },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetRoutesModel.findUniqueOrThrow({
      where: {
        id: req.params.fleetRouteId,
        voided: false,
        fleetId: req.params.fleetId!,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetRouteSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetRoutesModel.create({
      data: { ...validation.data, fleetId: req.params.fleetId! },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetRouteSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetRoutesModel.update({
      where: {
        id: req.params.fleetRouteId,
        voided: false,
        fleetId: req.params.fleetId!,
      },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetRouteSchema.partial().safeParseAsync(
      req.body
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetRoutesModel.update({
      where: {
        id: req.params.fleetRouteId,
        voided: false,
        fleetId: req.params.fleetId!,
      },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetRoutesModel.update({
      where: {
        id: req.params.fleetRouteId,
        voided: false,
        fleetId: req.params.fleetId!,
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

export const purgeFleetRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetRoutesModel.delete({
      where: {
        id: req.params.fleetRouteId,
        voided: false,
        fleetId: req.params.fleetId!,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
