import { useState, useEffect } from 'react'
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Download, Trash2, Settings, Database, FileText } from 'lucide-react'

// Types
interface UserSecurityProfile {
  id?: string
  name: string
  email: string
  privacy_level: 'basic' | 'standard' | 'strict'
  data_sharing: {
    analytics: boolean
    marketing: boolean
    research: boolean
    third_party: boolean
  }
  backup_preferences: {
    frequency: 'daily' | 'weekly' | 'monthly'
    location: 'cloud' | 'local' | 'both'
    encryption: boolean
  }
  notification_preferences: {
    security_alerts: boolean
    privacy_updates: boolean
    data_reports: boolean
  }
}

interface DataEntry {
  id: string
  type: 'profile' | 'meal' | 'workout' | 'mood' | 'health'
  timestamp: string
  size: string
  encrypted: boolean
}

interface SecurityAgentProps {
  onBackToServices: () => void
}

export const SecurityAgent: React.FC<SecurityAgentProps> = ({ onBackToServices }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<UserSecurityProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'privacy' | 'data' | 'security' | 'profile'>('dashboard')
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([])
  const [showPassword, setShowPassword] = useState(false)
  
  // OTP states for encrypted file download
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [downloadingFile, setDownloadingFile] = useState<DataEntry | null>(null)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  // Check for existing user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('securityAgentUser')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        setIsAuthenticated(true)
        loadDataEntries()
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('securityAgentUser')
      }
    }
  }, [])

  const loadDataEntries = () => {
    // Mock data entries
    const mockEntries: DataEntry[] = [
      {
        id: '1',
        type: 'profile',
        timestamp: new Date().toISOString(),
        size: '2.3 KB',
        encrypted: true
      },
      {
        id: '2',
        type: 'meal',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        size: '15.2 KB',
        encrypted: true
      },
      {
        id: '3',
        type: 'workout',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        size: '8.7 KB',
        encrypted: true
      }
    ]
    setDataEntries(mockEntries)
  }

  const handleCreateProfile = (data: UserSecurityProfile) => {
    const profileWithId = {
      ...data,
      id: Date.now().toString()
    }
    
    setUser(profileWithId)
    setIsAuthenticated(true)
    localStorage.setItem('securityAgentUser', JSON.stringify(profileWithId))
    setActiveTab('dashboard')
    
    alert('Security & Privacy profile created successfully!')
  }

  const exportData = () => {
    const allData = {
      profile: user,
      dataEntries,
      exportDate: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(allData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `health-data-export-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    alert('Data exported successfully!')
  }

  const deleteAllData = () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      localStorage.removeItem('securityAgentUser')
      localStorage.removeItem('dietAgentUser')
      localStorage.removeItem('fitnessAgentUser')
      localStorage.removeItem('mentalHealthAgentUser')
      localStorage.removeItem('dietAgentHistory')
      localStorage.removeItem('fitnessAgentWorkouts')
      localStorage.removeItem('mentalHealthMoodEntries')
      
      setUser(null)
      setIsAuthenticated(false)
      setDataEntries([])
      
      alert('All data has been deleted successfully.')
    }
  }

  // OTP functions for encrypted file download
  const handleDownloadEncryptedFile = async (entry: DataEntry) => {
    if (!entry.encrypted) {
      // Direct download for non-encrypted files
      downloadFile(entry)
      return
    }

    // For encrypted files, request OTP first
    setDownloadingFile(entry)
    setOtpError('')
    setOtpLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/security/request-decrypt-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier: user?.email,
          file_id: entry.id,
          file_type: entry.type
        })
      })

      const data = await response.json()
      
      if (data.success || data.action === 'new_otp_sent') {
        setShowOtpModal(true)
        alert(`OTP sent to ${user?.email} for decrypting ${entry.type} file`)
      } else {
        setOtpError(data.message || 'Failed to request OTP')
      }
    } catch (error) {
      console.error('Error requesting decrypt OTP:', error)
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtpAndDownload = async () => {
    if (!otpCode.trim() || !downloadingFile) return

    setOtpLoading(true)
    setOtpError('')

    try {
      const response = await fetch('http://localhost:8000/api/security/verify-decrypt-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: user?.email,
          otp_code: otpCode,
          file_id: downloadingFile.id
        })
      })

      const data = await response.json()
      
      if (data.success && data.data?.access_granted) {
        // OTP verified, proceed with download
        setShowOtpModal(false)
        setOtpCode('')
        downloadFile(downloadingFile)
        alert('Access granted! File download started.')
      } else {
        if (data.action === 'new_otp_sent') {
          setOtpError('New OTP sent to your email. Please check and enter the new code.')
        } else {
          setOtpError(data.message || 'Invalid OTP. Please try again.')
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      setOtpError('Network error. Please try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  const downloadFile = (entry: DataEntry) => {
    // Mock file download - in real app this would download the actual file
    const fileData = {
      id: entry.id,
      type: entry.type,
      timestamp: entry.timestamp,
      size: entry.size,
      encrypted: entry.encrypted,
      downloadDate: new Date().toISOString(),
      content: `Mock ${entry.type} data content for file ${entry.id}`
    }
    
    const dataStr = JSON.stringify(fileData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${entry.type}-data-${entry.id}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const closeOtpModal = () => {
    setShowOtpModal(false)
    setDownloadingFile(null)
    setOtpCode('')
    setOtpError('')
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBackToServices}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-semibold text-gray-900">Security & Data Personalization</h1>
          </div>
        </div>

        {/* Profile Creation Form */}
        <ProfileForm onSubmit={handleCreateProfile} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBackToServices}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-brand transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Services
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <h1 className="text-xl font-semibold text-gray-900">Security & Data Personalization</h1>
        </div>
        <div className="text-sm text-gray-500">
          Welcome back, {user?.name}!
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Shield },
            { id: 'privacy', label: 'Privacy', icon: Eye },
            { id: 'data', label: 'Data Management', icon: Database },
            { id: 'security', label: 'Security', icon: Lock },
            { id: 'profile', label: 'Profile', icon: Settings }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'dashboard' | 'privacy' | 'data' | 'security' | 'profile')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'dashboard' && user && (
          <Dashboard user={user} dataEntries={dataEntries} onExportData={exportData} onDeleteData={deleteAllData} />
        )}
        
        {activeTab === 'privacy' && user && (
          <PrivacySettings user={user} onUpdate={setUser} />
        )}
        
        {activeTab === 'data' && (
          <DataManagement 
            dataEntries={dataEntries} 
            onExportData={exportData} 
            onDeleteData={deleteAllData}
            onDownloadFile={handleDownloadEncryptedFile}
          />
        )}
        
        {activeTab === 'security' && user && (
          <SecuritySettings user={user} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
        )}
        
        {activeTab === 'profile' && user && (
          <ProfileSettings user={user} onUpdate={setUser} />
        )}
      </div>

      {/* OTP Modal for Encrypted File Download */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🔐 Verify Access for Encrypted File
            </h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                File: <span className="font-medium capitalize">{downloadingFile?.type} Data</span>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                An OTP has been sent to <span className="font-medium">{user?.email}</span>
              </p>
              
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
                maxLength={6}
              />
              
              {otpError && (
                <p className="text-sm text-red-600 mt-2">{otpError}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeOtpModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={otpLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOtpAndDownload}
                className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors disabled:opacity-50"
                disabled={otpLoading || !otpCode.trim()}
              >
                {otpLoading ? 'Verifying...' : 'Verify & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Profile Form Component
const ProfileForm: React.FC<{ onSubmit: (data: UserSecurityProfile) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<UserSecurityProfile>({
    name: '',
    email: '',
    privacy_level: 'standard',
    data_sharing: {
      analytics: false,
      marketing: false,
      research: false,
      third_party: false
    },
    backup_preferences: {
      frequency: 'weekly',
      location: 'cloud',
      encryption: true
    },
    notification_preferences: {
      security_alerts: true,
      privacy_updates: true,
      data_reports: false
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Your Security & Privacy Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Privacy Level</label>
          <select
            value={formData.privacy_level}
            onChange={(e) => setFormData({ ...formData, privacy_level: e.target.value as 'basic' | 'standard' | 'strict' })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="basic">Basic - Essential privacy protection</option>
            <option value="standard">Standard - Balanced privacy and functionality</option>
            <option value="strict">Strict - Maximum privacy protection</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Data Sharing Preferences</label>
          <div className="space-y-3">
            {[
              { key: 'analytics', label: 'Analytics - Help improve the app' },
              { key: 'marketing', label: 'Marketing - Receive product updates' },
              { key: 'research', label: 'Research - Contribute to health research' },
              { key: 'third_party', label: 'Third Party - Share with partners' }
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.data_sharing[key as keyof typeof formData.data_sharing]}
                  onChange={(e) => setFormData({
                    ...formData,
                    data_sharing: {
                      ...formData.data_sharing,
                      [key]: e.target.checked
                    }
                  })}
                  className="mr-3"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Backup Preferences</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Frequency</label>
              <select
                value={formData.backup_preferences.frequency}
                onChange={(e) => setFormData({
                  ...formData,
                  backup_preferences: {
                    ...formData.backup_preferences,
                    frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Location</label>
              <select
                value={formData.backup_preferences.location}
                onChange={(e) => setFormData({
                  ...formData,
                  backup_preferences: {
                    ...formData.backup_preferences,
                    location: e.target.value as 'cloud' | 'local' | 'both'
                  }
                })}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="cloud">Cloud</option>
                <option value="local">Local</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.backup_preferences.encryption}
                  onChange={(e) => setFormData({
                    ...formData,
                    backup_preferences: {
                      ...formData.backup_preferences,
                      encryption: e.target.checked
                    }
                  })}
                  className="mr-2"
                />
                <span className="text-sm">Encryption</span>
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand hover:bg-brand-dark text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Create Security Profile
        </button>
      </form>
    </div>
  )
}

// Dashboard Component
const Dashboard: React.FC<{ 
  user: UserSecurityProfile
  dataEntries: DataEntry[]
  onExportData: () => void
  onDeleteData: () => void
}> = ({ user, dataEntries, onExportData, onDeleteData }) => {
  const totalDataSize = dataEntries.reduce((total, entry) => {
    const size = parseFloat(entry.size.replace(/[^\d.]/g, ''))
    return total + size
  }, 0)

  const encryptedEntries = dataEntries.filter(entry => entry.encrypted).length
  const encryptionPercentage = dataEntries.length > 0 ? (encryptedEntries / dataEntries.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security Score</h3>
            <p className="text-sm text-gray-600">Your privacy and security rating</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">85/100</div>
            <div className="text-sm text-green-600">Good Security</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Stored</p>
              <p className="text-2xl font-bold text-gray-900">{totalDataSize.toFixed(1)} KB</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Encryption</p>
              <p className="text-2xl font-bold text-gray-900">{encryptionPercentage.toFixed(0)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Privacy Level</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{user.privacy_level}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Data Entries</p>
              <p className="text-2xl font-bold text-gray-900">{dataEntries.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={onExportData}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export All Data
          </button>
          
          <button
            onClick={onDeleteData}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete All Data
          </button>
        </div>
      </div>

      {/* Privacy Settings Overview */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings Overview</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-800">Data Analytics</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.data_sharing.analytics ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.data_sharing.analytics ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-800">Marketing Communications</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.data_sharing.marketing ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.data_sharing.marketing ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-800">Research Participation</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              user.data_sharing.research ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {user.data_sharing.research ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Data Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Data Activity</h3>
        <div className="space-y-3">
          {dataEntries.slice(0, 5).map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  entry.type === 'profile' ? 'bg-blue-100' :
                  entry.type === 'meal' ? 'bg-green-100' :
                  entry.type === 'workout' ? 'bg-purple-100' :
                  entry.type === 'mood' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{entry.type} Data</p>
                  <p className="text-sm text-gray-600">{new Date(entry.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">{entry.size}</span>
                {entry.encrypted && <Shield className="w-4 h-4 text-green-600" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Privacy Settings Component
const PrivacySettings: React.FC<{
  user: UserSecurityProfile
  onUpdate: (user: UserSecurityProfile) => void
}> = ({ user, onUpdate }) => {
  const handleToggleSharing = (key: keyof typeof user.data_sharing) => {
    const updatedUser = {
      ...user,
      data_sharing: {
        ...user.data_sharing,
        [key]: !user.data_sharing[key]
      }
    }
    onUpdate(updatedUser)
    localStorage.setItem('securityAgentUser', JSON.stringify(updatedUser))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Privacy Settings</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing Preferences</h3>
        <div className="space-y-4">
          {[
            { key: 'analytics', label: 'Analytics Data', description: 'Help us improve the app by sharing anonymous usage data' },
            { key: 'marketing', label: 'Marketing Communications', description: 'Receive personalized health tips and product updates' },
            { key: 'research', label: 'Health Research', description: 'Contribute anonymized data to health and wellness research' },
            { key: 'third_party', label: 'Third-Party Integration', description: 'Allow integration with compatible health apps and devices' }
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
              <button
                onClick={() => handleToggleSharing(key as keyof typeof user.data_sharing)}
                className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  user.data_sharing[key as keyof typeof user.data_sharing] ? 'bg-brand' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    user.data_sharing[key as keyof typeof user.data_sharing] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Level</h3>
        <div className="space-y-3">
          {[
            { value: 'basic', label: 'Basic', description: 'Essential privacy protection with standard features' },
            { value: 'standard', label: 'Standard', description: 'Balanced privacy and functionality for most users' },
            { value: 'strict', label: 'Strict', description: 'Maximum privacy protection with limited data sharing' }
          ].map(({ value, label, description }) => (
            <label key={value} className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer">
              <input
                type="radio"
                name="privacy_level"
                value={value}
                checked={user.privacy_level === value}
                onChange={(e) => {
                  const updatedUser = { ...user, privacy_level: e.target.value as 'basic' | 'standard' | 'strict' }
                  onUpdate(updatedUser)
                  localStorage.setItem('securityAgentUser', JSON.stringify(updatedUser))
                }}
                className="mr-3"
              />
              <div>
                <h4 className="font-medium text-gray-900">{label}</h4>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

// Data Management Component
const DataManagement: React.FC<{
  dataEntries: DataEntry[]
  onExportData: () => void
  onDeleteData: () => void
  onDownloadFile: (entry: DataEntry) => void
}> = ({ dataEntries, onExportData, onDeleteData, onDownloadFile }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Delete Data</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={onExportData}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export All Data
          </button>
          
          <button
            onClick={onDeleteData}
            className="flex items-center justify-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Delete All Data
          </button>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-2">GDPR Rights</h4>
          <p className="text-sm text-gray-600">
            You have the right to access, rectify, erase, and port your personal data. 
            You can also object to processing and request restriction of processing.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Data</h3>
        <div className="space-y-3">
          {dataEntries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  entry.type === 'profile' ? 'bg-blue-100' :
                  entry.type === 'meal' ? 'bg-green-100' :
                  entry.type === 'workout' ? 'bg-purple-100' :
                  entry.type === 'mood' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">{entry.type} Data</h4>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">{entry.size}</span>
                {entry.encrypted && (
                  <div className="flex items-center text-green-600">
                    <Shield className="w-4 h-4 mr-1" />
                    <span className="text-xs">Encrypted</span>
                  </div>
                )}
                <button 
                  onClick={() => onDownloadFile(entry)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {entry.encrypted ? '🔐 Download' : 'Download'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Security Settings Component
const SecuritySettings: React.FC<{
  user: UserSecurityProfile
  showPassword: boolean
  onTogglePassword: () => void
}> = ({ user, showPassword, onTogglePassword }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Current Password</h4>
              <p className="text-sm text-gray-600">
                {showPassword ? '••••••••••••' : '••••••••••••'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={onTogglePassword}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button className="px-3 py-1 bg-brand hover:bg-brand-dark text-white text-sm rounded-lg transition-colors">
                Change
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
              Enable
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup & Encryption</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Data Encryption</h4>
              <p className="text-sm text-gray-600">All your data is encrypted using AES-256</p>
            </div>
            <div className="flex items-center text-green-600">
              <Shield className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">Enabled</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Backup Frequency</h4>
              <p className="text-sm text-gray-600 capitalize">{user.backup_preferences.frequency} backups</p>
            </div>
            <button className="px-3 py-1 bg-brand hover:bg-brand-dark text-white text-sm rounded-lg transition-colors">
              Configure
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Backup Location</h4>
              <p className="text-sm text-gray-600 capitalize">{user.backup_preferences.location} storage</p>
            </div>
            <button className="px-3 py-1 bg-brand hover:bg-brand-dark text-white text-sm rounded-lg transition-colors">
              Change
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Monitoring</h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-green-50 rounded-lg">
            <Shield className="w-5 h-5 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-green-800">No security threats detected</p>
              <p className="text-sm text-green-600">Last scan: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Profile Settings Component
const ProfileSettings: React.FC<{
  user: UserSecurityProfile
  onUpdate: (user: UserSecurityProfile) => void
}> = ({ user, onUpdate }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-gray-900">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Privacy Level</label>
              <p className="text-gray-900 capitalize">{user.privacy_level}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
              <p className="text-gray-900 capitalize">{user.backup_preferences.frequency}</p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notification Preferences</label>
            <div className="space-y-2">
              {[
                { key: 'security_alerts', label: 'Security Alerts' },
                { key: 'privacy_updates', label: 'Privacy Updates' },
                { key: 'data_reports', label: 'Data Reports' }
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={user.notification_preferences[key as keyof typeof user.notification_preferences]}
                    onChange={(e) => {
                      const updatedUser = {
                        ...user,
                        notification_preferences: {
                          ...user.notification_preferences,
                          [key]: e.target.checked
                        }
                      }
                      onUpdate(updatedUser)
                      localStorage.setItem('securityAgentUser', JSON.stringify(updatedUser))
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}
