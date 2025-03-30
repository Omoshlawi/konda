import { NextFunction, Request, Response } from "express";
import { StagesModel } from "../models";
import { StagesFilterShema, StagesShema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";

export const getStages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await StagesFilterShema.safeParseAsync(req.query);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { search, includeOnlyActiveFleetRoutes, fleetNo, ...filters } =
      validation.data;
    const results = await StagesModel.findMany({
      where: {
        AND: [
          {
            voided: false,
            ...filters,
            routes: {
              some: {
                route: {
                  fleets: {
                    some: {
                      fleet: { name: fleetNo },
                      isActive:
                        includeOnlyActiveFleetRoutes &&
                        includeOnlyActiveFleetRoutes === "true"
                          ? true
                          : includeOnlyActiveFleetRoutes &&
                            includeOnlyActiveFleetRoutes === "false"
                          ? false
                          : undefined,
                    },
                  },
                },
              },
            },
          },
          {
            OR: search
              ? [
                  {
                    name: {
                      contains: search,
                      //  mode: "insensitive"
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

export const getStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await StagesModel.findUniqueOrThrow({
      where: { id: req.params.stageId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await StagesShema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await StagesModel.create({
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await StagesShema.safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await StagesModel.update({
      where: { id: req.params.stageId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await StagesShema.partial().safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await StagesModel.update({
      where: { id: req.params.stageId, voided: false },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await StagesModel.update({
      where: { id: req.params.stageId, voided: false },
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

export const purgeStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await StagesModel.delete({
      where: { id: req.params.stageId, voided: false },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
