import React, { useState, useEffect } from 'react';
import ExerciseCard, { ExerciseDetail } from '../components/ExerciseCard';
import { apiClient, demoMode, type Exercise } from '../api';

const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favoriteExercises');
      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error('Error loading favorite exercises from localStorage:', err);
      return [];
    }
  });
  
  // Filter states
  const [filters, setFilters] = useState({
    muscleGroup: '',
    difficulty: '',
    equipment: '',
    searchQuery: '',
    showFavoritesOnly: false,
  });

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use demo data in development mode or if API isn't available
        if (demoMode.isDemoMode()) {
          setExercises(demoMode.getDemoExercises());
        } else {
          const data = await apiClient.getExercises();
          setExercises(data);
        }
      } catch (err: any) {
        console.error('Error fetching exercises:', err);
        setError(err.message || 'Failed to load exercises');
        // Fallback to demo data on error
        setExercises(demoMode.getDemoExercises());
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Extract unique values for filter dropdowns
  const muscleGroups = [...new Set(exercises.flatMap(ex => ex.muscle_group))].sort();
  const difficulties = [...new Set(exercises.map(ex => ex.difficulty))].sort();
  const equipmentList = [...new Set(exercises.flatMap(ex => ex.equipment_required))].sort();

  // Apply filters
  const filteredExercises = exercises.filter(exercise => {
    // Filter by favorites
    if (filters.showFavoritesOnly && !favoriteExercises.includes(exercise.id)) {
      return false;
    }
    
    // Filter by muscle group
    if (filters.muscleGroup && !exercise.muscle_group.includes(filters.muscleGroup)) {
      return false;
    }
    
    // Filter by difficulty
    if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
      return false;
    }
    
    // Filter by equipment
    if (filters.equipment && !exercise.equipment_required.includes(filters.equipment)) {
      return false;
    }
    
    // Filter by search query
    if (filters.searchQuery) {
      const searchLower = filters.searchQuery.toLowerCase();
      return (
        exercise.name.toLowerCase().includes(searchLower) ||
        exercise.description.toLowerCase().includes(searchLower) ||
        exercise.muscle_group.some((muscle: string) => muscle.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exercise Library</h1>
        <p className="text-gray-600">Browse our comprehensive collection of exercises to build your perfect workout</p>
      </div>
      
      {/* Filters */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">Filter Exercises</h2>
          <div className="flex items-center space-x-4">
            {/* View toggle */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setView('grid')} 
                className={`p-2 ${view === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'} rounded-md`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button 
                onClick={() => setView('list')} 
                className={`p-2 ${view === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'} rounded-md`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Favorites toggle */}
            <div className="flex items-center">
              <label htmlFor="showFavoritesOnly" className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="showFavoritesOnly"
                  name="showFavoritesOnly"
                  checked={filters.showFavoritesOnly}
                  onChange={(e) => setFilters(prev => ({ ...prev, showFavoritesOnly: e.target.checked }))}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Favorites Only</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search input */}
          <div>
            <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              id="searchQuery"
              name="searchQuery"
              placeholder="Search exercises..."
              value={filters.searchQuery}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          {/* Muscle Group filter */}
          <div>
            <label htmlFor="muscleGroup" className="block text-sm font-medium text-gray-700 mb-1">Muscle Group</label>
            <select
              id="muscleGroup"
              name="muscleGroup"
              value={filters.muscleGroup}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Muscle Groups</option>
              {muscleGroups.map((muscle) => (
                <option key={muscle} value={muscle}>{muscle}</option>
              ))}
            </select>
          </div>
          
          {/* Difficulty filter */}
          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              id="difficulty"
              name="difficulty"
              value={filters.difficulty}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Difficulties</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
          
          {/* Equipment filter */}
          <div>
            <label htmlFor="equipment" className="block text-sm font-medium text-gray-700 mb-1">Equipment</label>
            <select
              id="equipment"
              name="equipment"
              value={filters.equipment}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Equipment</option>
              {equipmentList.map((equipment) => (
                <option key={equipment} value={equipment}>{equipment}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading exercises...</p>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && !exercises.length && (
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
      )}
      
      {/* No results */}
      {!loading && filteredExercises.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No exercises found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your filters to find exercises</p>
          <button 
            onClick={() => setFilters({
              muscleGroup: '',
              difficulty: '',
              equipment: '',
              searchQuery: '',
              showFavoritesOnly: false
            })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition"
          >
            Reset Filters
          </button>
        </div>
      )}
      
      {/* Exercise grid/list */}
      {!loading && filteredExercises.length > 0 && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Showing {filteredExercises.length} exercises</p>
            <div className="text-sm text-gray-500">
              {favoriteExercises.length} exercise{favoriteExercises.length !== 1 ? 's' : ''} in favorites
            </div>
          </div>
          
          {view === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredExercises.map(exercise => (
                <div key={exercise.id} className="relative">
                  <button 
                    className={`absolute top-3 right-3 z-10 p-1.5 rounded-full ${
                      favoriteExercises.includes(exercise.id) 
                        ? 'bg-yellow-100 text-yellow-500' 
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (favoriteExercises.includes(exercise.id)) {
                        const newFavorites = favoriteExercises.filter(id => id !== exercise.id);
                        setFavoriteExercises(newFavorites);
                        localStorage.setItem('favoriteExercises', JSON.stringify(newFavorites));
                      } else {
                        const newFavorites = [...favoriteExercises, exercise.id];
                        setFavoriteExercises(newFavorites);
                        localStorage.setItem('favoriteExercises', JSON.stringify(newFavorites));
                      }
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path 
                        fillRule="evenodd" 
                        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                  <ExerciseCard 
                    exercise={exercise}
                    onClick={() => setSelectedExercise(exercise)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredExercises.map(exercise => (
                <div 
                  key={exercise.id} 
                  className="bg-white rounded-lg shadow-md p-4 flex cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedExercise(exercise)}
                >
                  <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden mr-4 flex-shrink-0">
                    {exercise.image_url ? (
                      <img 
                        src={exercise.image_url} 
                        alt={`${exercise.name} exercise`} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gray-100">
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-8 w-8 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                      <div className="flex items-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 mr-2">
                          {exercise.difficulty}
                        </span>
                        <button 
                          className={`p-1.5 rounded-full ${
                            favoriteExercises.includes(exercise.id) 
                              ? 'bg-yellow-100 text-yellow-500' 
                              : 'bg-gray-100 text-gray-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (favoriteExercises.includes(exercise.id)) {
                              const newFavorites = favoriteExercises.filter(id => id !== exercise.id);
                              setFavoriteExercises(newFavorites);
                              localStorage.setItem('favoriteExercises', JSON.stringify(newFavorites));
                            } else {
                              const newFavorites = [...favoriteExercises, exercise.id];
                              setFavoriteExercises(newFavorites);
                              localStorage.setItem('favoriteExercises', JSON.stringify(newFavorites));
                            }
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path 
                              fillRule="evenodd" 
                              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" 
                              clipRule="evenodd" 
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{exercise.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {exercise.muscle_group.map((muscle, idx) => (
                        <span 
                          key={idx}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                    
                    <div className="mt-2 text-xs text-gray-500">
                      Equipment: {exercise.equipment_required.join(', ') || 'None'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      
      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetail 
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  );
};

export default ExerciseLibrary;
