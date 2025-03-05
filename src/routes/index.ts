import { refreshToken, registerUser } from "@/controllers/credentials-auth";
import { Router } from "express";
import signInRouter from "./signin";
import usersRouter from "./users";

const router = Router();

router.get("/auth/refresh-token", refreshToken);
router.post("/auth/signup", registerUser);
router.use("/auth/signin", signInRouter);
router.use("/users", usersRouter);

export default router;
