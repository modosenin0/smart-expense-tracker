import pool from "../config/db.js";

// 1. Total spent per category (current month)
export const getCategoryTotals = async (userId) => {
  const result = await pool.query(
    `SELECT c.name as category, SUM(e.amount) as total
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = $1
       AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
     GROUP BY c.name
     ORDER BY total DESC`,
    [userId]
  );
  return result.rows;
};

// 2. Monthly spending trend (last 6 months)
export const getMonthlyTrend = async (userId) => {
  const result = await pool.query(
    `SELECT TO_CHAR(DATE_TRUNC('month', e.expense_date), 'YYYY-MM') as month,
            SUM(e.amount) as total
     FROM expenses e
     WHERE e.user_id = $1
       AND e.expense_date >= CURRENT_DATE - INTERVAL '6 months'
     GROUP BY month
     ORDER BY month ASC`,
    [userId]
  );
  return result.rows;
};

// 3. Top 3 categories overall
export const getTopCategories = async (userId) => {
  const result = await pool.query(
    `SELECT c.name as category, SUM(e.amount) as total
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = $1
     GROUP BY c.name
     ORDER BY total DESC
     LIMIT 3`,
    [userId]
  );
  return result.rows;
};
