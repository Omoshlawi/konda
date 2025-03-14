import { refreshToken, registerUser } from "@/controllers/credentials-auth";
import { Router } from "express";
import signInRouter from "./signin";
import usersRouter from "./users";
import fleetRouter from "./fleet";
import operatorRouter from "./operators";
import routeRouter from "./route";
import stageRouter from "./stage";
import routeStageRouter from "./route-stage";
import routePricingRouter from "./route-pricing";

const router = Router();

router.get("/auth/refresh-token", refreshToken);
router.post("/auth/signup", registerUser);
router.use("/auth/signin", signInRouter);
router.use("/users", usersRouter);
router.use("/fleet", fleetRouter);
router.use("/operators", operatorRouter);
router.use("/route", routeRouter);
router.use("/stage", stageRouter);
router.use("/route-stage", routeStageRouter);
router.use("/route-pricing", routePricingRouter);
export default router;
