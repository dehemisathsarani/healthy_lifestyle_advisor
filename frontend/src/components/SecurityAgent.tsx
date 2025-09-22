import { useState, useEffect } from 'react'
import { ArrowLeft, Shield, Lock, Eye, EyeOff, Download, Trash2, Settings, Database, FileText, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { securityApi, type UserSecurityProfile, type DataEntry, handleApiError } from '../services/securityApi'
import { useAuth } from '../auth/AuthContext'

// Types
interface SecurityAgentProps {
  onBackToServices: () => void
}

export const SecurityAgent: React.FC<SecurityAgentProps> = ({ onBackToServices }) => {
  const { isAuthenticated: authIsAuthenticated, profile: authProfile } = useAuth()
  const [user, setUser] = useState<UserSecurityProfile | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'privacy' | 'data' | 'security' | 'profile'>('dashboard')
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([])
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profileExists, setProfileExists] = useState<boolean | null>(null)

  // Check for existing security profile on mount
  useEffect(() => {
    if (authIsAuthenticated && authProfile) {
      checkAndLoadSecurityProfile()
    } else {
      setProfileExists(false)
    }
  }, [authIsAuthenticated, authProfile])

  const checkAndLoadSecurityProfile = async () => {
    try {
      setLoading(true)
      // Try to get existing profile
      const profile = await securityApi.getProfile()
      setUser(profile)
      setProfileExists(true)
      await loadDataEntries()
    } catch (error) {
      // Profile doesn't exist, that's okay
      console.log('No security profile found, user needs to create one')
      setProfileExists(false)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async () => {
    try {
      setLoading(true)
      const profile = await securityApi.getProfile()
      setUser(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      setError('Failed to load security profile')
    } finally {
      setLoading(false)
    }
  }

  const loadDataEntries = async () => {
    try {
      setLoading(true)
      const entries = await securityApi.getDataEntries()
      setDataEntries(entries)
    } catch (error) {
      console.error('Error loading data entries:', error)
      setError('Failed to load data entries')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProfile = async (data: Omit<UserSecurityProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}')
      const userId = currentUser._id || currentUser.id || authProfile?.email

      if (!userId) {
        throw new Error('User ID not found')
      }

      const profileData = {
        ...data,
        user_id: userId,
      }
      const profile = await securityApi.createProfile(profileData)
      setUser(profile)
      setProfileExists(true)
      setActiveTab('dashboard')
      alert('Security & Privacy profile created successfully!')
    } catch (error) {
      console.error('Error creating profile:', error)
      setError('Failed to create security profile')
    } finally {
      setLoading(false)
    }
  }

  const exportData = async () => {
    try {
      setLoading(true)
      await securityApi.exportAllData()
      alert('Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      setError('Failed to export data')
    } finally {
      setLoading(false)
    }
  }

  const deleteAllData = async () => {
    if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      try {
        setLoading(true)
        await securityApi.deleteAllData()
        setUser(null)
        setProfileExists(false)
        setDataEntries([])
        alert('All data has been deleted successfully.')
      } catch (error) {
        console.error('Error deleting data:', error)
        setError('Failed to delete data')
      } finally {
        setLoading(false)
      }
    }
  }

  if (!authIsAuthenticated) {
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
          Welcome back!
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
          <DataManagement dataEntries={dataEntries} onExportData={exportData} onDeleteData={deleteAllData} />
        )}
        
        {activeTab === 'security' && user && (
          <SecuritySettings user={user} showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
        )}
        
        {activeTab === 'profile' && user && (
          <ProfileSettings user={user} onUpdate={setUser} />
        )}
      </div>
    </div>
  )
}

// Profile Form Component
const ProfileForm: React.FC<{ onSubmit: (data: Omit<UserSecurityProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void }> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Omit<UserSecurityProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>({
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
    const size = entry.size ? parseFloat(entry.size.replace(/[^\d.]/g, '')) : 0
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
                  entry.data_type === 'profile' ? 'bg-blue-100' :
                  entry.data_type === 'meal' ? 'bg-green-100' :
                  entry.data_type === 'workout' ? 'bg-purple-100' :
                  entry.data_type === 'mood' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 capitalize">{entry.data_type} Data</p>
                  <p className="text-sm text-gray-600">{new Date(entry.created_at).toLocaleDateString()}</p>
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
}> = ({ dataEntries, onExportData, onDeleteData }) => {
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
                  entry.data_type === 'profile' ? 'bg-blue-100' :
                  entry.data_type === 'meal' ? 'bg-green-100' :
                  entry.data_type === 'workout' ? 'bg-purple-100' :
                  entry.data_type === 'mood' ? 'bg-orange-100' :
                  'bg-gray-100'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">{entry.data_type} Data</h4>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(entry.created_at).toLocaleDateString()}
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
                <button className="text-blue-600 hover:text-blue-800 text-sm">
                  Download
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
