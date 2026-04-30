import { Router } from "express";
import {
	getAdminRegistrationInfo,
	listAdminStudents,
	login,
	me,
	regenerateAdminCode,
	signup
} from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const authRoutes = Router();

authRoutes.post("/signup", signup);
authRoutes.post("/login", login);
authRoutes.get("/me", requireAuth, me);
authRoutes.get("/admin/registration", requireAuth, requireRole("admin"), getAdminRegistrationInfo);
authRoutes.post("/admin/registration/regenerate", requireAuth, requireRole("admin"), regenerateAdminCode);
authRoutes.get("/admin/students", requireAuth, requireRole("admin"), listAdminStudents);
