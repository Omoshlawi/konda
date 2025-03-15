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
  latitude: z.number().positive("Must be a positive number"),
  longitude: z.number().positive("Must be a positive number"),
  radius: z.number().int().positive("Must be a positive integer"),
});

export const RouteStageschema = z.object({
  routeId: z.string().min(1, "Required").uuid(),
  order: z.number().int().positive("Must be a positive integer"),
  stageId: z.string().min(1, "Required").uuid(),
});

export const RoutePricingSchema = z.object({
  routeId: z.string().min(1, "Required").uuid(),
  fromStageId: z.string().min(1, "Required").uuid(),
  toStageId: z.string().min(1, "Required").uuid(),
  price: z.number().positive("Must be a positive number"),
  timeStart: z.string().min(1, "Required"),
  timeEnd: z.string().min(1, "Required"),
});
