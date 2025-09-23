import { Pie, Line, Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function AnalyticsCharts({ analytics }) {
  if (!analytics?.categories?.length && !analytics?.monthly?.length && !analytics?.top?.length) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Analytics Overview</h2>
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <p className="text-gray-500 text-lg">No data available for analytics</p>
          <p className="text-gray-400 text-sm mt-2">Add some expenses to see your spending patterns</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        }
      }
    }
  };

  const pieData = {
    labels: analytics.categories?.map(c => c.category) || [],
    datasets: [{
      data: analytics.categories?.map(c => c.total) || [],
      backgroundColor: [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const lineData = {
    labels: analytics.monthly?.map(m => {
      const date = new Date(m.month + '-01');
      return date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
    }) || [],
    datasets: [{
      label: 'Monthly Spending',
      data: analytics.monthly?.map(m => m.total) || [],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#3B82F6',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6
    }]
  };

  const barData = {
    labels: analytics.top?.map(t => t.category) || [],
    datasets: [{
      label: 'Total Spent',
      data: analytics.top?.map(t => t.total) || [],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: '#3B82F6',
      borderWidth: 1,
      borderRadius: 4,
    }]
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Analytics Overview</h2>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-blue-600 text-2xl font-bold">
              {analytics.categories?.length || 0}
            </div>
            <div className="text-blue-800 text-sm font-medium">Categories</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-600 text-2xl font-bold">
              £{analytics.categories?.reduce((sum, cat) => sum + parseFloat(cat.total || 0), 0).toFixed(2) || '0.00'}
            </div>
            <div className="text-green-800 text-sm font-medium">Total Spent</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-purple-600 text-2xl font-bold">
              £{analytics.monthly?.length ? (analytics.monthly.reduce((sum, m) => sum + parseFloat(m.total || 0), 0) / analytics.monthly.length).toFixed(2) : '0.00'}
            </div>
            <div className="text-purple-800 text-sm font-medium">Avg. Monthly</div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Category Breakdown */}
          {analytics.categories?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Category Breakdown</h3>
              <div className="h-80">
                <Pie data={pieData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Top Categories */}
          {analytics.top?.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Top Spending Categories</h3>
              <div className="h-80">
                <Bar data={barData} options={barOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Monthly Trend - Full Width */}
        {analytics.monthly?.length > 0 && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Spending Trend</h3>
            <div className="h-80">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
