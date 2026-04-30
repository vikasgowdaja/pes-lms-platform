import { Router } from "express";
import {
  createTest,
  getTestById,
  getTests,
  importTestsFromCsv,
  setPublishStatus,
  updateTest
} from "../controllers/testController.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

export const testRoutes = Router();

testRoutes.use(requireAuth);

testRoutes.get("/", getTests);
testRoutes.post("/import/csv", requireRole("admin"), importTestsFromCsv);
testRoutes.get("/:id", getTestById);

testRoutes.post("/", requireRole("admin"), createTest);
testRoutes.patch("/:id", requireRole("admin"), updateTest);
testRoutes.patch("/:id/publish", requireRole("admin"), (req, res, next) => {
  req.body.isPublished = true;
  next();
}, setPublishStatus);
testRoutes.patch("/:id/unpublish", requireRole("admin"), (req, res, next) => {
  req.body.isPublished = false;
  next();
}, setPublishStatus);
