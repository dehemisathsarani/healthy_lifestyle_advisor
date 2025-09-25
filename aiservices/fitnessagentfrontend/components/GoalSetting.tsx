import React, { useState } from 'react';
import { FitnessGoal, GoalMilestone } from '../api';

interface GoalSettingProps {
  goals: FitnessGoal[];
  onUpdateGoal: (goalId: string, updates: Partial<FitnessGoal>) => void;
  onAddGoal: (goal: Partial<FitnessGoal>) => void;
  onDeleteGoal: (goalId: string) => void;
}

const GoalSetting: React.FC<GoalSettingProps> = ({
  goals,
  onUpdateGoal,
  onAddGoal,
  onDeleteGoal,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  
  const [newGoal, setNewGoal] = useState<Partial<FitnessGoal>>({
    title: '',
    description: '',
    category: 'weight',
    target_value: 0,
    current_value: 0,
    unit: 'kg',
    target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const handleAddGoal = () => {
    if (!newGoal.title || newGoal.target_value === 0) {
      alert('Please provide a title and target value for your goal.');
      return;
    }
    
    // Add milestones automatically based on the goal type
    const milestones: GoalMilestone[] = [];
    
    if (newGoal.category === 'weight') {
      // For weight loss/gain goals, create milestones at 33% and 66%
      const difference = Math.abs(Number(newGoal.target_value) - Number(newGoal.current_value));
      const oneThird = Number(newGoal.current_value) + (Number(newGoal.target_value) > Number(newGoal.current_value) ? difference / 3 : -difference / 3);
      const twoThirds = Number(newGoal.current_value) + (Number(newGoal.target_value) > Number(newGoal.current_value) ? 2 * difference / 3 : -2 * difference / 3);
      
      milestones.push({
        id: `milestone-new-1`,
        title: '33% Complete',
        target_value: parseFloat(oneThird.toFixed(1)),
        achieved: false
      });
      
      milestones.push({
        id: `milestone-new-2`,
        title: '66% Complete',
        target_value: parseFloat(twoThirds.toFixed(1)),
        achieved: false
      });
    } else if (newGoal.category === 'endurance') {
      // For endurance goals, create realistic progression milestones
      const current = Number(newGoal.current_value);
      const target = Number(newGoal.target_value);
      const improvement = Math.abs(target - current);
      
      milestones.push({
        id: `milestone-new-1`,
        title: '50% Improvement',
        target_value: current > target 
          ? current - (improvement / 2)
          : current + (improvement / 2),
        achieved: false
      });
    }
    
    // Add the milestones to the new goal
    const completeNewGoal = {
      ...newGoal,
      id: `goal-${Date.now()}`,
      user_id: 'demo-user',
      status: 'active',
      progress: 0,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      milestones,
    };
    
    onAddGoal(completeNewGoal);
    setShowAddForm(false);
    setNewGoal({
      title: '',
      description: '',
      category: 'weight',
      target_value: 0,
      current_value: 0,
      unit: 'kg',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
  };

  // Filter goals based on active tab
  const filteredGoals = goals.filter(goal => 
    activeTab === 'active' 
      ? goal.status === 'active' 
      : ['completed', 'failed'].includes(goal.status)
  );

  // Helper function to format goal progress text
  const formatGoalProgress = (goal: FitnessGoal) => {
    const current = goal.current_value;
    const target = goal.target_value;
    
    if (goal.category === 'weight') {
      return `${current} / ${target} ${goal.unit}`;
    }
    
    if (goal.category === 'endurance') {
      if (current > target) {
        // For time-based goals where lower is better
        return `${current} → ${target} ${goal.unit}`;
      } else {
        // For distance-based goals where higher is better
        return `${current} → ${target} ${goal.unit}`;
      }
    }
    
    // Default format for other goal types
    return `${current} / ${target} ${goal.unit}`;
  };

  // Calculate days left until target date
  const getDaysLeft = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Fitness Goals</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {showAddForm ? 'Cancel' : 'Add New Goal'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-8 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Create New Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Goal Title
              </label>
              <input
                type="text"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="E.g., Lose 5kg, Run 5km in 30min"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={newGoal.category}
                onChange={(e) => setNewGoal({ 
                  ...newGoal, 
                  category: e.target.value as FitnessGoal['category'],
                  unit: e.target.value === 'weight' ? 'kg' : 
                         e.target.value === 'endurance' ? 'minutes' : 
                         e.target.value === 'strength' ? 'reps' : 'units'
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="weight">Weight</option>
                <option value="strength">Strength</option>
                <option value="endurance">Endurance</option>
                <option value="nutrition">Nutrition</option>
                <option value="habit">Habit</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Value
              </label>
              <input
                type="number"
                value={newGoal.current_value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, current_value: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Value
              </label>
              <input
                type="number"
                value={newGoal.target_value || ''}
                onChange={(e) => setNewGoal({ ...newGoal, target_value: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={newGoal.unit}
                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="kg, minutes, reps, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Date
              </label>
              <input
                type="date"
                value={new Date(newGoal.target_date || '').toISOString().split('T')[0]}
                onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Details about your goal"
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAddGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 border-b">
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'active'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('active')}
          >
            Active Goals
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'completed'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600'
            }`}
            onClick={() => setActiveTab('completed')}
          >
            Completed Goals
          </button>
        </div>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {activeTab === 'active'
            ? "You don't have any active goals. Click 'Add New Goal' to create one."
            : "You don't have any completed goals yet."}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredGoals.map((goal) => (
            <div key={goal.id} className="border rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{goal.title}</h3>
                    <p className="text-gray-600 text-sm">{goal.description}</p>
                  </div>
                  {activeTab === 'active' && (
                    <div className="mt-2 md:mt-0 flex items-center">
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {getDaysLeft(goal.target_date) > 0
                          ? `${getDaysLeft(goal.target_date)} days left`
                          : 'Due today'}
                      </span>
                      <button
                        onClick={() => onUpdateGoal(goal.id, { status: 'completed' })}
                        className="ml-3 text-sm px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="ml-1 text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Progress</span>
                    <span>{formatGoalProgress(goal)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        goal.progress >= 75
                          ? 'bg-green-500'
                          : goal.progress >= 50
                          ? 'bg-blue-500'
                          : goal.progress >= 25
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>

                {goal.milestones && goal.milestones.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Milestones</h4>
                    <div className="space-y-2">
                      {goal.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={milestone.achieved}
                              onChange={() =>
                                onUpdateGoal(goal.id, {
                                  milestones: goal.milestones.map((m) =>
                                    m.id === milestone.id
                                      ? { ...m, achieved: !m.achieved }
                                      : m
                                  ),
                                })
                              }
                              className="mr-2"
                            />
                            <span
                              className={
                                milestone.achieved ? 'line-through text-gray-400' : ''
                              }
                            >
                              {milestone.title}
                            </span>
                          </div>
                          <span>{milestone.target_value} {goal.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {goal.status === 'completed' && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-md p-3">
                    <div className="flex items-center">
                      <span className="text-green-700 text-xl mr-2">🎉</span>
                      <div>
                        <p className="text-green-800 font-medium">Goal Completed!</p>
                        <p className="text-green-600 text-sm">
                          {goal.updated_at && `Completed on ${new Date(goal.updated_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GoalSetting;
