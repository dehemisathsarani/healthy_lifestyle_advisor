import { useState, useEffect } from 'react'
import { aiServicesAPI } from '../services/apiService'
import { dietAgentApi } from '../services/dietApi'

interface ServiceStatus {
  backend: boolean
  aiService: boolean
  message: string
}

interface HealthData {
  api_status: string
  uptime: string
  response_time_ms: number
  database: {
    status: string
    collections_count: number
  }
}

export const AIServicesStatus = () => {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [healthData, setHealthData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const checkServices = async () => {
    try {
      setLoading(true)
      
      // Get service status
      const status = await dietAgentApi.getServiceHealth()
      setServiceStatus(status)

      // Get detailed health data
      if (status.backend) {
        try {
          const health = await aiServicesAPI.checkBackendHealth()
          setHealthData(health)
        } catch {
          console.log('Backend health details unavailable')
        }
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Service check failed:', error)
      setServiceStatus({
        backend: false,
        aiService: false,
        message: 'Service check failed'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkServices()
    // Auto-refresh every 30 seconds
    const interval = setInterval(checkServices, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !serviceStatus) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Checking AI services...</span>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: boolean) => status ? 'text-green-600' : 'text-red-600'
  const getStatusIcon = (status: boolean) => status ? '✅' : '❌'
  const getStatusText = (status: boolean) => status ? 'Operational' : 'Unavailable'

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center">
          🧠 AI Services Status
        </h3>
        <button
          onClick={checkServices}
          disabled={loading}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? '🔄' : '🔄 Refresh'}
        </button>
      </div>

      {serviceStatus && (
        <div className="space-y-4">
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">Backend API</span>
                <div className="flex items-center">
                  <span className="mr-2">{getStatusIcon(serviceStatus.backend)}</span>
                  <span className={`font-semibold ${getStatusColor(serviceStatus.backend)}`}>
                    {getStatusText(serviceStatus.backend)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Port 8000</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-700">AI Service</span>
                <div className="flex items-center">
                  <span className="mr-2">{getStatusIcon(serviceStatus.aiService)}</span>
                  <span className={`font-semibold ${getStatusColor(serviceStatus.aiService)}`}>
                    {getStatusText(serviceStatus.aiService)}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Port 8001</p>
            </div>
          </div>

          {/* Health Details */}
          {healthData && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">System Health Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-semibold text-green-700">{healthData.api_status}</p>
                </div>
                <div>
                  <span className="text-gray-600">Uptime:</span>
                  <p className="font-semibold text-green-700">{healthData.uptime}</p>
                </div>
                <div>
                  <span className="text-gray-600">Response:</span>
                  <p className="font-semibold text-green-700">{healthData.response_time_ms}ms</p>
                </div>
                <div>
                  <span className="text-gray-600">Database:</span>
                  <p className="font-semibold text-green-700">{healthData.database.status}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className={`rounded-lg p-4 ${
            serviceStatus.backend && serviceStatus.aiService 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <p className={`font-medium ${
              serviceStatus.backend && serviceStatus.aiService 
                ? 'text-green-800' 
                : 'text-yellow-800'
            }`}>
              {serviceStatus.message}
            </p>
            {lastUpdated && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* Available Features */}
          {serviceStatus.backend && serviceStatus.aiService && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">🚀 Available AI Features</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">📊</span> BMI & TDEE Calculation
                </div>
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">🍽️</span> Meal Text Analysis
                </div>
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">📸</span> Food Image Analysis
                </div>
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">📋</span> Meal Plan Generation
                </div>
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">💾</span> MongoDB Storage
                </div>
                <div className="flex items-center text-blue-700">
                  <span className="mr-2">⚡</span> Real-time Processing
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
