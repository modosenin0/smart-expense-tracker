import pool from "../config/db.js";

export const createExpense = async (userId, categoryId, amount, currency, description, expenseDate, convertedAmount) => {
  const result = await pool.query(
    `INSERT INTO expenses (user_id, category_id, amount, currency, description, expense_date, converted_amount) 
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [userId, categoryId, amount, currency, description, expenseDate, convertedAmount]
  );
  return result.rows[0];
};

export const getExpensesByUser = async (userId) => {
  const result = await pool.query(
    `SELECT e.*, c.name as category_name 
     FROM expenses e 
     LEFT JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = $1
     ORDER BY e.expense_date DESC`,
    [userId]
  );
  return result.rows;
};

export const updateExpense = async (expenseId, userId, fields) => {
  const { category_id, amount, currency, description, expense_date } = fields;
  const result = await pool.query(
    `UPDATE expenses 
     SET category_id = $1, amount = $2, currency = $3, description = $4, expense_date = $5
     WHERE id = $6 AND user_id = $7
     RETURNING *`,
    [category_id, amount, currency, description, expense_date, expenseId, userId]
  );
  return result.rows[0];
};

export const deleteExpense = async (expenseId, userId) => {
  const result = await pool.query(
    `DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING *`,
    [expenseId, userId]
  );
  return result.rows[0];
};
