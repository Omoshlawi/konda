import { z } from "zod";
import { type User } from "../../dist/prisma";
import {
  FleetRouteInterStageMovementSchema,
  GPSSensorDataSchema,
} from "@/schema";

export interface TokenPayload {
  userId: string; //user id
  type: "refresh" | "access";
  organizationId?: string;
  roles?: string[] | string; // Array of role ids or "*" for group admin
  // personId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export type TraversalDirection = "forward" | "reverse";

export type FleetRouteInterStageMovement = z.infer<
  typeof FleetRouteInterStageMovementSchema
>;

export type GPSSesorData = z.infer<typeof GPSSensorDataSchema>;
