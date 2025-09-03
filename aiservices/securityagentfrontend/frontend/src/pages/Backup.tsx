import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Card from "../components/Card";
import { FaSave } from "react-icons/fa";
import toast from "react-hot-toast";

interface BackupType {
  user: string;
  filename: string;
}

export default function Backup() {
  const [backups, setBackups] = useState<BackupType[]>([]);

  const fetchBackups = async () => {
    try {
      const res = await fetch("http://localhost:8000/backup/");
      const data = await res.json();
      setBackups(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch backups");
    }
  };

  const createBackup = async () => {
    const email = prompt("Enter your email to create backup:");
    if (!email) return;
    try {
      const res = await fetch(`http://localhost:8000/backup/create/${email}`, { method: "POST" });
      const data = await res.json();
      toast.success(data.message);
      fetchBackups();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create backup");
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">Backups</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your backups securely.</p>

          <button
            onClick={createBackup}
            className="my-6 px-6 py-3 bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-lg hover:from-green-500 hover:to-blue-600 transition shadow-md font-semibold"
          >
            Create Backup
          </button>

          {backups.length === 0 ? (
            <p className="text-gray-500 mt-4">No backups found yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {backups.map((backup, index) => (
                <Card
                  key={index}
                  title={backup.user ? String(backup.user) : "Unknown User"}
                  value={backup.filename ? String(backup.filename) : "No filename"}
                  colorGradient="bg-gradient-to-r from-blue-400 to-purple-500"
                  icon={<FaSave />}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
