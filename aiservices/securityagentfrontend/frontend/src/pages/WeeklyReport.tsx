import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { FaChartLine, FaUsers, FaDatabase, FaExclamationTriangle } from "react-icons/fa";

export default function WeeklyReport() {
  const stats = [
    { title: "Total Reports", value: "24", colorGradient: "bg-gradient-to-r from-green-400 to-green-600", icon: <FaChartLine className="w-5 h-5 text-white" /> },
    { title: "New Users", value: "15", colorGradient: "bg-gradient-to-r from-blue-400 to-blue-600", icon: <FaUsers className="w-5 h-5 text-white" /> },
    { title: "Backups", value: "5", colorGradient: "bg-gradient-to-r from-purple-400 to-purple-600", icon: <FaDatabase className="w-5 h-5 text-white" /> },
    { title: "Errors", value: "2", colorGradient: "bg-gradient-to-r from-red-400 to-red-600", icon: <FaExclamationTriangle className="w-5 h-5 text-white" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="p-6">
          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-800">Weekly Report</h1>
          <p className="text-gray-600 mt-2 mb-6">
            Summary of this week’s analytics, trends, and key metrics.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                title={stat.title}
                value={stat.value}
                colorGradient={stat.colorGradient}
                icon={stat.icon}
                shadow
                rounded
                hoverEffect
              />
            ))}
          </div>

          {/* Charts Section */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Reports Trend</h2>
              <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                Chart placeholder
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">User Activity</h2>
              <div className="h-64 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
                Chart placeholder
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

