import pool from "../config/db.js";

export const createCategory = async (name, userId) => {
  const result = await pool.query(
    `INSERT INTO categories (name, user_id) 
     VALUES ($1, $2) RETURNING *`,
    [name, userId]
  );
  return result.rows[0];
};

export const getCategoriesByUser = async (userId) => {
  const result = await pool.query(
    `SELECT * FROM categories 
     WHERE user_id = $1 OR user_id IS NULL
     ORDER BY name ASC`,
    [userId]
  );
  return result.rows;
};
