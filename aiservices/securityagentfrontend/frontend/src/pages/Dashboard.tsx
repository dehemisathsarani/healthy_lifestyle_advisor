import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { FaChartBar, FaDatabase, FaUsers, FaBell, FaLock, FaTasks } from "react-icons/fa";

export default function Dashboard() {
  const stats = [
    { title: "Reports", value: "12", colorGradient: "bg-gradient-to-r from-green-400 to-green-600", icon: <FaChartBar className="text-white w-6 h-6" /> },
    { title: "Backups", value: "5", colorGradient: "bg-gradient-to-r from-purple-400 to-purple-600", icon: <FaDatabase className="text-white w-6 h-6" /> },
    { title: "Users", value: "120", colorGradient: "bg-gradient-to-r from-blue-400 to-blue-600", icon: <FaUsers className="text-white w-6 h-6" /> },
    { title: "Alerts", value: "3", colorGradient: "bg-gradient-to-r from-red-400 to-red-600", icon: <FaBell className="text-white w-6 h-6" /> },
    { title: "Encryptions", value: "8", colorGradient: "bg-gradient-to-r from-yellow-400 to-yellow-600", icon: <FaLock className="text-white w-6 h-6" /> },
    { title: "Tasks", value: "15", colorGradient: "bg-gradient-to-r from-indigo-400 to-indigo-600", icon: <FaTasks className="text-white w-6 h-6" /> },
  ];

  const recentActivities = [
    { time: "2 mins ago", activity: "User John logged in" },
    { time: "10 mins ago", activity: "Backup completed successfully" },
    { time: "30 mins ago", activity: "Encryption task executed" },
    { time: "1 hour ago", activity: "User Mary deleted a report" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Navbar />

        <div className="p-6">
          {/* Page Header */}
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-600 mt-2 mb-6">Welcome back! Here's a summary of your system data.</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <Card
                key={stat.title}
                title={stat.title}
                value={stat.value}
                colorGradient={stat.colorGradient}
                icon={stat.icon}
                rounded
                shadow
                hoverEffect
              />
            ))}
          </div>

          {/* Recent Activities */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Recent Activities</h2>
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
              <ul className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-purple-50 transition-all duration-300"
                  >
                    <span className="text-gray-700 font-medium">{activity.activity}</span>
                    <span className="text-gray-400 text-sm">{activity.time}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
