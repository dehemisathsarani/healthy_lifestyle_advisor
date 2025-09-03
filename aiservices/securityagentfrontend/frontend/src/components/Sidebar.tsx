import { NavLink } from "react-router-dom";
import { FaTachometerAlt, FaChartBar, FaUserSlash, FaDatabase, FaLock } from "react-icons/fa";

export default function Sidebar() {
  const menuItems = [
    { name: "Dashboard", path: "/", icon: <FaTachometerAlt /> },
    { name: "Weekly Report", path: "/report", icon: <FaChartBar /> },
    { name: "Right to Forget", path: "/forget", icon: <FaUserSlash /> },
    { name: "Backup", path: "/backup", icon: <FaDatabase /> },
    { name: "Encrypt/Decrypt", path: "/encrypt", icon: <FaLock /> },
  ];

  return (
    <aside className="w-60 bg-gray-900 text-white min-h-screen p-6 flex flex-col">
      <h2 className="font-bold text-2xl mb-6 text-center">Health Agent</h2>
      <nav className="flex-1">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-3 rounded hover:bg-gray-700 transition ${
                    isActive ? "bg-gray-700 font-semibold" : ""
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto text-center text-gray-400 text-sm">
        &copy; {new Date().getFullYear()} Health Agent
      </div>
    </aside>
  );
}
