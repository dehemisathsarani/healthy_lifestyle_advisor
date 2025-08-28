import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

export const WellnessToolkit: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'breathing' | 'grounding' | 'gratitude' | 'routines'>('breathing');
  const [isLoading, setIsLoading] = useState(false);
  const [breathingExercise, setBreathingExercise] = useState<any>(null);
  const [groundingTechnique, setGroundingTechnique] = useState<any>(null);
  const [gratitudePrompt, setGratitudePrompt] = useState<any>(null);
  const [wellnessRoutine, setWellnessRoutine] = useState<any>(null);
  const [routineArea, setRoutineArea] = useState<'sleep' | 'nutrition' | 'movement' | 'social'>('sleep');
  const [journalEntry, setJournalEntry] = useState('');
  const [journalSubmitted, setJournalSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBreathingExercise = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/mental-health/wellness/breathing?technique=box', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setBreathingExercise(data);
      }
    } catch (error) {
      console.error('Error getting breathing exercise:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGroundingTechnique = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const response = await apiFetch('/api/mental-health/wellness/grounding', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setGroundingTechnique(data);
      } else {
        setError('Failed to get grounding technique. Please try again.');
      }
    } catch (error) {
      console.error('Error getting grounding technique:', error);
      setError('Unable to retrieve grounding technique. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getGratitudePrompt = async () => {
    try {
      setIsLoading(true);
      setError(null); // Clear any previous errors
      const response = await apiFetch('/api/mental-health/wellness/gratitude', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setGratitudePrompt(data);
      } else {
        setError('Failed to get gratitude prompt. Please try again.');
      }
    } catch (error) {
      console.error('Error getting gratitude prompt:', error);
      setError('Unable to retrieve gratitude prompt. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getWellnessRoutine = async () => {
    try {
      setIsLoading(true);
      const response = await apiFetch(`/api/mental-health/wellness/routine?area=${routineArea}`, {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        setWellnessRoutine(data);
      }
    } catch (error) {
      console.error('Error getting wellness routine:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitJournalEntry = async () => {
    if (!journalEntry.trim()) return;
    
    try {
      setIsLoading(true);
      const response = await apiFetch('/api/mental-health/journal/mood-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entry: journalEntry
        })
      });

      if (response.ok) {
        await response.json();
        setJournalSubmitted(true);
        setTimeout(() => {
          setJournalEntry('');
          setJournalSubmitted(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error submitting journal entry:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          🧰 Wellness Toolkit
        </h3>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center mb-6">
          <div className="flex flex-wrap space-x-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'breathing', label: '🧘 Breathing', icon: '🧘' },
              { key: 'grounding', label: '👣 Grounding', icon: '👣' },
              { key: 'gratitude', label: '🙏 Gratitude', icon: '🙏' },
              { key: 'routines', label: '🔄 Routines', icon: '🔄' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeSection === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content Area */}
        <div className="mb-8">
          {activeSection === 'breathing' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Box breathing (4-4-4-4) is a simple technique that can help reduce stress and improve focus.
              </p>
              
              <button
                onClick={getBreathingExercise}
                disabled={isLoading}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Get Box Breathing Exercise'}
              </button>
              
              {breathingExercise && breathingExercise.exercise && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mt-4">
                  <h4 className="font-medium text-blue-800 mb-2">
                    {breathingExercise.exercise.name}
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    {breathingExercise.exercise.description}
                  </p>
                  <div className="text-sm">
                    <strong className="text-blue-800">Steps:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {breathingExercise.exercise.steps.map((step: string, index: number) => (
                        <li key={index} className="text-blue-700">{step}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-sm text-blue-700 mt-3">
                    <strong>Repetitions:</strong> {breathingExercise.exercise.repetitions}
                  </p>
                  <div className="mt-3 text-sm">
                    <strong className="text-blue-800">Benefits:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {breathingExercise.exercise.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="text-blue-700">{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'grounding' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                The 5-4-3-2-1 grounding technique can help during moments of anxiety by connecting you with your senses.
              </p>
              
              <button
                onClick={getGroundingTechnique}
                disabled={isLoading}
                className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Get Grounding Technique'}
              </button>
              
              {error && activeSection === 'grounding' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md mt-3 text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              {groundingTechnique && groundingTechnique.technique && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 mt-4">
                  <h4 className="font-medium text-green-800 mb-2">
                    {groundingTechnique.technique.name}
                  </h4>
                  <p className="text-sm text-green-700 mb-3">
                    {groundingTechnique.technique.description}
                  </p>
                  <div className="text-sm">
                    <strong className="text-green-800">Steps:</strong>
                    <ul className="list-decimal list-inside mt-1 space-y-2">
                      {groundingTechnique.technique.steps.map((step: string, index: number) => (
                        <li key={index} className="text-green-700">{step}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 text-sm">
                    <strong className="text-green-800">Benefits:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {groundingTechnique.technique.benefits.map((benefit: string, index: number) => (
                        <li key={index} className="text-green-700">{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'gratitude' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Practicing gratitude can help shift your focus to positive aspects of life, even during challenging times.
              </p>
              
              <button
                onClick={getGratitudePrompt}
                disabled={isLoading}
                className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Get Gratitude Prompt'}
              </button>
              
              {error && activeSection === 'gratitude' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md mt-3 text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              {gratitudePrompt && gratitudePrompt.prompt && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 mt-4">
                  <h4 className="font-medium text-purple-800 mb-3">
                    Today's Gratitude Reflection
                  </h4>
                  <p className="text-md text-purple-700 mb-2 font-medium">
                    {gratitudePrompt.prompt.prompt}
                  </p>
                  <p className="text-sm text-purple-600 italic mb-4">
                    Examples: {gratitudePrompt.prompt.example}
                  </p>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-purple-800 mb-2">
                      Want to jot a sentence about what might have influenced today's mood?
                    </label>
                    <textarea
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                      placeholder="Your thoughts here..."
                      rows={3}
                      className="w-full px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button
                      onClick={submitJournalEntry}
                      disabled={isLoading || !journalEntry.trim()}
                      className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                    >
                      {isLoading ? 'Saving...' : 'Save Journal Entry'}
                    </button>
                    {journalSubmitted && (
                      <p className="text-green-600 mt-2">✓ Journal entry saved!</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeSection === 'routines' && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                Simple routines can help support different aspects of wellness in your daily life.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { key: 'sleep', label: '😴 Sleep' },
                  { key: 'nutrition', label: '🥗 Nutrition' },
                  { key: 'movement', label: '🚶 Movement' },
                  { key: 'social', label: '👥 Social' }
                ].map((area) => (
                  <button
                    key={area.key}
                    onClick={() => setRoutineArea(area.key as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      routineArea === area.key
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
              
              <button
                onClick={getWellnessRoutine}
                disabled={isLoading}
                className="w-full md:w-auto px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : `Get ${routineArea.charAt(0).toUpperCase() + routineArea.slice(1)} Routine`}
              </button>
              
              {wellnessRoutine && (wellnessRoutine.routine || wellnessRoutine.routines) && (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 mt-4">
                  {wellnessRoutine.routine ? (
                    // Single routine
                    <>
                      <h4 className="font-medium text-amber-800 mb-2">
                        {wellnessRoutine.routine.name}
                      </h4>
                      <p className="text-sm text-amber-700 mb-3">
                        {wellnessRoutine.routine.description}
                      </p>
                      <div className="text-sm">
                        <strong className="text-amber-800">Suggestions:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {wellnessRoutine.routine.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="text-amber-700">{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  ) : (
                    // Multiple routines
                    <div className="space-y-6">
                      {Object.keys(wellnessRoutine.routines).map((key) => (
                        <div key={key}>
                          <h4 className="font-medium text-amber-800 mb-2">
                            {wellnessRoutine.routines[key].name}
                          </h4>
                          <p className="text-sm text-amber-700 mb-2">
                            {wellnessRoutine.routines[key].description}
                          </p>
                          <div className="text-sm">
                            <strong className="text-amber-800">Suggestions:</strong>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {wellnessRoutine.routines[key].suggestions.map((suggestion: string, index: number) => (
                                <li key={index} className="text-amber-700">{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
