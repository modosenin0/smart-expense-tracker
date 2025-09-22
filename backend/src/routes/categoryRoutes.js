import express from "express";
import { addCategory, getMyCategories } from "../controllers/categoryController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // protect all routes

router.post("/", addCategory);
router.get("/", getMyCategories);

export default router;
