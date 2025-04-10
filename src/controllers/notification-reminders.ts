import { NextFunction, Request, Response } from "express";
import { NotificationsModel, RouteStagesModel, TripsModel } from "../models";
import { getMultipleOperationCustomRepresentationQeury } from "@/utils/db";
import {
  NotificationReminderFilterSchema,
  NotificationReminderSchema,
} from "@/schema";
import { APIException } from "@/utils/exceptions";
import { getLatestEntriesFromStream } from "@/utils/stream";
import { FleetRouteInterStageMovement } from "@/types";

export const getNotificationReminders = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await NotificationReminderFilterSchema.safeParseAsync(
      req.query
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());

    const { fleetNo, ...filters } = validation.data;
    const results = await NotificationsModel.findMany({
      where: {
        AND: [{ ...filters, trip: { fleet: { name: fleetNo } } }],
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json({ results });
  } catch (error) {
    next(error);
  }
};

export const getNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await NotificationsModel.findUniqueOrThrow({
      where: { id: req.params.reminderId },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const addNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await NotificationReminderSchema.safeParseAsync(
      req.body
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const { fleetNo, ...data } = validation.data;

    const expoPushToken = data.expoPushToken ?? req.user?.expoPushToken;
    if (!expoPushToken)
      throw new APIException(400, { expoPushToken: { _errors: ["Required"] } });
    const currentTripState =
      await await getLatestEntriesFromStream<FleetRouteInterStageMovement>(
        "fleet_movement_stream",
        ({ data }) => data?.fleetNo === fleetNo
      );

    if (!currentTripState[0] || !currentTripState[0].data)
      throw new APIException(400, {
        _errors: ["Could not find fleet trip information"],
      });
    // Ensure trip is ongoing
    const currentOngoingTrip = await TripsModel.findUnique({
      where: {
        id: currentTripState[0].data.tripId,
        endStageId: null,
        endedAt: null,
      },
    });
    if (!currentOngoingTrip)
      throw new APIException(400, {
        _errors: ["Could not find active/current trip for the fleet"],
      });

    const routeStage = await RouteStagesModel.findUnique({
      where: { id: data.routeStageId },
      include: {
        stage: true,
        route: true,
      },
    });

    if (!routeStage)
      throw new APIException(400, { _errors: ["Route stage not found"] });

    const item = await NotificationsModel.create({
      data: {
        ...data,
        expoPushToken,
        message: `You have reached your destination ${routeStage.stage.name} on route ${routeStage.route.name} with fleet ${fleetNo}`,
        userId: req?.user?.id,
        tripId: currentOngoingTrip.id,
      },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const updateNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation = await NotificationReminderSchema.safeParseAsync(
      req.body
    );
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await NotificationsModel.update({
      where: { id: req.params.reminderId },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const patchNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validation =
      await NotificationReminderSchema.partial().safeParseAsync(req.body);
    if (!validation.success)
      throw new APIException(400, validation.error.format());
    const item = await NotificationsModel.update({
      where: { id: req.params.reminderId },
      data: validation.data,
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};

export const deleteNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    try {
      const item = await NotificationsModel.delete({
        where: { id: req.params.reminderId },
        ...getMultipleOperationCustomRepresentationQeury(
          req.query?.v as string
        ),
      });
      return res.json(item);
    } catch (error) {
      next(error);
    }
  } catch (error) {
    next(error);
  }
};

export const purgeNotificationReminder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const item = await NotificationsModel.delete({
      where: { id: req.params.reminderId },
      ...getMultipleOperationCustomRepresentationQeury(req.query?.v as string),
    });
    return res.json(item);
  } catch (error) {
    next(error);
  }
};
