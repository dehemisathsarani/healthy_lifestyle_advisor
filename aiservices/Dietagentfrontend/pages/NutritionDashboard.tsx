import React, { useState } from 'react';
import NutritionSummary from '../components/NutritionSummary';
import HydrationTracker from '../components/HydrationTracker';
import MyFitnessPalModal from '../components/MyFitnessPalModal';

function NutritionDashboard() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Refresh data when updates are made
  const handleDataUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle successful import from MyFitnessPal
  const handleImportSuccess = () => {
    handleDataUpdate();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Nutrition & Hydration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Nutrition Summary */}
        <div className="md:col-span-2">
          <NutritionSummary refreshTrigger={refreshTrigger} />
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Data Import</h2>
            <p className="text-gray-600 mb-4">
              Connect with third-party apps to import your nutrition data automatically.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span>Connect MyFitnessPal</span>
            </button>
          </div>
        </div>
        
        {/* Right column - Hydration Tracker */}
        <div className="md:col-span-1">
          <HydrationTracker onUpdate={handleDataUpdate} />
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Nutrition Tips</h2>
            <ul className="text-gray-600 space-y-3">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Aim to drink water before feeling thirsty to stay properly hydrated.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Include a variety of colorful fruits and vegetables in your diet for essential nutrients.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Distribute protein intake throughout the day for optimal muscle health.</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                <span>Choose whole grains over refined grains for more fiber and nutrients.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* MyFitnessPal Import Modal */}
      <MyFitnessPalModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}

export default NutritionDashboard;
