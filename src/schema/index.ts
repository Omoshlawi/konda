import { PHONE_NUMBER_REGEX, PLATE_NUMBER_REGEX } from "@/utils/constants";
import { z } from "zod";
export const Register = z
  .object({
    username: z.string().min(4),
    email: z.string().email(),
    phoneNumber: z.string(),
    password: z.string().min(4),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must much",
    path: ["confirmPassword"],
  });

export const Login = z.object({
  identifier: z.string().min(1, { message: "Identifier required" }),
  password: z.string().min(4, { message: "Password required" }),
});

export const OauthAuthSchema = z.object({
  providerAccountId: z.string(),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  image: z.string().optional(),
  type: z.enum(["google", "apple"]),
  provider: z.string(),
});

export const UserFilterSchema = z.object({
  search: z.string().optional(),
});
export const UserTokenUpdateSchema = z.object({
  expoPushToken: z.string().nonempty("Required"),
});

export const OperatorSchema = z.object({
  name: z.string().min(1, "Required"),
  contact: z.string().regex(PHONE_NUMBER_REGEX).min(1, "Required"),
});

export const FleetSchema = z.object({
  name: z.string().min(1, "Required"),
  vehicleType: z.enum(["Bus", "Matatu", "Shuttle"]),
  capacity: z.number({ coerce: true }),
  plateNumber: z.string().regex(PLATE_NUMBER_REGEX).min(1, "Required"),
  operatorId: z.string().min(1, "Required").uuid(),
  status: z.enum(["Active", "Inactive", "Maintenance"]),
});

export const FleetFilterSchema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  vehicleType: z.enum(["Bus", "Matatu", "Shuttle"]).optional(),
  capacity: z.number({ coerce: true }).optional(),
  plateNumber: z
    .string()
    .regex(PLATE_NUMBER_REGEX)
    .min(1, "Required")
    .optional(),
  status: z.enum(["Active", "Inactive", "Maintenance"]).optional(),
});

export const RouteSchema = z.object({
  name: z.string().min(1, "Required"),
  startPoint: z.string().min(1, "Required"),
  endPoint: z.string().min(1, "Required"),
  distanceKm: z.number({ coerce: true }).positive("Must be a positive number"),
  estimatedTimeMin: z
    .number({ coerce: true })
    .int()
    .positive("Must be a positive integer"),
});

export const StagesShema = z.object({
  name: z.string().min(1, "Required"),
  latitude: z.number({ coerce: true }).min(-90).max(90),
  longitude: z.number({ coerce: true }).min(-180).max(180),
  radius: z
    .number({ coerce: true })
    .int()
    .positive("Must be a positive integer"),
  countyCode: z.string().min(1, "Required"),
  subCountyCode: z.string().min(1, "Required"),
});

export const StagesFilterShema = z.object({
  search: z.string().optional(),
  name: z.string().optional(),
  latitude: z.number({ coerce: true }).min(-90).max(90).optional(),
  longitude: z.number({ coerce: true }).min(-180).max(180).optional(),
  radius: z
    .number({ coerce: true })
    .int()
    .positive("Must be a positive integer")
    .optional(),
  countyCode: z.string().optional(),
  subCountyCode: z.string().optional(),
  fleetNo: z.string().optional(),
  includeOnlyForActiveFleetRoutes: z.enum(["true", "false"]).optional(),
});

export const RouteStageschema = z.object({
  stageId: z.string().min(1, "Required").uuid(),
});

export const FleetRouteSchema = z.object({
  routeId: z.string().min(1, "Required").uuid(),
});
export const FleetRouteFilterSchema = z.object({
  routeId: z.string().min(1, "Required").uuid().optional(),
  includeOnlyActiveFleetRoutes: z.enum(["true", "false"]).optional(),
});

export const RoutePricingSchema = z.object({
  fromStageId: z.string().min(1, "Required").uuid(),
  toStageId: z.string().min(1, "Required").uuid(),
  price: z.number().positive("Must be a positive number"),
  timeStart: z.string().min(1, "Required"),
  timeEnd: z.string().min(1, "Required"),
});

export const CountyFilterSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  search: z.string().optional(),
});

export const SubCountyFilterSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  countyCode: z.string().optional(),
  county: z.string().optional(),
  search: z.string().optional(),
});

export const WardFilterSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  countyCode: z.string().optional(),
  subCountyCode: z.string().optional(),
  county: z.string().optional(),
  subCounty: z.string().optional(),
  search: z.string().optional(),
});

export const GPSSensorDataSchema = z.object({
  fleetNo: z.string().nonempty(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const FleetRouteInterStageMovementSchema = z.object({
  fleetNo: z.string().nonempty(),
  routeName: z.string().nonempty(),
  routeId: z.string().uuid(),
  currentStage: z.string().nonempty(),
  currentStageId: z.string().uuid(),
  nextStage: z.string().nonempty(),
  nextStageId: z.string().uuid(),
  traversalDirection: z.enum(["forward", "reverse"]),
});
