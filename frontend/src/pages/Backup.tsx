import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import toast from "react-hot-toast";

export default function Backup() {
  const { profile, isAuthenticated } = useAuth();
  const [backupStatus, setBackupStatus] = useState<string>("");

  const handleBackup = async () => {
    if (!isAuthenticated) return toast.error("User not authenticated");

    try {
      const res = await fetch("http://127.0.0.1:8000/backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${profile?.token}` },
      });

      if (!res.ok) throw new Error("Backup failed");

      const data = await res.json();
      setBackupStatus(data.message || "Backup successful!");
      toast.success("Backup completed!");
    } catch (err) {
      console.error(err);
      toast.error("Backup failed.");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="bg-green-100 p-6 rounded shadow flex flex-col gap-4">
        <h2 className="text-xl font-bold">Backup Data</h2>
        <button
          onClick={handleBackup}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Create Backup
        </button>
        {backupStatus && <p className="mt-2">{backupStatus}</p>}
      </div>
    </div>
  );
}
