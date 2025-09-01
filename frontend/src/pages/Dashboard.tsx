import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Card from "../components/Card";
import { Outlet } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-6 flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Total Backups" value="12" color="bg-green-500" />
            <Card title="Encrypted Items" value="45" color="bg-blue-500" />
            <Card title="Reports Generated" value="8" color="bg-yellow-500" />
            <Card title="Requests Pending" value="3" color="bg-red-500" />
          </div>

          {/* Content area for nested routes */}
          <div className="bg-white p-4 rounded shadow">
            <Outlet /> {/* Pages like WeeklyReport will render here */}
          </div>
        </div>
      </div>
    </div>
  );
}
