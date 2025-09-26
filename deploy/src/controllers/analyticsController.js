import { getCategoryTotals, getMonthlyTrend, getTopCategories } from "../models/analyticsModel.js";

export const categoryTotals = async (req, res) => {
  try {
    const data = await getCategoryTotals(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const monthlyTrend = async (req, res) => {
  try {
    const data = await getMonthlyTrend(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const topCategories = async (req, res) => {
  try {
    const data = await getTopCategories(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
