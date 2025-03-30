import { NextFunction, Request, Response } from "express";
import { FleetsModel } from "../models";
import { FleetFilterSchema, FleetSchema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getFleets = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetFilterSchema.safeParseAsync(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search, ...filters } = validation.data;
    const results = await FleetsModel.findMany({
      where: {
        AND: [
          { voided: false, ...filters },
          {
            OR: search
              ? [
                  {
                    name: {
                      contains: search, //  mode: "insensitive"
                    },
                  },
                  {
                    plateNumber: {
                      contains: search, //  mode: "insensitive"
                    },
                  },
                ]
              : undefined,
          },
        ],
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetsModel.findUniqueOrThrow({
      where: { id: req.params.fleetId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetsModel.create({
      data: {
        ...validation.data,
        plateNumber: validation.data.plateNumber.toUpperCase(),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetSchema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetsModel.update({
      where: { id: req.params.fleetId, voided: false },
      data: {
        ...validation.data,
        plateNumber: validation.data.plateNumber.toUpperCase(),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await FleetSchema.partial().safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await FleetsModel.update({
      where: { id: req.params.fleetId, voided: false },
      data: {
        ...validation.data,
        plateNumber: validation.data?.plateNumber?.toUpperCase(),
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetsModel.update({
      where: { id: req.params.fleetId, voided: false },
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

export const purgeFleet = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await FleetsModel.delete({
      where: { id: req.params.fleetId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
