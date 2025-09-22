import { createCategory, getCategoriesByUser } from "../models/categoryModel.js";

export const addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Category name required" });

    const newCategory = await createCategory(name, req.user.id);
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyCategories = async (req, res) => {
  try {
    const categories = await getCategoriesByUser(req.user.id);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
