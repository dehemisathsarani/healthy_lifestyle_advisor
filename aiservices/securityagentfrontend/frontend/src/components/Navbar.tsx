import { FaBell, FaUserCircle, FaSearch } from "react-icons/fa";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <header className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
      {/* Left Section: Title & Search */}
      <div className="flex items-center gap-6">
        <h1 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">
          🌿 Health Agent Dashboard
        </h1>

        {/* Search Input */}
        <div className="relative hidden sm:flex items-center">
          <FaSearch className="absolute left-3 text-gray-300" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-300 w-64 transition"
          />
        </div>
      </div>

      {/* Right Section: Notifications & User */}
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative text-white hover:scale-110 transition transform">
          <FaBell className="text-xl drop-shadow" />
          <span className="absolute -top-1 -right-2 text-xs bg-yellow-400 text-gray-900 rounded-full px-1.5 font-bold shadow">
            3
          </span>
        </button>

        {/* User Info */}
        <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-white/30">
          <FaUserCircle className="text-2xl text-white" />
          <span className="hidden sm:block text-white font-semibold">
            {user || "Admin"}
          </span>
          <button
            onClick={logout}
            className="ml-2 text-yellow-300 hover:text-yellow-100 font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
