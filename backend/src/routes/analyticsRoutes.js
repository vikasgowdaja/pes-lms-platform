import { Router } from "express";
import { getAdminAnalytics } from "../controllers/analyticsController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth, requireRole("admin"));
analyticsRoutes.get("/admin", getAdminAnalytics);
