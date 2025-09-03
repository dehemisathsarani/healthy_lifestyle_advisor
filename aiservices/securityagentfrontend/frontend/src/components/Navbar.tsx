import { FaBell, FaUserCircle } from "react-icons/fa";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [search, setSearch] = useState("");

  return (
    <header className="bg-white shadow-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-gray-800">Health Agent Dashboard</h1>
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hidden sm:block p-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-600 hover:text-gray-800 transition">
          <FaBell className="text-lg" />
          <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">
            3
          </span>
        </button>

        <div className="flex items-center gap-2">
          <FaUserCircle className="text-2xl text-gray-600" />
          <span className="hidden sm:block text-gray-800 font-medium">{user || "Admin"}</span>
          <button
            onClick={logout}
            className="ml-2 text-red-500 hover:text-red-700 font-semibold"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
