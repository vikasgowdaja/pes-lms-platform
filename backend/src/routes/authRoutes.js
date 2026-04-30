import { Router } from "express";
import {
	createManagedAdmin,
	getAdminRegistrationInfo,
	importStudentsCsv,
	listAdminStudents,
	listManagedAdmins,
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
authRoutes.get("/admin/students", requireAuth, requireRole("admin", "super-admin"), listAdminStudents);
authRoutes.post("/admin/students/import/csv", requireAuth, requireRole("admin", "super-admin"), importStudentsCsv);

authRoutes.get("/super-admin/admins", requireAuth, requireRole("super-admin"), listManagedAdmins);
authRoutes.post("/super-admin/admins", requireAuth, requireRole("super-admin"), createManagedAdmin);
