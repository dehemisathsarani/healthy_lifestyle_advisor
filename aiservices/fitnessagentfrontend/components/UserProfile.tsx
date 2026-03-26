import React from 'react';
import { UserProfile } from '../api';

const UserProfileComponent: React.FC<{ profile: UserProfile }> = ({ profile }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">My Profile</h2>
      
      <div className="space-y-6">
        {/* Personal Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{profile.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{profile.age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Gender</p>
              <p className="font-medium">{profile.gender}</p>
            </div>
          </div>
        </div>
        
        {/* Body Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Body Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Height</p>
              <p className="font-medium">{profile.height_cm} cm</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium">{profile.weight_kg} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">BMI</p>
              <p className="font-medium">
                {(profile.weight_kg / Math.pow(profile.height_cm / 100, 2)).toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        
        {/* Fitness Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Fitness Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Fitness Level</p>
              <p className="font-medium">{profile.fitness_level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fitness Goal</p>
              <p className="font-medium">{profile.fitness_goal.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
        
        {/* Edit Profile Button */}
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
            onClick={() => alert('Edit profile functionality would go here')}
          >
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileComponent;
