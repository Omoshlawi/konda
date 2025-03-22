import { NextFunction, Request, Response } from "express";
import { RouteStagesModel } from "../models";
import { RouteStageschema } from "@/schema";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import { APIException } from "@/utils/exceptions";
import db from "@/services/db";

export const getRouteStages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await RouteStagesModel.findMany({
      where: { routeId: req.params.routeId! },
      orderBy: { order: "asc" },
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
    const order = await RouteStagesModel.count({
      where: { routeId: req.params.routeId! },
    });
    const item = await RouteStagesModel.create({
      data: {
        ...validation.data,
        routeId: req.params.routeId!,
        order: order,
      },
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
    const item = await RouteStagesModel.delete({
      where: {
        id: req.params.routeStageId,
        routeId: req.params.routeId!,
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
        routeId: req.params.routeId!,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const shiftRouteStage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const action = req.params.shiftDirection as "up" | "down";
    const currStageOrder = await RouteStagesModel.findUniqueOrThrow({
      where: {
        id: req.params.routeStageId,
        routeId: req.params.routeId!,
      },
      select: { order: true },
    });
    const currRouteStagesCount = await RouteStagesModel.count({
      where: { routeId: req.params.routeId! },
    });

    if (action === "up" && currStageOrder.order === 0) {
      throw new APIException(400, {
        _errors: ["Cant shift the first stage upward"],
      });
    }
    if (
      action === "down" &&
      currStageOrder.order === currRouteStagesCount - 1
    ) {
      throw new APIException(400, {
        _errors: ["Cant shift the last stage downward"],
      });
    }
    const adjuscentStage = await RouteStagesModel.findFirst({
      where: {
        routeId: req.params.routeId!,
        order:
          action === "up" ? currStageOrder.order - 1 : currStageOrder.order + 1,
      },
      select: { id: true, order: true },
    });
    if (!adjuscentStage) {
      throw new APIException(400, {
        _errors: ["No adjuscent stage found"],
      });
    }

    // Use a transaction to ensure atomic swapping of orders
    const result = await db.$transaction([
      // Update current stage with adjacent stage's order
      RouteStagesModel.update({
        where: {
          id: req.params.routeStageId,
          routeId: req.params.routeId!,
        },
        data: {
          order: adjuscentStage.order,
        },
        ...getMultipleOperationCustomRepresentationQeury(
          req.query?.v as string
        ),
      }),
      // Update adjacent stage with current stage's order
      RouteStagesModel.update({
        where: {
          id: adjuscentStage.id,
          routeId: req.params.routeId!,
        },
        data: {
          order: currStageOrder.order,
        },
      }),
    ]);

    return res.json(result[0]); // Return the updated current stage
  } catch (error) {
    next(error);
  }
};
