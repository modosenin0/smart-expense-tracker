import axios from "axios";
import { createExpense, getExpensesByUser, updateExpense, deleteExpense } from "../models/expenseModel.js";

export const addExpense = async (req, res) => {
  try {
    const { category_id, amount, currency, description, expense_date } = req.body;

    // Convert amount to GBP
    let convertedAmount = amount;
    if (currency !== "GBP") {
      const response = await axios.get(`https://api.exchangerate.host/convert?access_key=eea93c460c7401aa02f600b1cfe1ce9f`, {
        params: { from: currency, to: "GBP", amount }
      });
      convertedAmount = response.data.result;
    }

    const newExpense = await createExpense(
      req.user.id,
      category_id,
      amount,
      currency,
      description,
      expense_date,
      convertedAmount
    );

    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyExpenses = async (req, res) => {
  try {
    const expenses = await getExpensesByUser(req.user.id);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const editExpense = async (req, res) => {
  try {
    const updated = await updateExpense(req.params.id, req.user.id, req.body);
    if (!updated) return res.status(404).json({ message: "Expense not found" });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const removeExpense = async (req, res) => {
  try {
    const deleted = await deleteExpense(req.params.id, req.user.id);
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
