import { NextFunction, Request, Response } from "express";
import { RoutePricingsModel } from "../models";
import { RoutePricingSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getRoutePricings = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await RoutePricingsModel.findMany({
      where: { voided: false, routeId: req.params.routeId! },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutePricingsModel.findUniqueOrThrow({
      where: {
        id: req.params.routePricingId,
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

export const addRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RoutePricingSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutePricingsModel.create({
      data: {
        ...validation.data,
        routeId: req.params.routeId!,
        activeDays: validation.data.activeDays.join(","),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RoutePricingSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutePricingsModel.update({
      where: {
        id: req.params.routePricingId,
        voided: false,
        routeId: req.params.routeId!,
      },
      data: {
        ...validation.data,
        activeDays: validation.data.activeDays.join(","),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await RoutePricingSchema.partial().safeParseAsync(
      req.body
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await RoutePricingsModel.update({
      where: {
        id: req.params.routePricingId,
        voided: false,
        routeId: req.params.routeId!,
      },
      data: {
        ...validation.data,
        activeDays: validation.data.activeDays?.join(","),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutePricingsModel.update({
      where: {
        id: req.params.routePricingId,
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

export const purgeRoutePricing = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await RoutePricingsModel.delete({
      where: {
        id: req.params.routePricingId,
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
