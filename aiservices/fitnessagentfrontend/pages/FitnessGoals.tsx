import React, { useState, useEffect } from 'react';
import { UserProfile, FitnessGoal } from '../api';
import GoalSetting from '../components/GoalSetting';
import Achievements from '../components/Achievements';
import LevelSystem from '../components/LevelSystem';
import XpRules from '../components/XpRules';
import MedalSystem from '../components/MedalSystem';
import LevelSystemGuide from '../components/LevelSystemGuide';
import { demoMode } from '../api';

const FitnessGoalsPage: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'goals' | 'achievements' | 'levels' | 'medals'>('goals');
  const [showGuide, setShowGuide] = useState(false);

  // Calculate next level points
  const calculateNextLevelPoints = (level: number) => {
    // Simple formula for experience points needed for next level
    return level * 500;
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      if (demoMode.isDemoMode()) {
        // Get user profile from demo mode
        const profile = demoMode.getDemoUserProfile();
        setUserProfile(profile);
      } else {
        // This would call the real API in production
        console.error('Real API not implemented');
        setError('API connection not available');
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = (goal: Partial<FitnessGoal>) => {
    if (!userProfile) return;
    
    // Create a full goal object with required fields
    const newGoal: FitnessGoal = {
      id: goal.id || `goal-${Date.now()}`,
      user_id: userProfile.user_id,
      title: goal.title || 'Unnamed Goal',
      description: goal.description || '',
      category: goal.category || 'custom',
      target_value: goal.target_value || 0,
      current_value: goal.current_value || 0,
      unit: goal.unit || 'units',
      start_date: goal.start_date || new Date().toISOString(),
      target_date: goal.target_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      progress: goal.progress || 0,
      created_at: goal.created_at || new Date().toISOString(),
      updated_at: goal.updated_at || new Date().toISOString(),
      milestones: goal.milestones || []
    };
    
    // Update the user profile with the new goal
    setUserProfile({
      ...userProfile,
      goals: [...userProfile.goals, newGoal],
      // Add some XP for creating a new goal
      experiencePoints: userProfile.experiencePoints + 25
    });
    
    // Show success notification
    alert('New goal created successfully! +25 XP');
  };

  const handleUpdateGoal = (goalId: string, updates: Partial<FitnessGoal>) => {
    if (!userProfile) return;
    
    // Get the current goal
    const currentGoal = userProfile.goals.find(goal => goal.id === goalId);
    if (!currentGoal) return;
    
    let xpGain = 0;
    
    // Special handling for completing a goal
    if (updates.status === 'completed' && currentGoal.status !== 'completed') {
      xpGain += 100; // Award 100 XP for completing a goal
      
      // Check if we need to add a new achievement for completing goals
      let updatedAchievements = [...userProfile.achievements];
      
      // Check if user already has the "Goal Achiever" achievement
      const goalAchieverIndex = updatedAchievements.findIndex(a => a.id === 'achievement-goal-achiever');
      
      if (goalAchieverIndex === -1) {
        // User doesn't have the achievement yet, create it
        updatedAchievements.push({
          id: 'achievement-goal-achiever',
          title: 'Goal Achiever',
          description: 'Complete your first fitness goal',
          category: 'milestone',
          icon: '🎯',
          color: '#8A2BE2',
          earned: true,
          earned_date: new Date().toISOString()
        });
        xpGain += 50; // Bonus XP for first achievement
      }
      
      // Update the user profile with achievements
      setUserProfile(prevProfile => ({
        ...prevProfile!,
        achievements: updatedAchievements
      }));
    }
    
    // Check for milestone completion
    if (updates.milestones) {
      // Count newly completed milestones
      const previousMilestones = currentGoal.milestones.filter(m => m.achieved).length;
      const newMilestones = updates.milestones.filter(m => m.achieved).length;
      const newlyCompletedMilestones = newMilestones - previousMilestones;
      
      if (newlyCompletedMilestones > 0) {
        xpGain += newlyCompletedMilestones * 15; // 15 XP per milestone
      }
      
      // Calculate progress based on milestones
      if (updates.milestones.length > 0) {
        updates.progress = Math.round((updates.milestones.filter(m => m.achieved).length / updates.milestones.length) * 100);
      }
    }
    
    // Update the goals array with the modified goal
    const updatedGoals = userProfile.goals.map(goal => 
      goal.id === goalId 
        ? { ...goal, ...updates, updated_at: new Date().toISOString() } 
        : goal
    );
    
    // Update the user profile
    setUserProfile({
      ...userProfile,
      goals: updatedGoals,
      experiencePoints: userProfile.experiencePoints + xpGain
    });
    
    // Check if user leveled up
    const newExperiencePoints = userProfile.experiencePoints + xpGain;
    const nextLevelThreshold = calculateNextLevelPoints(userProfile.level);
    
    if (newExperiencePoints >= nextLevelThreshold) {
      // Level up!
      setUserProfile(prevProfile => ({
        ...prevProfile!,
        level: prevProfile!.level + 1
      }));
      
      // Show level up notification
      alert(`🎉 Congratulations! You've reached level ${userProfile.level + 1}!`);
    } else if (xpGain > 0) {
      // Show XP notification
      alert(`+${xpGain} XP earned!`);
    }
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!userProfile) return;
    
    // Filter out the goal to be deleted
    const updatedGoals = userProfile.goals.filter(goal => goal.id !== goalId);
    
    // Update the user profile
    setUserProfile({
      ...userProfile,
      goals: updatedGoals
    });
    
    // Show notification
    alert('Goal deleted successfully');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="bg-red-50 p-4 rounded-md text-red-800 text-center">
        <p className="font-medium">Error: {error || 'Failed to load profile data'}</p>
        <button
          onClick={fetchUserProfile}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fitness Goals & Achievements</h1>
          <p className="text-gray-600">Track your progress and earn rewards on your fitness journey</p>
        </div>
        <div className="mt-4 md:mt-0">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setActiveSection('goals')}
              className={`px-4 py-2 text-sm font-medium border ${
                activeSection === 'goals'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              Goals
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('achievements')}
              className={`px-4 py-2 text-sm font-medium border ${
                activeSection === 'achievements'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              } rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              Achievements
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {activeSection === 'goals' && (
          <GoalSetting 
            goals={userProfile.goals} 
            onUpdateGoal={handleUpdateGoal} 
            onAddGoal={handleAddGoal} 
            onDeleteGoal={handleDeleteGoal} 
          />
        )}
        {activeSection === 'achievements' && (
          <Achievements 
            achievements={userProfile.achievements} 
            level={userProfile.level} 
            experiencePoints={userProfile.experiencePoints} 
            nextLevelPoints={calculateNextLevelPoints(userProfile.level)}
          />
        )}
        {activeSection === 'levels' && (
          <>
            {showGuide && <LevelSystemGuide onClose={() => setShowGuide(false)} />}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Your Level Progress</h3>
              <button 
                onClick={() => setShowGuide(true)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                How It Works
              </button>
            </div>
            <LevelSystem 
              userProfile={userProfile} 
              achievements={userProfile.achievements}
            />
            <div className="mt-8">
              <h3 className="text-xl font-bold mb-4">Ways to Earn XP</h3>
              <XpRules rules={userProfile.xpRules} />
            </div>
          </>
        )}
        {activeSection === 'medals' && (
          <MedalSystem 
            medals={userProfile.medals}
            userProfile={{
              name: userProfile.name,
              level: userProfile.level
            }}
          />
        )}
      </div>
    </div>
  );
};

export default FitnessGoalsPage;
