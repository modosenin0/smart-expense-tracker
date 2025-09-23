import { useEffect, useState } from "react";
import API from "../api/api";
import ExpenseForm from "../components/ExpenseForm";
import ExpenseTable from "../components/ExpenseTable";
import AnalyticsCharts from "../components/AnalyticsCharts";
import CategoryManager from "../components/CategoryManager";

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [analytics, setAnalytics] = useState({ categories: [], monthly: [], top: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [exp, cat, mon, top] = await Promise.all([
        API.get("/expenses"),
        API.get("/analytics/categories"),
        API.get("/analytics/monthly"),
        API.get("/analytics/top")
      ]);
      
      setExpenses(exp.data);
      setAnalytics({ 
        categories: cat.data, 
        monthly: mon.data, 
        top: top.data 
      });
    } catch (err) {
      setError("Failed to load data. Please try again.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
          <p>{error}</p>
          <button 
            onClick={fetchData}
            className="mt-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div id="dashboard" className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Dashboard</h1>
              <p className="mt-2 text-gray-600">Track and analyze your expenses</p>
            </div>
            <button
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium"
            >
              {showCategoryManager ? 'Hide' : 'Manage'} Categories
            </button>
          </div>
        </div>

        {/* Category Manager */}
        {showCategoryManager && (
          <div className="mb-8">
            <CategoryManager />
          </div>
        )}

        {/* Add Expense Form */}
        <div className="mb-8">
          <ExpenseForm onExpenseAdded={fetchData} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-500 mr-4">💰</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {expenses.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-500 mr-4">💸</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-purple-500 mr-4">📊</div>
              <div>
                <p className="text-sm font-medium text-gray-500">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{expenses
                    .filter(exp => new Date(exp.expense_date).getMonth() === new Date().getMonth())
                    .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0)
                    .toFixed(2)
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-red-500 mr-4">📈</div>
              <div>
                <p className="text-sm font-medium text-gray-500">Average</p>
                <p className="text-2xl font-bold text-gray-900">
                  £{expenses.length ? (expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) / expenses.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div id="analytics" className="mb-8">
          <AnalyticsCharts analytics={analytics} />
        </div>

        {/* Expenses Table */}
        <div id="expenses" className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Recent Expenses</h2>
          </div>
          <ExpenseTable expenses={expenses} onRefresh={fetchData} />
        </div>
      </div>
    </div>
  );
}
