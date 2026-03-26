import React, { useState, useEffect } from 'react';
import HealthDataForm from '../components/HealthDataForm';
import HealthDataTable from '../components/HealthDataTable';
import { HealthMetric } from '../healthApi';
import { demoMode } from '../api';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

const UserHealthData: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [activeView, setActiveView] = useState<'form' | 'summary' | 'heart-rate' | 'sleep' | 'activity'>('form');

  // Load user's health metrics
  useEffect(() => {
    fetchUserHealthMetrics();
  }, [filterType]);

  const fetchUserHealthMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (demoMode.isDemoMode()) {
        // Get metrics from demo mode
        const metrics = demoMode.getUserHealthMetrics(filterType || undefined);
        setHealthMetrics(metrics);
      } else {
        // This would call the real API in production
        console.error('Real API not implemented');
        setError('API connection not available');
      }
    } catch (err) {
      console.error('Error fetching health metrics:', err);
      setError('Failed to load your health data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetric = async (metricData: Partial<HealthMetric>) => {
    try {
      setSubmitting(true);
      setError(null);
      
      if (demoMode.isDemoMode()) {
        // Add metric in demo mode
        const newMetric = demoMode.addHealthMetric(metricData);
        
        // Update the displayed metrics
        setHealthMetrics(prevMetrics => [newMetric, ...prevMetrics]);
        setSuccessMessage('Health data saved successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        // This would call the real API in production
        console.error('Real API not implemented');
        setError('API connection not available');
      }
    } catch (err) {
      console.error('Error adding health metric:', err);
      setError('Failed to save health data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!confirm('Are you sure you want to delete this data?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      if (demoMode.isDemoMode()) {
        // Delete metric in demo mode
        const success = demoMode.deleteHealthMetric(metricId);
        
        if (success) {
          // Remove the metric from the displayed metrics
          setHealthMetrics(prevMetrics => prevMetrics.filter(m => m.id !== metricId));
          setSuccessMessage('Health data deleted successfully!');
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            setSuccessMessage(null);
          }, 3000);
        } else {
          setError('Failed to delete health data');
        }
      } else {
        // This would call the real API in production
        console.error('Real API not implemented');
        setError('API connection not available');
      }
    } catch (err) {
      console.error('Error deleting health metric:', err);
      setError('Failed to delete health data');
    } finally {
      setLoading(false);
    }
  };

  // Render appropriate view based on the active tab
  const renderView = () => {
    switch (activeView) {
      case 'summary':
        return renderSummaryView();
      case 'heart-rate':
        return renderHeartRateView();
      case 'sleep':
        return renderSleepView();
      case 'activity':
        return renderActivityView();
      case 'form':
      default:
        return renderFormView();
    }
  };

  // Render the data entry form view
  const renderFormView = () => {
    return (
      <>
        {/* Health data form */}
        <div className="mb-8">
          <HealthDataForm onSubmit={handleAddMetric} loading={submitting} />
        </div>
        
        {/* Health data display */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Your Health Data</h2>
            
            {/* Filter */}
            <div className="flex items-center">
              <label htmlFor="filter" className="mr-2 text-sm font-medium text-gray-700">
                Filter:
              </label>
              <select
                id="filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-1 text-sm"
              >
                <option value="">All Data</option>
                <option value="heart_rate">Heart Rate</option>
                <option value="blood_pressure">Blood Pressure</option>
                <option value="weight">Weight</option>
                <option value="steps">Steps</option>
                <option value="sleep">Sleep Duration</option>
                <option value="water">Water Intake</option>
                <option value="custom">Custom Metrics</option>
              </select>
            </div>
          </div>
          
          {/* Health data table */}
          <HealthDataTable 
            data={healthMetrics} 
            onDelete={handleDeleteMetric}
            loading={loading} 
          />
        </div>
      </>
    );
  };

  // Render the summary view with latest metrics in each category
  const renderSummaryView = () => {
    // Group metrics by type to get the latest of each type
    const latestMetrics: Record<string, HealthMetric> = {};
    
    healthMetrics.forEach(metric => {
      const type = metric.metricType;
      if (!latestMetrics[type] || new Date(metric.timestamp) > new Date(latestMetrics[type].timestamp)) {
        latestMetrics[type] = metric;
      }
    });

    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Health Summary</h2>
        
        {Object.keys(latestMetrics).length === 0 ? (
          <p className="text-gray-500">No health data recorded yet. Use the form to add some metrics.</p>
        ) : (
          <div className="space-y-6">
            {/* Heart Rate Section */}
            {latestMetrics.heart_rate && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Heart Rate</h3>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-red-600">{latestMetrics.heart_rate.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.heart_rate.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.heart_rate.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Blood Pressure Section */}
            {latestMetrics.blood_pressure && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Blood Pressure</h3>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-indigo-600">{latestMetrics.blood_pressure.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.blood_pressure.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.blood_pressure.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Weight Section */}
            {latestMetrics.weight && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Weight</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-blue-600">{latestMetrics.weight.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.weight.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.weight.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Steps Section */}
            {latestMetrics.steps && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Steps</h3>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-green-600">{latestMetrics.steps.value}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.steps.timestamp).toLocaleString()}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-green-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (Number(latestMetrics.steps.value) / 10000) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Goal: 10,000 steps</div>
                </div>
              </div>
            )}

            {/* Sleep Section */}
            {latestMetrics.sleep && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Sleep Duration</h3>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-purple-600">{latestMetrics.sleep.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.sleep.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.sleep.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Water Intake Section */}
            {latestMetrics.water && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Water Intake</h3>
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-cyan-600">{latestMetrics.water.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.water.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.water.timestamp).toLocaleString()}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div 
                      className="bg-cyan-600 h-2.5 rounded-full" 
                      style={{ width: `${Math.min(100, (Number(latestMetrics.water.value) / 2500) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Goal: 2,500 ml per day</div>
                </div>
              </div>
            )}

            {/* Custom Metrics Section */}
            {latestMetrics.custom && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Custom Metrics</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-3xl font-bold text-gray-600">{latestMetrics.custom.value}</div>
                    <div className="ml-2 text-gray-600">{latestMetrics.custom.unit}</div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Last recorded: {new Date(latestMetrics.custom.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render heart rate specific view
  const renderHeartRateView = () => {
    const heartRateData = healthMetrics.filter(metric => metric.metricType === 'heart_rate')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (heartRateData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Heart Rate Data</h2>
          <p className="text-gray-500">No heart rate data recorded yet. Use the form to add heart rate measurements.</p>
        </div>
      );
    }

    const dates = heartRateData.map(data => new Date(data.timestamp).toLocaleDateString());
    const times = heartRateData.map(data => new Date(data.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
    const values = heartRateData.map(data => Number(data.value));
    const labels = dates.map((date, i) => `${date}, ${times[i]}`);

    // Get average heart rate
    const avgHeartRate = (values.reduce((sum, val) => sum + val, 0) / values.length);
    
    // Create gradient for chart
    const getGradient = (ctx: any) => {
      if (!ctx) return null;
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.4)');
      gradient.addColorStop(1, 'rgba(239, 68, 68, 0.1)');
      return gradient;
    };

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Heart Rate (BPM)',
          data: values,
          borderColor: 'rgb(220, 38, 38)',
          borderWidth: 3,
          pointBackgroundColor: values.map(val => 
            val < 60 ? '#3b82f6' :
            val < 100 ? '#10b981' :
            val < 140 ? '#f97316' : '#ef4444'
          ),
          pointRadius: 5,
          pointHoverRadius: 8,
          fill: true,
          backgroundColor: function(context: any) {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            return getGradient(ctx);
          },
          tension: 0.3,
        },
        {
          label: 'Average',
          data: Array(values.length).fill(avgHeartRate),
          borderColor: 'rgba(109, 40, 217, 0.7)',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false,
        }
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Heart Rate Over Time',
          font: {
            size: 18,
            weight: 'bold' as const
          }
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context: any) {
              const value = context.raw;
              let label = `Heart rate: ${value} BPM`;
              if (value < 60) return [label, 'Zone: Resting'];
              if (value < 100) return [label, 'Zone: Moderate'];
              if (value < 140) return [label, 'Zone: Cardio'];
              return [label, 'Zone: Peak'];
            }
          }
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              yMin: 60,
              yMax: 60,
              borderColor: 'rgba(59, 130, 246, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: 'Resting',
                display: true,
                position: 'start',
                backgroundColor: 'rgba(59, 130, 246, 0.7)',
              }
            },
            line2: {
              type: 'line',
              yMin: 100,
              yMax: 100,
              borderColor: 'rgba(16, 185, 129, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: 'Moderate',
                display: true,
                position: 'start',
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
              }
            },
            line3: {
              type: 'line',
              yMin: 140,
              yMax: 140,
              borderColor: 'rgba(249, 115, 22, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: 'Cardio',
                display: true,
                position: 'start',
                backgroundColor: 'rgba(249, 115, 22, 0.7)',
              }
            }
          }
        }
      },
      scales: {
        y: {
          min: Math.max(0, Math.min(...values) - 10),
          max: Math.max(...values) + 10,
          title: {
            display: true,
            text: 'BPM',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.2)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date & Time',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45
          },
          grid: {
            display: false
          }
        },
      },
      interaction: {
        mode: 'index' as const,
        intersect: false
      },
      animations: {
        tension: {
          duration: 1000,
          easing: 'linear' as const,
          from: 0.2,
          to: 0.3,
          loop: false
        }
      },
    };

    const avgZone = avgHeartRate < 60 ? 'Resting' : 
                  avgHeartRate < 100 ? 'Moderate' :
                  avgHeartRate < 140 ? 'Cardio' : 'Peak';
    
    const avgZoneColor = avgHeartRate < 60 ? 'text-blue-600' : 
                        avgHeartRate < 100 ? 'text-green-600' :
                        avgHeartRate < 140 ? 'text-orange-500' : 'text-red-600';

    return (
      <div className="bg-gradient-to-br from-white to-red-50 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Heart Rate Analysis</h2>
          <div className="flex items-center bg-red-100 px-3 py-1 rounded-full">
            <span className="animate-pulse inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>
            <span className="text-red-700 font-medium">Real-time Monitoring</span>
          </div>
        </div>

        <div className="mb-8 relative">
          <div className="absolute -left-2 top-1/4 h-1/2 w-1 bg-red-500 rounded-full"></div>
          <div className="p-1 bg-white rounded-lg shadow-inner">
            <Line data={chartData} options={chartOptions} className="rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Average</div>
              <div className="h-8 w-8 flex items-center justify-center bg-red-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {avgHeartRate.toFixed(1)} <span className="text-xl">BPM</span>
            </div>
            <div className={`mt-2 ${avgZoneColor} font-medium`}>
              {avgZone} Zone
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Minimum</div>
              <div className="h-8 w-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {Math.min(...values)} <span className="text-xl">BPM</span>
            </div>
            <div className={`mt-2 text-blue-600 font-medium`}>
              Recorded on {dates[values.indexOf(Math.min(...values))]}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Maximum</div>
              <div className="h-8 w-8 flex items-center justify-center bg-red-600 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {Math.max(...values)} <span className="text-xl">BPM</span>
            </div>
            <div className={`mt-2 text-red-600 font-medium`}>
              Recorded on {dates[values.indexOf(Math.max(...values))]}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-3">Heart Rate Zones</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Resting Zone</div>
                <div className="font-semibold">40-60 BPM</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="h-4 w-4 rounded-full bg-green-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Moderate Zone</div>
                <div className="font-semibold">60-100 BPM</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="h-4 w-4 rounded-full bg-orange-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Cardio Zone</div>
                <div className="font-semibold">100-140 BPM</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="h-4 w-4 rounded-full bg-red-600 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Peak Zone</div>
                <div className="font-semibold">140+ BPM</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render sleep specific view
  const renderSleepView = () => {
    const sleepData = healthMetrics.filter(metric => metric.metricType === 'sleep')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sleepData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Sleep Data</h2>
          <p className="text-gray-500">No sleep data recorded yet. Use the form to add sleep duration measurements.</p>
        </div>
      );
    }

    const dates = sleepData.map(data => new Date(data.timestamp).toLocaleDateString());
    const values = sleepData.map(data => Number(data.value));
    const avgSleep = values.reduce((sum, val) => sum + val, 0) / values.length;

    // Calculate sleep quality assessment
    const getSleepQuality = (hours: number) => {
      if (hours < 5) return { text: 'Poor', color: 'text-red-500', bgColor: 'bg-red-100' };
      if (hours < 6) return { text: 'Fair', color: 'text-orange-500', bgColor: 'bg-orange-100' };
      if (hours < 7) return { text: 'Good', color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
      if (hours < 9) return { text: 'Optimal', color: 'text-green-600', bgColor: 'bg-green-100' };
      return { text: 'Excessive', color: 'text-blue-500', bgColor: 'bg-blue-100' };
    };

    const avgQuality = getSleepQuality(avgSleep);
    
    // Generate gradient colors based on sleep duration
    const getBarColor = (hours: number) => {
      if (hours < 5) return 'rgba(239, 68, 68, 0.7)'; // red
      if (hours < 6) return 'rgba(249, 115, 22, 0.7)'; // orange
      if (hours < 7) return 'rgba(245, 158, 11, 0.7)'; // amber
      if (hours < 9) return 'rgba(16, 185, 129, 0.7)'; // green
      return 'rgba(59, 130, 246, 0.7)'; // blue
    };

    const chartData = {
      labels: dates,
      datasets: [
        {
          label: 'Sleep Duration (hours)',
          data: values,
          backgroundColor: values.map(hours => getBarColor(hours)),
          borderColor: values.map(hours => getBarColor(hours).replace('0.7', '1')),
          borderWidth: 1,
          borderRadius: 6,
          hoverBackgroundColor: values.map(hours => getBarColor(hours).replace('0.7', '0.9')),
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Sleep Duration Over Time',
          font: {
            size: 18,
            weight: 'bold' as const
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const hours = context.raw;
              const quality = getSleepQuality(hours);
              return [
                `Duration: ${hours} hours`,
                `Quality: ${quality.text}`
              ];
            }
          }
        },
        annotation: {
          annotations: {
            optimalLine1: {
              type: 'line',
              yMin: 7,
              yMax: 7,
              borderColor: 'rgba(16, 185, 129, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: 'Optimal Range (7-9 hours)',
                display: true,
                position: 'start',
                backgroundColor: 'rgba(16, 185, 129, 0.7)',
              }
            },
            optimalLine2: {
              type: 'line',
              yMin: 9,
              yMax: 9,
              borderColor: 'rgba(16, 185, 129, 0.5)',
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                display: false
              }
            },
            optimalZone: {
              type: 'box',
              yMin: 7,
              yMax: 9,
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              borderWidth: 0,
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(10, Math.max(...values) + 1),
          title: {
            display: true,
            text: 'Hours',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.2)'
          },
          ticks: {
            stepSize: 1
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          grid: {
            display: false
          }
        },
      },
    };
    
    // Calculate sleep trend
    const trend = values.length > 1 ? 
      (values[values.length-1] > values[values.length-2] ? 'up' : 
       values[values.length-1] < values[values.length-2] ? 'down' : 'stable') : 'stable';
    
    const trendClass = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
    const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';

    return (
      <div className="bg-gradient-to-br from-white to-purple-50 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Sleep Analysis</h2>
          <div className="flex items-center bg-purple-100 px-3 py-1 rounded-full">
            <svg className="w-5 h-5 mr-1 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            <span className="text-purple-700 font-medium">Sleep Monitor</span>
          </div>
        </div>

        <div className="mb-8 relative">
          <div className="absolute -left-2 top-1/4 h-1/2 w-1 bg-purple-500 rounded-full"></div>
          <div className="p-1 bg-white rounded-lg shadow-inner">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Average Sleep</div>
              <div className="h-8 w-8 flex items-center justify-center bg-purple-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {avgSleep.toFixed(1)} <span className="text-xl">hrs</span>
            </div>
            <div className={`mt-2 ${avgQuality.color} font-medium`}>
              {avgQuality.text} Quality
            </div>
          </div>
          
          <div className={`bg-gradient-to-br from-white to-${avgQuality.bgColor} p-5 rounded-xl shadow-md`}>
            <div className="text-sm font-medium text-gray-600 mb-2">Sleep Quality</div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className={`${avgQuality.bgColor} h-4 rounded-full`} 
                style={{ width: `${Math.min(100, (avgSleep / 9) * 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Poor (5h)</span>
              <span>Optimal (7-9h)</span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Latest Trend: <span className={trendClass}>{trendIcon} {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}</span>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl shadow-md">
            <div className="text-sm font-medium text-gray-600 mb-3">Sleep Stats</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Shortest Sleep:</span>
                <span className="font-semibold">{Math.min(...values)} hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Longest Sleep:</span>
                <span className="font-semibold">{Math.max(...values)} hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Days Tracked:</span>
                <span className="font-semibold">{values.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Days in Optimal Range:</span>
                <span className="font-semibold">
                  {values.filter(v => v >= 7 && v <= 9).length} ({Math.round(values.filter(v => v >= 7 && v <= 9).length / values.length * 100)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-3">Sleep Duration Guide</h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-red-50 border border-red-200">
              <div className="h-4 w-4 rounded-full bg-red-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Poor</div>
                <div className="font-semibold">Less than 5 hours</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="h-4 w-4 rounded-full bg-orange-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Fair</div>
                <div className="font-semibold">5-6 hours</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="h-4 w-4 rounded-full bg-yellow-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Good</div>
                <div className="font-semibold">6-7 hours</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="h-4 w-4 rounded-full bg-green-600 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Optimal</div>
                <div className="font-semibold">7-9 hours</div>
              </div>
            </div>
            <div className="flex-1 min-w-[150px] flex items-center p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="h-4 w-4 rounded-full bg-blue-500 mr-2"></div>
              <div>
                <div className="text-xs text-gray-500">Excessive</div>
                <div className="font-semibold">More than 9 hours</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render activity specific view
  const renderActivityView = () => {
    const stepsData = healthMetrics.filter(metric => metric.metricType === 'steps')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (stepsData.length === 0) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Activity Data</h2>
          <p className="text-gray-500">No activity data recorded yet. Use the form to add step count measurements.</p>
        </div>
      );
    }

    const dates = stepsData.map(data => new Date(data.timestamp).toLocaleDateString());
    const values = stepsData.map(data => Number(data.value));
    
    // Daily step goal
    const dailyGoal = 10000;
    const avgSteps = values.reduce((sum, val) => sum + val, 0) / values.length;
    const goalAchieved = values.filter(v => v >= dailyGoal).length;
    const goalPercentage = (goalAchieved / values.length) * 100;
    
    // Calculate calories burned (rough estimate: 40 steps = 1 calorie for average person)
    const caloriesBurned = values.map(steps => Math.round(steps / 40));
    const totalCalories = caloriesBurned.reduce((sum, val) => sum + val, 0);
    
    // Calculate distance (rough estimate: 2000 steps = 1 mile)
    const milesWalked = values.map(steps => +(steps / 2000).toFixed(2));
    const totalMiles = milesWalked.reduce((sum, val) => sum + val, 0);

    // Get active days streak
    let currentStreak = 0;
    const streakDates = stepsData.map(d => new Date(d.timestamp).toISOString().split('T')[0]);
    streakDates.sort(); // Ensure dates are in order
    
    // Determine if user is maintaining a streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const hasEntryToday = streakDates.includes(today);
    const hasEntryYesterday = streakDates.includes(yesterday);
    
    if (hasEntryToday || hasEntryYesterday) {
      currentStreak = 1;
      let previousDate = hasEntryToday ? today : yesterday;
      
      for (let i = streakDates.length - 2; i >= 0; i--) {
        const currentDate = streakDates[i];
        const diff = Math.abs(new Date(previousDate).getTime() - new Date(currentDate).getTime());
        const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          previousDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Generate progress color
    const getProgressColor = (steps: number) => {
      const percentage = steps / dailyGoal * 100;
      if (percentage < 25) return 'rgba(239, 68, 68, 0.7)'; // red
      if (percentage < 50) return 'rgba(249, 115, 22, 0.7)'; // orange
      if (percentage < 75) return 'rgba(245, 158, 11, 0.7)'; // amber
      if (percentage < 100) return 'rgba(16, 185, 129, 0.7)'; // green
      return 'rgba(37, 99, 235, 0.7)'; // blue
    };

    const chartData = {
      labels: dates,
      datasets: [
        {
          label: 'Steps',
          data: values,
          backgroundColor: values.map(steps => getProgressColor(steps)),
          borderColor: values.map(steps => getProgressColor(steps).replace('0.7', '1')),
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: values.map(steps => getProgressColor(steps).replace('0.7', '0.9')),
        }
      ],
    };

    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            font: {
              size: 14
            }
          }
        },
        title: {
          display: true,
          text: 'Step Count Over Time',
          font: {
            size: 18,
            weight: 'bold' as const
          }
        },
        tooltip: {
          callbacks: {
            label: function(context: any) {
              const stepCount = context.raw;
              const percentage = Math.round((stepCount / dailyGoal) * 100);
              const calories = Math.round(stepCount / 40);
              const miles = (stepCount / 2000).toFixed(2);
              
              return [
                `Steps: ${stepCount.toLocaleString()}`,
                `${percentage}% of daily goal`,
                `Est. calories: ${calories}`,
                `Est. distance: ${miles} miles`
              ];
            }
          }
        },
        annotation: {
          annotations: {
            line1: {
              type: 'line',
              yMin: dailyGoal,
              yMax: dailyGoal,
              borderColor: 'rgba(75, 85, 99, 0.5)',
              borderWidth: 2,
              borderDash: [5, 5],
              label: {
                content: `Goal: ${dailyGoal.toLocaleString()} steps`,
                display: true,
                position: 'end',
                backgroundColor: 'rgba(75, 85, 99, 0.7)',
              }
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: Math.max(dailyGoal * 1.2, Math.max(...values) * 1.1),
          title: {
            display: true,
            text: 'Steps',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          grid: {
            color: 'rgba(156, 163, 175, 0.2)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Date',
            font: {
              size: 14,
              weight: 'bold' as const
            }
          },
          grid: {
            display: false
          }
        },
      },
    };

    return (
      <div className="bg-gradient-to-br from-white to-green-50 p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Activity Tracking</h2>
          <div className="flex items-center bg-green-100 px-3 py-1 rounded-full">
            <svg className="w-5 h-5 mr-1 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            <span className="text-green-700 font-medium">Steps & Activity</span>
          </div>
        </div>

        <div className="mb-8 relative">
          <div className="absolute -left-2 top-1/4 h-1/2 w-1 bg-green-500 rounded-full"></div>
          <div className="p-1 bg-white rounded-lg shadow-inner">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Average Steps</div>
              <div className="h-8 w-8 flex items-center justify-center bg-green-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {Math.round(avgSteps).toLocaleString()}
            </div>
            <div className="mt-2 text-green-600 font-medium">
              {Math.round((avgSteps / dailyGoal) * 100)}% of goal
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Daily Goal</div>
              <div className="h-8 w-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {dailyGoal.toLocaleString()}
            </div>
            <div className="mt-2 text-blue-600 font-medium">
              {goalAchieved} days achieved ({Math.round(goalPercentage)}%)
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Current Streak</div>
              <div className="h-8 w-8 flex items-center justify-center bg-orange-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {currentStreak} days
            </div>
            <div className="mt-2 text-orange-600 font-medium">
              {currentStreak > 0 ? 'Keep it going!' : 'Start today!'}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl shadow-md transition-transform hover:scale-105 duration-300">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium text-gray-600">Total Distance</div>
              <div className="h-8 w-8 flex items-center justify-center bg-purple-500 text-white rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {totalMiles.toFixed(1)} miles
            </div>
            <div className="mt-2 text-purple-600 font-medium">
              {totalCalories.toLocaleString()} calories burned
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3">Activity Level</h3>
            <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
              <div 
                className={`${avgSteps >= dailyGoal ? 'bg-blue-500' : 'bg-green-500'} h-6 rounded-full flex items-center justify-center text-xs font-medium text-white`} 
                style={{ width: `${Math.min(100, (avgSteps / dailyGoal) * 100)}%` }}
              >
                {Math.round((avgSteps / dailyGoal) * 100)}%
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div>
                <div className="font-medium">Sedentary</div>
                <div className="text-xs text-gray-500">&lt; 5,000 steps</div>
              </div>
              <div>
                <div className="font-medium">Low Active</div>
                <div className="text-xs text-gray-500">5,000-7,499</div>
              </div>
              <div>
                <div className="font-medium">Active</div>
                <div className="text-xs text-gray-500">7,500-9,999</div>
              </div>
              <div>
                <div className="font-medium">Very Active</div>
                <div className="text-xs text-gray-500">10,000+</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-3">Activity Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Highest Step Count:</span>
                <span className="font-semibold">{Math.max(...values).toLocaleString()} steps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="font-semibold">{dates[values.indexOf(Math.max(...values))]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Steps:</span>
                <span className="font-semibold">{values.reduce((sum, val) => sum + val, 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Days Tracked:</span>
                <span className="font-semibold">{values.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Personal Health Tracking</h1>
      
      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveView('form')}
          className={`px-3 py-1 rounded-md ${
            activeView === 'form'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Data Entry
        </button>
        <button
          onClick={() => setActiveView('summary')}
          className={`px-3 py-1 rounded-md ${
            activeView === 'summary'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveView('heart-rate')}
          className={`px-3 py-1 rounded-md ${
            activeView === 'heart-rate'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Heart Rate
        </button>
        <button
          onClick={() => setActiveView('sleep')}
          className={`px-3 py-1 rounded-md ${
            activeView === 'sleep'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Sleep Quality
        </button>
        <button
          onClick={() => setActiveView('activity')}
          className={`px-3 py-1 rounded-md ${
            activeView === 'activity'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-800'
          }`}
        >
          Activity Tracking
        </button>
      </div>
      
      {renderView()}
    </div>
  );
};

export default UserHealthData;
