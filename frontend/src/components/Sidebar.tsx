import { FC } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChartBar, FaTrash, FaSave, FaLock } from "react-icons/fa";

const Sidebar: FC = () => {
  const location = useLocation();

  const linkClasses = (path: string) =>
    `flex items-center gap-2 p-2 rounded hover:bg-blue-200 ${
      location.pathname === path ? "bg-blue-400 text-white" : ""
    }`;

  return (
    <div className="w-64 bg-gray-100 min-h-screen p-4">
      <h2 className="text-2xl font-bold mb-6">Data & Security</h2>
      <nav className="flex flex-col gap-2">
        <Link to="/report" className={linkClasses("/report")} aria-current={location.pathname === "/report" ? "page" : undefined}>
          <FaChartBar /> Weekly Report
        </Link>
        <Link to="/forget" className={linkClasses("/forget")} aria-current={location.pathname === "/forget" ? "page" : undefined}>
          <FaTrash /> Right to Forget
        </Link>
        <Link to="/backup" className={linkClasses("/backup")} aria-current={location.pathname === "/backup" ? "page" : undefined}>
          <FaSave /> Backup
        </Link>
        <Link to="/encrypt" className={linkClasses("/encrypt")} aria-current={location.pathname === "/encrypt" ? "page" : undefined}>
          <FaLock /> Encrypt/Decrypt
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar;
