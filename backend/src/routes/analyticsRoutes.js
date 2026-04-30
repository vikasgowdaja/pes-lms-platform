import { Router } from "express";
import { getAdminActivity, getAdminAnalytics, getStudentDetail } from "../controllers/analyticsController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth, requireRole("admin", "super-admin"));
analyticsRoutes.get("/admin", getAdminAnalytics);
analyticsRoutes.get("/admin/activity", getAdminActivity);
analyticsRoutes.get("/admin/students/:studentId/detail", getStudentDetail);
