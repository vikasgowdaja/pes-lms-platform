import { Router } from "express";
import { runCode, submitCode } from "../controllers/submissionController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const submissionRoutes = Router();

submissionRoutes.use(requireAuth);

submissionRoutes.post("/run", requireRole("candidate", "admin"), runCode);
submissionRoutes.post("/:attemptId/:questionId", requireRole("candidate"), submitCode);
