import { useState } from "react";

export default function Navbar({ onLogout }) {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false); // Close mobile menu when navigating
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const NavButton = ({ section, label }) => (
    <button 
      onClick={() => scrollToSection(section)}
      className={`font-medium transition duration-200 ${
        activeSection === section 
          ? 'text-blue-600 border-b-2 border-blue-600 pb-1' 
          : 'text-gray-700 hover:text-blue-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">💰</div>
            <h1 className="ml-3 text-xl font-bold text-gray-800">Smart Expense Tracker</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <NavButton section="dashboard" label="Dashboard" />
              <NavButton section="analytics" label="Analytics" />
              <NavButton section="expenses" label="Expenses" />
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={onLogout} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition duration-200 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50 border-t border-gray-200">
              <button 
                onClick={() => scrollToSection('dashboard')}
                className={`block px-3 py-2 text-base font-medium transition duration-200 w-full text-left ${
                  activeSection === 'dashboard' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button 
                onClick={() => scrollToSection('analytics')}
                className={`block px-3 py-2 text-base font-medium transition duration-200 w-full text-left ${
                  activeSection === 'analytics' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Analytics
              </button>
              <button 
                onClick={() => scrollToSection('expenses')}
                className={`block px-3 py-2 text-base font-medium transition duration-200 w-full text-left ${
                  activeSection === 'expenses' 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Expenses
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
