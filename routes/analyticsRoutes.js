import express from "express";
import { categoryTotals, monthlyTrend, topCategories } from "../controllers/analyticsController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/categories", categoryTotals);   // totals per category this month
router.get("/monthly", monthlyTrend);        // monthly trend (6 months)
router.get("/top", topCategories);           // top 3 categories

export default router;