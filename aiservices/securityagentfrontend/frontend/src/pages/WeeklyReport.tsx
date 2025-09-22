import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { FaChartLine, FaUsers, FaDatabase, FaExclamationTriangle } from "react-icons/fa";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import toast from "react-hot-toast";

interface Stats {
  total_reports: number;
  new_users: number;
  backups: number;
  errors: number;
}

interface TrendData {
  day: string;
  reports?: number;
  users?: number;
}

export default function WeeklyReport() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [reportsTrend, setReportsTrend] = useState<TrendData[]>([]);
  const [userActivity, setUserActivity] = useState<TrendData[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch weekly report from backend
  const fetchWeeklyReport = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/weeklyreport"); // FastAPI backend endpoint
      if (!res.ok) throw new Error("Failed to fetch data");
      const data = await res.json();

      // Update frontend state
      setStats({
        total_reports: data.total_reports,
        new_users: data.new_users,
        backups: data.backups,
        errors: data.errors,
      });

      setReportsTrend(data.reports_trend || []);
      setUserActivity(data.user_activity || []);
      setHighlights(data.highlights || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load weekly report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyReport();
  }, []);

  const cards = [
    { title: "Total Reports", value: stats?.total_reports ?? 0, colorGradient: "bg-gradient-to-r from-green-400 to-green-600", icon: <FaChartLine className="w-5 h-5 text-white" /> },
    { title: "New Users", value: stats?.new_users ?? 0, colorGradient: "bg-gradient-to-r from-blue-400 to-blue-600", icon: <FaUsers className="w-5 h-5 text-white" /> },
    { title: "Backups", value: stats?.backups ?? 0, colorGradient: "bg-gradient-to-r from-purple-400 to-purple-600", icon: <FaDatabase className="w-5 h-5 text-white" /> },
    { title: "Errors", value: stats?.errors ?? 0, colorGradient: "bg-gradient-to-r from-red-400 to-red-600", icon: <FaExclamationTriangle className="w-5 h-5 text-white" /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">Weekly Report</h1>
          <p className="text-gray-600 mt-2 mb-6">Summary of this week’s analytics, trends, and key metrics.</p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />)
              : cards.map((card) => <Card key={card.title} {...card} shadow rounded hoverEffect />)}
          </div>

          {/* Charts */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Reports Trend</h2>
              {loading ? <div className="h-64 bg-gray-200 animate-pulse rounded-lg" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={reportsTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="reports" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">User Activity</h2>
              {loading ? <div className="h-64 bg-gray-200 animate-pulse rounded-lg" /> : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Highlights */}
          <div className="mt-10 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Weekly Highlights</h2>
            {loading ? <div className="space-y-2"><div className="h-6 bg-gray-200 animate-pulse rounded-lg" /></div> : (
              <ul className="space-y-3">{highlights.map((h, i) => <li key={i} className="p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-blue-50 transition">{h}</li>)}</ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


