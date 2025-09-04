import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import {
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
  FaPlus,
  FaDownload,
  FaTrash,
} from "react-icons/fa";
import toast from "react-hot-toast";

interface BackupStats {
  today: number;
  week: number;
  month: number;
  last_backup?: string;
}

interface BackupItem {
  id: string;
  created_at: string;
  size: string;
  status: "completed" | "failed" | "in-progress";
}

export default function Backup() {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [history, setHistory] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch backup stats
  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:8000/backup/stats");
      const data = await res.json();
      setStats(data);
    } catch {
      toast.error("Failed to load backup stats");
    }
  };

  // Fetch backup history
  const fetchHistory = async () => {
    try {
      const res = await fetch("http://localhost:8000/backup/history");
      const data = await res.json();
      setHistory(data);
    } catch {
      toast.error("Failed to load backup history");
    }
  };

  // Create new backup
  const createBackup = async () => {
    const email = prompt("Enter your email:");
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/backup/create/${email}`, {
        method: "POST",
      });
      const data = await res.json();
      toast.success(data.message);
      fetchStats();
      fetchHistory();
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setLoading(false);
    }
  };

  // Download backup
  const downloadBackup = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:8000/backup/download/${id}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${id}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success("Backup downloaded!");
    } catch {
      toast.error("Failed to download backup");
    }
  };

  // Delete backup
  const deleteBackup = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this backup?")) return;
    try {
      await fetch(`http://localhost:8000/backup/delete/${id}`, { method: "DELETE" });
      toast.success("Backup deleted");
      fetchStats();
      fetchHistory();
    } catch {
      toast.error("Failed to delete backup");
    }
  };

  useEffect(() => {
    fetchStats();
    fetchHistory();
  }, []);

  // Filter + Search backups
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.created_at.toLowerCase().includes(search.toLowerCase()) ||
      item.size.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ? true : item.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const startIdx = (page - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);

  const backups = [
    {
      title: "Today",
      value: `${stats?.today || 0} Backups`,
      colorGradient: "bg-gradient-to-r from-green-400 to-green-600",
      icon: <FaCalendarDay />,
    },
    {
      title: "This Week",
      value: `${stats?.week || 0} Backups`,
      colorGradient: "bg-gradient-to-r from-blue-400 to-blue-600",
      icon: <FaCalendarWeek />,
    },
    {
      title: "This Month",
      value: `${stats?.month || 0} Backups`,
      colorGradient: "bg-gradient-to-r from-purple-400 to-purple-600",
      icon: <FaCalendarAlt />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Backups</h1>
              <p className="text-gray-600 mt-1">
                Monitor and manage your backups efficiently.
              </p>
              {stats?.last_backup && (
                <p className="text-sm text-gray-500 mt-1">
                  Last backup: {new Date(stats.last_backup).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={createBackup}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              } text-white rounded-lg shadow-md transition`}
            >
              <FaPlus /> {loading ? "Creating..." : "Create Backup"}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {backups.map((backup, idx) => (
              <Card
                key={idx}
                title={backup.title}
                value={backup.value}
                colorGradient={backup.colorGradient}
                icon={backup.icon}
                shadow
                rounded
                hoverEffect
              />
            ))}
          </div>

          {/* Backup History */}
          <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Backup History
            </h2>

            {/* Search + Filter */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
              <input
                type="text"
                placeholder="Search by date or size..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-1/3 p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 text-left text-sm font-medium text-gray-700">
                  <th className="p-3">Date</th>
                  <th className="p-3">Size</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-gray-500">
                      No backups found
                    </td>
                  </tr>
                ) : (
                  paginatedHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-gray-50 transition"
                    >
                      <td className="p-3">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="p-3">{item.size}</td>
                      <td className="p-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm ${
                            item.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : item.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-3">
                        <button
                          onClick={() => downloadBackup(item.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaDownload />
                        </button>
                        <button
                          onClick={() => deleteBackup(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 gap-3">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
