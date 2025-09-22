import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";
import toast from "react-hot-toast";

export default function RightToForget() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/righttoforget/${email}`, { method: "POST" });
      const data = await res.json();
      toast.success(data.message);
      setEmail("");
    } catch {
      toast.error("Failed to delete data");
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800">Right to Forget</h1>
          <p className="text-gray-600 mt-1">Submit your request to delete your personal data.</p>

          <form onSubmit={handleSubmit} className="mt-6 max-w-md bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <label className="block text-gray-700 font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
