import { useState } from "react";
import API from "../api/api";

export default function CategoryManager() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await API.get("/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setLoading(true);
    try {
      await API.post("/categories", { name: newCategory.trim() });
      setNewCategory("");
      fetchCategories();
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setLoading(false);
    }
  };

  const addDefaultCategories = async () => {
    const defaultCategories = [
      "Food & Dining",
      "Transportation",
      "Shopping",
      "Entertainment",
      "Bills & Utilities",
      "Healthcare",
      "Travel",
      "Education",
      "Groceries",
      "Gas & Fuel"
    ];

    setLoading(true);
    try {
      for (const category of defaultCategories) {
        await API.post("/categories", { name: category });
      }
      fetchCategories();
    } catch (error) {
      console.error("Error adding default categories:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Category Manager</h3>
      
      <div className="space-y-4">
        <form onSubmit={addCategory} className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter category name..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !newCategory.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md"
          >
            Add
          </button>
        </form>

        <button
          onClick={addDefaultCategories}
          disabled={loading}
          className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md text-sm"
        >
          Add Default Categories
        </button>

        <button
          onClick={fetchCategories}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm ml-2"
        >
          Refresh Categories
        </button>

        {categories.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-700 mb-2">Current Categories:</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <span
                  key={category.id}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {category.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}