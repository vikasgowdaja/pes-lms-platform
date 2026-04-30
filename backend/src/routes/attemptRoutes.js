import { Router } from "express";
import {
  getAttemptById,
  listAttempts,
  logCheatingEvent,
  saveAnswer,
  startAttempt,
  submitAttempt
} from "../controllers/attemptController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const attemptRoutes = Router();

attemptRoutes.use(requireAuth);

attemptRoutes.get("/", listAttempts);
attemptRoutes.get("/:attemptId", getAttemptById);
attemptRoutes.post("/start/:testId", requireRole("candidate"), startAttempt);
attemptRoutes.patch("/:attemptId/answers", requireRole("candidate"), saveAnswer);
attemptRoutes.post("/:attemptId/logs", requireRole("candidate"), logCheatingEvent);
attemptRoutes.post("/:attemptId/submit", requireRole("candidate"), submitAttempt);
