import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Navbar from "./components/Navbar";
import { telemetry } from "./services/appInsights";

function App() {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage on app load
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      // Track user session start
      telemetry.trackEvent('app_session_start', { 
        hasToken: true,
        timestamp: new Date().toISOString()
      });
    } else {
      telemetry.trackEvent('app_session_start', { 
        hasToken: false,
        timestamp: new Date().toISOString()
      });
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    // Track logout event
    telemetry.trackEvent('user_logout');
    telemetry.clearUser();
  };

  const handleTokenSet = (newToken) => {
    setToken(newToken);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        {token && <Navbar onLogout={handleLogout} />}
        <div className={token ? "" : ""}>
          <Routes>
            <Route 
              path="/" 
              element={token ? <Dashboard /> : <Navigate to="/login" replace />} 
            />
            <Route 
              path="/login" 
              element={!token ? <Login setToken={handleTokenSet} /> : <Navigate to="/" replace />} 
            />
            <Route 
              path="/register" 
              element={!token ? <Register setToken={handleTokenSet} /> : <Navigate to="/" replace />} 
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
