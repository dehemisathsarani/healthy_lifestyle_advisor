import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="ml-2 text-xl font-bold text-gray-800">Fitness Agent</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            <NavLink to="/" active={location.pathname === "/"}>Dashboard</NavLink>
            <NavLink to="/planner" active={location.pathname === "/planner"}>Workout Planner</NavLink>
            <NavLink to="/test-health" active={location.pathname === "/test-health"}>Health Monitoring</NavLink>
            <NavLink to="/health-data" active={location.pathname === "/health-data"}>Health Tracking</NavLink>
            <NavLink to="/goals" active={location.pathname === "/goals"}>Goals & Rewards</NavLink>
            <NavLink to="/profile" active={location.pathname === "/profile"}>Profile</NavLink>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={toggleMenu} className="text-gray-600 hover:text-gray-900 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              <MobileNavLink to="/" active={location.pathname === "/"} onClick={() => setIsMenuOpen(false)}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/planner" active={location.pathname === "/planner"} onClick={() => setIsMenuOpen(false)}>
                Workout Planner
              </MobileNavLink>
              <MobileNavLink to="/test-health" active={location.pathname === "/test-health"} onClick={() => setIsMenuOpen(false)}>
                Health Monitoring
              </MobileNavLink>
              <MobileNavLink to="/health-data" active={location.pathname === "/health-data"} onClick={() => setIsMenuOpen(false)}>
                Health Tracking
              </MobileNavLink>
              <MobileNavLink to="/goals" active={location.pathname === "/goals"} onClick={() => setIsMenuOpen(false)}>
                Goals & Rewards
              </MobileNavLink>
              <MobileNavLink to="/profile" active={location.pathname === "/profile"} onClick={() => setIsMenuOpen(false)}>
                Profile
              </MobileNavLink>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Desktop Nav Link component
interface NavLinkProps {
  to: string;
  active: boolean;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, active, children }) => {
  return (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active
          ? 'text-white bg-indigo-600 hover:bg-indigo-700'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
};

// Mobile Nav Link component
interface MobileNavLinkProps {
  to: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const MobileNavLink: React.FC<MobileNavLinkProps> = ({ to, active, onClick, children }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        active
          ? 'text-white bg-indigo-600 hover:bg-indigo-700'
          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      {children}
    </Link>
  );
};

export default Navbar;
