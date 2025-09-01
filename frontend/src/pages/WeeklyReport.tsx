import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { jsPDF } from "jspdf";
import "chart.js/auto";
import toast from "react-hot-toast";
import { useAuth } from "../auth/AuthContext";

export default function WeeklyReport() {
  const { profile, isAuthenticated } = useAuth();
  const [report, setReport] = useState<any>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("http://127.0.0.1:8000/report/weekly", {
        headers: { Authorization: `Bearer ${profile?.token}` },
      })
        .then((res) => res.json())
        .then((data) => setReport(data))
        .catch(() => toast.error("Failed to fetch report"));
    }
  }, [profile, isAuthenticated]);

  if (!report) return <div>Loading...</div>;

  const dietData = {
    labels: ["Protein", "Carbs", "Fat"],
    datasets: [
      {
        label: "Macros (grams)",
        data: [
          report.diet.avgMacros.protein,
          report.diet.avgMacros.carbs,
          report.diet.avgMacros.fat,
        ],
        backgroundColor: ["#4ade80", "#60a5fa", "#facc15"],
      },
    ],
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Weekly Health Report", 10, 10);
    doc.text(`Avg Calories: ${report.diet.avgCalories} kcal`, 10, 20);
    doc.text(
      `Workouts Done: ${report.fitness.workoutsDone}, Calories Burned: ${report.fitness.caloriesBurned}`,
      10,
      30
    );
    const moodText = report.mental.moods
      .map((m: any) => `${m.date}: ${m.mood}`)
      .join(", ");
    doc.text(`Mood: ${moodText}`, 10, 40);
    doc.save("weekly_report.pdf");
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold">Weekly Report</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-green-100 rounded">
          <h3 className="font-bold">Avg Calories</h3>
          <p>{report.diet.avgCalories} kcal</p>
        </div>
        <div className="p-4 bg-blue-100 rounded">
          <h3 className="font-bold">Workouts Done</h3>
          <p>{report.fitness.workoutsDone}</p>
        </div>
        <div className="p-4 bg-yellow-100 rounded">
          <h3 className="font-bold">Calories Burned</h3>
          <p>{report.fitness.caloriesBurned}</p>
        </div>
      </div>
      <div className="bg-white p-4 rounded shadow">
        <Bar data={dietData} />
      </div>
      <button
        onClick={exportPDF}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Export PDF
      </button>
    </div>
  );
}
