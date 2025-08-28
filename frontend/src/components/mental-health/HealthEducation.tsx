import React, { useState } from 'react';
import { apiFetch } from '../../lib/api';

export const HealthEducation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'medication' | 'health-topic'>('medication');
  const [medicationName, setMedicationName] = useState('');
  const [healthTopic, setHealthTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [medicationInfo, setMedicationInfo] = useState<any>(null);
  const [healthTopicInfo, setHealthTopicInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const getMedicationInfo = async () => {
    if (!medicationName.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setMedicationInfo(null);
      
      const response = await apiFetch('/api/mental-health/education/medication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          medication_name: medicationName.trim()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to get medication information: ${response.statusText}`);
      }

      const data = await response.json();
      setMedicationInfo(data);
    } catch (err) {
      console.error('Error fetching medication info:', err);
      setError('Unable to retrieve medication information. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthTopicInfo = async () => {
    if (!healthTopic.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setHealthTopicInfo(null);
      
      const response = await apiFetch(`/api/mental-health/education/health-topic?topic=${encodeURIComponent(healthTopic.trim())}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`Failed to get health topic information: ${response.statusText}`);
      }

      const data = await response.json();
      setHealthTopicInfo(data);
    } catch (err) {
      console.error('Error fetching health topic info:', err);
      setError('Unable to retrieve health topic information. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'medication') {
      getMedicationInfo();
    } else {
      getHealthTopicInfo();
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          📚 Health Education Resources
        </h3>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
          <p className="text-blue-700 text-sm">
            <strong>Educational Information Only:</strong> This information is for educational purposes only and not a substitute for professional medical advice.
            Always consult a healthcare provider about medications, side effects, and treatment options.
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex mb-6">
          <button
            onClick={() => setActiveTab('medication')}
            className={`px-4 py-2 rounded-t-md font-medium transition-colors ${
              activeTab === 'medication'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💊 Medication Information
          </button>
          <button
            onClick={() => setActiveTab('health-topic')}
            className={`px-4 py-2 rounded-t-md font-medium transition-colors ${
              activeTab === 'health-topic'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔍 Health Topics
          </button>
        </div>
        
        {/* Content Area */}
        <div className="space-y-4">
          {activeTab === 'medication' && (
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="medication" className="block text-sm font-medium text-gray-700 mb-1">
                    Medication Name:
                  </label>
                  <input
                    type="text"
                    id="medication"
                    value={medicationName}
                    onChange={(e) => setMedicationName(e.target.value)}
                    placeholder="Enter medication name (e.g., sertraline)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !medicationName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Searching...' : 'Get Medication Info'}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {medicationInfo && !medicationInfo.error && (
                <div className="mt-6 space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-800 text-lg mb-2">
                      {medicationInfo.medication}
                    </h4>
                    
                    {/* RxNorm Information */}
                    {medicationInfo.rxnorm && medicationInfo.rxnorm.status === 'success' && (
                      <div className="mb-4">
                        <h5 className="font-medium text-blue-700 mb-1">Names & Identifiers:</h5>
                        {medicationInfo.rxnorm.generic_names?.length > 0 && (
                          <p className="text-sm text-blue-700 mb-1">
                            <strong>Generic Names:</strong> {medicationInfo.rxnorm.generic_names.join(', ')}
                          </p>
                        )}
                        {medicationInfo.rxnorm.brand_names?.length > 0 && (
                          <p className="text-sm text-blue-700 mb-1">
                            <strong>Brand Names:</strong> {medicationInfo.rxnorm.brand_names.join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* FDA Label Information */}
                    {medicationInfo.fda_label && medicationInfo.fda_label.status === 'success' && (
                      <div className="space-y-4">
                        {medicationInfo.fda_label.sections?.indications_and_usage && (
                          <div>
                            <h5 className="font-medium text-blue-700 mb-1">Uses:</h5>
                            <div className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200">
                              {Array.isArray(medicationInfo.fda_label.sections.indications_and_usage) 
                                ? medicationInfo.fda_label.sections.indications_and_usage[0] 
                                : medicationInfo.fda_label.sections.indications_and_usage}
                            </div>
                          </div>
                        )}
                        
                        {medicationInfo.fda_label.sections?.adverse_reactions && (
                          <div>
                            <h5 className="font-medium text-blue-700 mb-1">Adverse Reactions:</h5>
                            <div className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200 max-h-60 overflow-y-auto">
                              {Array.isArray(medicationInfo.fda_label.sections.adverse_reactions) 
                                ? medicationInfo.fda_label.sections.adverse_reactions[0] 
                                : medicationInfo.fda_label.sections.adverse_reactions}
                            </div>
                          </div>
                        )}
                        
                        {medicationInfo.fda_label.sections?.warnings && (
                          <div>
                            <h5 className="font-medium text-blue-700 mb-1">Warnings:</h5>
                            <div className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200 max-h-60 overflow-y-auto">
                              {Array.isArray(medicationInfo.fda_label.sections.warnings) 
                                ? medicationInfo.fda_label.sections.warnings[0] 
                                : medicationInfo.fda_label.sections.warnings}
                            </div>
                          </div>
                        )}
                        
                        {medicationInfo.fda_label.sections?.patient_counseling_information && (
                          <div>
                            <h5 className="font-medium text-blue-700 mb-1">Patient Information:</h5>
                            <div className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200 max-h-60 overflow-y-auto">
                              {Array.isArray(medicationInfo.fda_label.sections.patient_counseling_information) 
                                ? medicationInfo.fda_label.sections.patient_counseling_information[0] 
                                : medicationInfo.fda_label.sections.patient_counseling_information}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* MedlinePlus Information */}
                    {medicationInfo.medlineplus && medicationInfo.medlineplus.status === 'success' && medicationInfo.medlineplus.topics?.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-blue-700 mb-1">Related Health Information:</h5>
                        <div className="space-y-2">
                          {medicationInfo.medlineplus.topics.map((topic: any, index: number) => (
                            <div key={index} className="text-sm">
                              <a 
                                href={topic.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {topic.title}
                              </a>
                              {topic.summary && (
                                <p className="text-gray-600 text-xs mt-1">{topic.summary}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-6 pt-4 border-t border-blue-200 text-xs text-blue-700">
                      <p>Data sources: RxNorm, openFDA, MedlinePlus</p>
                      <p className="mt-1 italic">{medicationInfo.disclaimer}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'health-topic' && (
            <div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="health-topic" className="block text-sm font-medium text-gray-700 mb-1">
                    Health Topic:
                  </label>
                  <input
                    type="text"
                    id="health-topic"
                    value={healthTopic}
                    onChange={(e) => setHealthTopic(e.target.value)}
                    placeholder="Enter health topic (e.g., depression, anxiety, sleep)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !healthTopic.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  {isLoading ? 'Searching...' : 'Get Health Topic Info'}
                </button>
              </form>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}
              
              {healthTopicInfo && !healthTopicInfo.error && healthTopicInfo.topics?.length > 0 && (
                <div className="mt-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 text-lg mb-4">
                      Information about: {healthTopicInfo.query}
                    </h4>
                    
                    <div className="space-y-6">
                      {healthTopicInfo.topics.map((topic: any, index: number) => (
                        <div key={index} className="border-b border-green-200 pb-4 last:border-b-0 last:pb-0">
                          <h5 className="font-medium text-green-700 mb-2">{topic.title}</h5>
                          
                          {topic.summary && (
                            <div className="text-sm text-gray-700 p-3 bg-white rounded border border-gray-200 mb-3">
                              {topic.summary}
                            </div>
                          )}
                          
                          {topic.url && (
                            <a 
                              href={topic.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-green-600 hover:underline flex items-center gap-1"
                            >
                              <span>Read more at MedlinePlus</span>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-green-200 text-xs text-green-700">
                      <p>Data source: MedlinePlus (National Library of Medicine)</p>
                      <p className="mt-1 italic">{healthTopicInfo.disclaimer}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {healthTopicInfo && !healthTopicInfo.error && (!healthTopicInfo.topics || healthTopicInfo.topics.length === 0) && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-yellow-700">
                  No information found for this health topic. Try a different search term or check your spelling.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
