import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient, demoMode, type WorkoutHistory, type WorkoutFilter } from '../api';

const WorkoutHistoryPage: React.FC = () => {
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState<WorkoutFilter>({
    page: 1,
    limit: 10,
    start_date: undefined,
    end_date: undefined,
    workout_type: undefined
  });

  // Date range for filtering
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  
  // Workout type filter
  const [workoutTypeFilter, setWorkoutTypeFilter] = useState('');

  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Apply date range filters if set
        const updatedFilters = { ...filters };
        if (dateRange.startDate) {
          updatedFilters.start_date = dateRange.startDate;
        }
        if (dateRange.endDate) {
          updatedFilters.end_date = dateRange.endDate;
        }
        if (workoutTypeFilter) {
          updatedFilters.workout_type = workoutTypeFilter;
        }
        
        // Use demo data in development mode or if API isn't available
        if (demoMode.isDemoMode()) {
          setWorkoutHistory(demoMode.getDemoWorkoutHistory(updatedFilters));
        } else {
          const data = await apiClient.getWorkoutHistory(updatedFilters);
          setWorkoutHistory(data);
        }
      } catch (err: any) {
        console.error('Error fetching workout history:', err);
        setError(err.message || 'Failed to load workout history');
        // Fallback to demo data on error
        setWorkoutHistory(demoMode.getDemoWorkoutHistory(filters));
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutHistory();
  }, [filters, dateRange.startDate, dateRange.endDate, workoutTypeFilter]);

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleWorkoutTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkoutTypeFilter(e.target.value);
  };

  const handleApplyFilters = () => {
    // Reset to page 1 when applying new filters
    setFilters(prev => ({
      ...prev,
      page: 1,
      start_date: dateRange.startDate || undefined,
      end_date: dateRange.endDate || undefined,
      workout_type: workoutTypeFilter || undefined
    }));
  };

  const handleResetFilters = () => {
    setDateRange({
      startDate: '',
      endDate: ''
    });
    setWorkoutTypeFilter('');
    setFilters({
      page: 1,
      limit: 10,
      start_date: undefined,
      end_date: undefined,
      workout_type: undefined
    });
  };

  const getRatingStars = (rating: number | null) => {
    if (rating === null) return null;
    
    return Array(5).fill(0).map((_, i) => (
      <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
        ★
      </span>
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const toggleWorkoutExpansion = (id: string) => {
    if (expandedWorkout === id) {
      setExpandedWorkout(null);
    } else {
      setExpandedWorkout(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your workout history...</p>
        </div>
      </div>
    );
  }

  if (error && !workoutHistory) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workoutHistory) return null;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workout History</h1>
          <p className="text-gray-600">Track and analyze your completed workouts</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link 
            to="/planner" 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            Plan New Workout
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium text-gray-700 mb-3">Filter Workouts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              id="startDate"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              id="endDate"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="workoutType" className="block text-sm font-medium text-gray-700 mb-1">Workout Type</label>
            <input
              type="text"
              id="workoutType"
              value={workoutTypeFilter}
              onChange={handleWorkoutTypeChange}
              placeholder="E.g. Upper Body, Cardio"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4 space-x-3">
          <button 
            onClick={handleResetFilters}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md transition"
          >
            Reset
          </button>
          <button 
            onClick={handleApplyFilters}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Workout History List */}
      {workoutHistory.completed_workouts.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No workout history found</h3>
          <p className="text-gray-500 mb-4">No workouts match your current filters</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workoutHistory.completed_workouts.map((workout) => (
            <div 
              key={workout.id} 
              className="bg-white rounded-lg shadow p-5 transition-all duration-200"
            >
              <div 
                className="flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer"
                onClick={() => toggleWorkoutExpansion(workout.id)}
              >
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full p-3 mr-4">
                    {workout.session_name.toLowerCase().includes('upper') && (
                      <span className="text-2xl">💪</span>
                    )}
                    {workout.session_name.toLowerCase().includes('lower') && (
                      <span className="text-2xl">🦵</span>
                    )}
                    {workout.session_name.toLowerCase().includes('core') && (
                      <span className="text-2xl">🧘</span>
                    )}
                    {workout.session_name.toLowerCase().includes('cardio') && (
                      <span className="text-2xl">🏃</span>
                    )}
                    {workout.session_name.toLowerCase().includes('full') && (
                      <span className="text-2xl">🏆</span>
                    )}
                    {!workout.session_name.toLowerCase().includes('upper') && 
                     !workout.session_name.toLowerCase().includes('lower') &&
                     !workout.session_name.toLowerCase().includes('core') &&
                     !workout.session_name.toLowerCase().includes('cardio') &&
                     !workout.session_name.toLowerCase().includes('full') && (
                      <span className="text-2xl">⚡</span>
                     )}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-indigo-700">{workout.session_name}</h3>
                    <p className="text-gray-600">{formatDate(workout.date)}</p>
                  </div>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col md:flex-row items-start md:items-center md:space-x-6">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{workout.duration} min</span>
                  </div>
                  <div className="flex items-center mt-1 md:mt-0">
                    <svg className="w-5 h-5 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-gray-700">{workout.calories_burned} kcal</span>
                  </div>
                  <div className="flex items-center mt-1 md:mt-0">
                    <svg className="w-5 h-5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{workout.exercises_completed} exercises</span>
                  </div>
                  <div className="flex text-xl mt-1 md:mt-0">
                    {getRatingStars(workout.rating)}
                  </div>
                </div>
                <div className="mt-2 md:mt-0 md:ml-4">
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedWorkout === workout.id ? 'transform rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {expandedWorkout === workout.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="mb-3">
                    <span className="font-medium text-gray-700">Plan:</span> {workout.plan_name}
                  </div>
                  
                  {workout.notes && (
                    <div className="mb-3">
                      <span className="font-medium text-gray-700">Notes:</span>
                      <p className="text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">{workout.notes}</p>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mt-4">
                    <Link 
                      to={`/workout/${workout.id}`} 
                      className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center"
                    >
                      View Workout Details
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                    
                    <div className="flex space-x-2">
                      <button className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button className="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-full">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {workoutHistory.total_pages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center">
            <button
              onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
              disabled={filters.page === 1}
              className={`px-3 py-1 mr-2 rounded-md ${
                filters.page === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            {[...Array(workoutHistory.total_pages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 mx-1 rounded-md ${
                  filters.page === i + 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(Math.min(workoutHistory.total_pages, filters.page + 1))}
              disabled={filters.page === workoutHistory.total_pages}
              className={`px-3 py-1 ml-2 rounded-md ${
                filters.page === workoutHistory.total_pages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
      
      {/* Summary Stats */}
      <div className="mt-8 bg-white rounded-lg shadow p-5">
        <h2 className="text-xl font-semibold mb-4">Workout Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-sm text-indigo-700 font-medium">Total Workouts</p>
            <p className="text-3xl font-bold text-gray-900">{workoutHistory.completed_workouts.length}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Calories Burned</p>
            <p className="text-3xl font-bold text-gray-900">
              {workoutHistory.completed_workouts.reduce((sum, workout) => sum + workout.calories_burned, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">Total Duration</p>
            <p className="text-3xl font-bold text-gray-900">
              {workoutHistory.completed_workouts.reduce((sum, workout) => sum + workout.duration, 0)} min
            </p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm text-yellow-700 font-medium">Avg. Rating</p>
            <p className="text-3xl font-bold text-gray-900">
              {(workoutHistory.completed_workouts.reduce((sum, workout) => sum + (workout.rating || 0), 0) / 
                workoutHistory.completed_workouts.filter(w => w.rating !== null).length).toFixed(1)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutHistoryPage;
