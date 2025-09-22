import { NavLink } from "react-router-dom";
import {
  FaTachometerAlt,
  FaChartBar,
  FaUserSlash,
  FaDatabase,
  FaLock,
} from "react-icons/fa";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaTachometerAlt /> },
    { name: "Weekly Report", path: "/report", icon: <FaChartBar /> },
    { name: "Right to Forget", path: "/forget", icon: <FaUserSlash /> },
    { name: "Backup", path: "/backup", icon: <FaDatabase /> },
    { name: "Encrypt/Decrypt", path: "/encrypt", icon: <FaLock /> },
  ];

  return (
    <aside className="w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen flex flex-col shadow-2xl">
      {/* Logo / Header */}
      <div className="px-6 py-6 text-center border-b border-gray-700">
        <h1 className="text-2xl font-extrabold tracking-wider text-purple-400">
          🔒 Data and Security Agent
        </h1>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300
                   hover:bg-purple-600 hover:shadow-lg hover:scale-[1.02]
                   ${
                     isActive
                       ? "bg-purple-700 text-white font-semibold shadow-md"
                       : "text-gray-300"
                   }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-700 text-center text-gray-400 text-xs">
        © {new Date().getFullYear()} Health Agent. All Rights Reserved.
      </div>
    </aside>
  );
}
