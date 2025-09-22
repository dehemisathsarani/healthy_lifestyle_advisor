import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";

export default function RightToForget() {
  const { profile, logout, isAuthenticated } = useAuth();

  const handleForget = async () => {
    if (!isAuthenticated) return toast.error("User not authenticated");

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/privacy/right-to-forget",
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${profile?.token}` },
        }
      );
      const data = await res.json();
      toast.success(data.message);
      logout();
    } catch (err) {
      toast.error("Failed to delete data.");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="bg-red-100 p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-2">Right to Forget</h2>
        <p className="mb-4">
          Delete all your personal data stored in the system permanently.
        </p>
        <button
          onClick={handleForget}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Delete My Data
        </button>
      </div>
    </div>
  );
}
