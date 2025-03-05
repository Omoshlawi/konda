import { loginUser } from "@/controllers/credentials-auth";
import { Router } from "express";

const router = Router();
router.post("/credentials", loginUser);
// router.get("/google", googleSignIn);
export default router;
