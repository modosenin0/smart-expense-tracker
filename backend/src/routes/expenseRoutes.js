import express from "express";
import { addExpense, getMyExpenses, editExpense, removeExpense } from "../controllers/expenseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware); // all routes require auth

router.post("/", addExpense);
router.get("/", getMyExpenses);
router.put("/:id", editExpense);
router.delete("/:id", removeExpense);

export default router;
