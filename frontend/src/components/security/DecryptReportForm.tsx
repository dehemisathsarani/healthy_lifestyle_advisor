import React, { useState } from 'react';
import axios from 'axios';
import { Unlock, Key, Copy, Download, AlertCircle, CheckCircle, RefreshCw, Lock, Mail } from 'lucide-react';

interface Props {
  encryptedReport: string;
  decryptionToken: string;
  userId: string;
  userEmail: string;
  onBack: () => void;
}

const DecryptReportForm: React.FC<Props> = ({
  encryptedReport,
  decryptionToken,
  userId,
  userEmail,
  onBack
}) => {
  // Step 3: Decrypt OTP states
  const [decryptOtpSent, setDecryptOtpSent] = useState(false);
  const [decryptOtp, setDecryptOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [decrypted, setDecrypted] = useState(false);
  
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // Step 3.1: Request Decrypt OTP (Third OTP)
  const handleRequestDecryptOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Step 3: Requesting decrypt OTP for:', userEmail);
      const response = await axios.post('/api/security/three-step/request-decrypt-access', {
        identifier: userEmail
      });

      console.log('✅ Decrypt OTP Response:', response.data);

      if (response.data.success) {
        setDecryptOtpSent(true);
        setSuccess(`📧 Third OTP sent to ${userEmail}! Check your email to unlock the report (valid for 20 minutes).`);
      } else {
        setError(response.data.message || 'Failed to send decryption OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Decrypt OTP Error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send decryption OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3.2: Verify Decrypt OTP and Decrypt Report
  const handleVerifyDecryptOtp = async () => {
    if (!decryptOtp.trim()) {
      setError('Please enter the decryption OTP code');
      return;
    }

    // Basic OTP validation (should be 6 digits)
    if (!/^\d{6}$/.test(decryptOtp.trim())) {
      setError('OTP must be a 6-digit number');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Step 3: Verifying decrypt OTP and unlocking report...');
      const response = await axios.post('/api/security/three-step/verify-decrypt-access', {
        identifier: userEmail,
        otp_code: decryptOtp.trim(),
        report_type: 'all'  // This will be replaced with actual report type from encrypted data
      });

      console.log('✅ Decrypt verification response:', response.data);

      if (response.data.success) {
        setDecrypted(true);
        
        // Get real health data from response
        const realHealthReport = response.data.data?.decrypted_report;
        
        if (realHealthReport && realHealthReport.data_source === "REAL_DATABASE_COLLECTIONS") {
          setDecryptedData(realHealthReport);
          setSuccess('🎉 Report decrypted successfully! This is your REAL health data from the cloud database.');
        } else if (realHealthReport && realHealthReport.data_source === "DEMO_DATA_USER_NOT_FOUND") {
          setDecryptedData(realHealthReport);
          setSuccess('📊 Report decrypted successfully! No existing data found - start tracking to see your real health insights.');
        } else {
          // Fallback
          setDecryptedData(realHealthReport || { message: 'Report decrypted', timestamp: new Date().toISOString() });
          setSuccess('✅ Report decrypted successfully! You can now view your health data.');
        }
      } else {
        setError(response.data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Decrypt verification error:', err);
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('🔄 New decryption OTP has been sent to your email. Please check and enter the new code.');
        setDecryptOtp(''); // Clear the input
      } else {
        setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid OTP code. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const downloadDecryptedData = () => {
    // Create PDF content
    let pdfContent = `
╔════════════════════════════════════════════════════════════════╗
║                    HEALTH REPORT - SECURE                      ║
║              Data & Security Agent Report System               ║
╚════════════════════════════════════════════════════════════════╝

Report ID: ${decryptedData?.report_id || 'N/A'}
Generated At: ${new Date(decryptedData?.generated_at || Date.now()).toLocaleString()}
User Email: ${userEmail}
Data Source: ${decryptedData?.data_source || 'N/A'}

════════════════════════════════════════════════════════════════

📊 DIET & NUTRITION DATA
────────────────────────────────────────────────────────────────
Total Meals: ${decryptedData?.report_content?.diet_data?.total_meals || 0}
Total Nutrition Entries: ${decryptedData?.report_content?.diet_data?.nutrition_entries_count || 0}
Meal Analyses Count: ${decryptedData?.report_content?.diet_data?.meal_analyses_count || 0}
Daily Summaries: ${decryptedData?.report_content?.diet_data?.daily_summaries_count || 0}
Total Calories: ${decryptedData?.report_content?.diet_data?.total_calories || 0}
Average Calories per Day: ${decryptedData?.report_content?.diet_data?.avg_calories_per_day || 0}
Total Carbs: ${decryptedData?.report_content?.diet_data?.total_carbs || 0} g
Total Protein: ${decryptedData?.report_content?.diet_data?.total_protein || 0} g
Total Fat: ${decryptedData?.report_content?.diet_data?.total_fat || 0} g
Nutrition Score: ${decryptedData?.report_content?.diet_data?.nutrition_score || 0}%
Data Period: ${decryptedData?.report_content?.diet_data?.data_period_days || 0} days
Last Meal Date: ${decryptedData?.report_content?.diet_data?.last_meal_date || 'N/A'}

════════════════════════════════════════════════════════════════

💪 FITNESS & EXERCISE DATA
────────────────────────────────────────────────────────────────
Total Workouts: ${decryptedData?.report_content?.fitness_data?.total_workouts || 0}
Workout Plans Count: ${decryptedData?.report_content?.fitness_data?.workout_plans_count || 0}
Exercise Logs Count: ${decryptedData?.report_content?.fitness_data?.exercise_logs_count || 0}
Total Duration: ${decryptedData?.report_content?.fitness_data?.total_duration_minutes || 0} minutes
Average Duration: ${decryptedData?.report_content?.fitness_data?.avg_duration || '0 min'}
Total Calories Burned: ${decryptedData?.report_content?.fitness_data?.total_calories_burned || 0}
Fitness Score: ${decryptedData?.report_content?.fitness_data?.fitness_score || 0}%
Data Period: ${decryptedData?.report_content?.fitness_data?.data_period_days || 0} days
Last Workout Date: ${decryptedData?.report_content?.fitness_data?.last_workout_date || 'N/A'}

Top Workout Types:
${decryptedData?.report_content?.fitness_data?.workout_types?.map((type: any) => 
  `  • ${type.type}: ${type.count} sessions`).join('\n') || '  No workout data available'}

════════════════════════════════════════════════════════════════

🧠 MENTAL HEALTH & WELLNESS DATA
────────────────────────────────────────────────────────────────
Mood Entries: ${decryptedData?.report_content?.mental_health_data?.mood_entries_count || 0}
Journal Entries: ${decryptedData?.report_content?.mental_health_data?.journal_entries_count || 0}
Average Mood Score: ${decryptedData?.report_content?.mental_health_data?.avg_mood_score || 0}/10
Average Stress Level: ${decryptedData?.report_content?.mental_health_data?.avg_stress_level || 0}/10
Average Energy Level: ${decryptedData?.report_content?.mental_health_data?.avg_energy_level || 0}/10
Wellness Score: ${decryptedData?.report_content?.mental_health_data?.wellness_score || 0}%
Data Period: ${decryptedData?.report_content?.mental_health_data?.data_period_days || 0} days
Last Entry Date: ${decryptedData?.report_content?.mental_health_data?.last_entry_date || 'N/A'}

Mood Distribution:
${decryptedData?.report_content?.mental_health_data?.mood_distribution?.map((mood: any) => 
  `  • ${mood.mood}: ${mood.count} times (${mood.percentage}%)`).join('\n') || '  No mood data available'}

════════════════════════════════════════════════════════════════

📋 REPORT SUMMARY
────────────────────────────────────────────────────────────────
Overall Health Score: ${(
  ((decryptedData?.report_content?.diet_data?.nutrition_score || 0) +
  (decryptedData?.report_content?.fitness_data?.fitness_score || 0) +
  (decryptedData?.report_content?.mental_health_data?.wellness_score || 0)) / 3
).toFixed(1)}%

Report Type: ${decryptedData?.report_type || 'All Health Data'}
Encryption: Fernet Symmetric Encryption
Security Level: Three-Step OTP Verification

════════════════════════════════════════════════════════════════

🔐 SECURITY INFORMATION
────────────────────────────────────────────────────────────────
This report was accessed through a secure three-step OTP verification:
  ✓ Step 1: Email Verification (10 min validity)
  ✓ Step 2: Download Access Verification (15 min validity)
  ✓ Step 3: Decryption Access Verification (20 min validity)

All data is encrypted using Fernet symmetric encryption.
Your privacy and security are our top priorities.

════════════════════════════════════════════════════════════════

© ${new Date().getFullYear()} Healthy Lifestyle Advisor - Data & Security Agent
Generated: ${new Date().toLocaleString()}

════════════════════════════════════════════════════════════════
`;

    // Create blob and download as PDF (text-based PDF)
    const dataBlob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <Lock size={32} className="text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Decrypt Your Report</h2>
          <p className="text-sm text-gray-600">Step 3 of 3: Use your decryption token or user ID to view your health data</p>
        </div>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between mb-8 px-4">
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mb-2">
            <CheckCircle size={20} />
          </div>
          <div className="text-xs font-medium text-green-600">Email Verified</div>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center font-bold mb-2">
            <CheckCircle size={20} />
          </div>
          <div className="text-xs font-medium text-green-600">Report Generated</div>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">3</div>
          <div className="text-xs text-blue-600 font-medium">Decryption</div>
        </div>
      </div>

      {!decryptedData ? (
        <div className="space-y-6">
          {/* Email Information */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
            <p className="text-sm"><strong className="text-gray-700">� Email:</strong> <span className="text-gray-900">{userEmail}</span></p>
            <p className="text-sm mt-2"><strong className="text-gray-700">🔐 Status:</strong> <span className="text-gray-900">Report generated and ready for decryption</span></p>
            <p className="text-xs text-gray-600 mt-3">
              ✅ Step 1: Email Verified<br />
              ✅ Step 2: Report Generated<br />
              🔄 Step 3: Request decryption OTP to unlock your report
            </p>
          </div>

          {/* Request Decrypt OTP Button */}
          {!decryptOtpSent && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-6 text-center">
              <Mail size={48} className="mx-auto text-amber-600 mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Final Decryption Code</h3>
              <p className="text-sm text-gray-600 mb-4">
                Click below to receive the third OTP to unlock and view your health report
              </p>
              <button
                onClick={handleRequestDecryptOtp}
                disabled={loading}
                className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
              >
                {loading ? (
                  <><span className="animate-spin">⏳</span><span>Sending OTP...</span></>
                ) : (
                  <><Mail size={18} /><span>Request Decryption OTP</span></>
                )}
              </button>
            </div>
          )}

          {/* Third OTP Input - Shows after requesting decrypt access */}
          {decryptOtpSent && !decrypted && (
            <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📧 Third OTP - Decryption Access Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={decryptOtp}
                  onChange={(e) => setDecryptOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP from email"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  maxLength={6}
                  disabled={verifying}
                />
                <button
                  type="button"
                  onClick={handleVerifyDecryptOtp}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={verifying || !decryptOtp.trim()}
                >
                  {verifying ? '🔄 Decrypting...' : '🔓 Unlock Report'}
                </button>
              </div>
              <small className="text-gray-600 text-xs mt-2 block">
                📧 Check your email for the decryption access code (valid for 20 minutes)
              </small>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              <CheckCircle size={16} />
              <span className="text-sm">{success}</span>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            <CheckCircle size={20} />
            <span className="font-medium">Report decrypted successfully!</span>
          </div>

          {/* PDF-Style Formatted Health Report Display */}
          <div className="border-2 border-gray-800 rounded-lg shadow-2xl overflow-hidden bg-white">
            {/* Report Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">🏥 HEALTH REPORT</h1>
                <p className="text-sm opacity-90">Secure Health Report Access System</p>
                <div className="mt-4 pt-4 border-t border-blue-400">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-left">
                      <p className="opacity-75">Report ID:</p>
                      <p className="font-mono text-xs">{decryptedData?.report_id || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="opacity-75">Generated:</p>
                      <p className="text-xs">{new Date(decryptedData?.generated_at || Date.now()).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <p className="opacity-75 text-xs">Email:</p>
                    <p className="font-semibold">{userEmail}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto bg-gray-50">
              
              {/* Diet & Nutrition Section */}
              <div className="bg-white rounded-lg border-2 border-green-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 pb-3 border-b-2 border-green-200">
                  <span className="text-2xl">🍎</span>
                  <h2 className="text-lg font-bold text-green-700">DIET & NUTRITION DATA</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Total Meals:</strong> {decryptedData?.report_content?.diet_data?.total_meals || 0}</p>
                    <p><strong>Nutrition Entries:</strong> {decryptedData?.report_content?.diet_data?.nutrition_entries_count || 0}</p>
                    <p><strong>Meal Analyses:</strong> {decryptedData?.report_content?.diet_data?.meal_analyses_count || 0}</p>
                    <p><strong>Daily Summaries:</strong> {decryptedData?.report_content?.diet_data?.daily_summaries_count || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Total Calories:</strong> {decryptedData?.report_content?.diet_data?.total_calories || 0}</p>
                    <p><strong>Avg Calories/Day:</strong> {decryptedData?.report_content?.diet_data?.avg_calories_per_day || 0}</p>
                    <p><strong>Total Carbs:</strong> {decryptedData?.report_content?.diet_data?.total_carbs || 0}g</p>
                    <p><strong>Total Protein:</strong> {decryptedData?.report_content?.diet_data?.total_protein || 0}g</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-700">Nutrition Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-green-600" 
                          style={{width: `${decryptedData?.report_content?.diet_data?.nutrition_score || 0}%`}}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">{decryptedData?.report_content?.diet_data?.nutrition_score || 0}%</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <strong>Data Period:</strong> {decryptedData?.report_content?.diet_data?.data_period_days || 0} days
                    {decryptedData?.report_content?.diet_data?.last_meal_date && 
                      ` | Last Meal: ${decryptedData.report_content.diet_data.last_meal_date}`
                    }
                  </p>
                </div>
              </div>

              {/* Fitness & Exercise Section */}
              <div className="bg-white rounded-lg border-2 border-orange-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 pb-3 border-b-2 border-orange-200">
                  <span className="text-2xl">💪</span>
                  <h2 className="text-lg font-bold text-orange-700">FITNESS & EXERCISE DATA</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Total Workouts:</strong> {decryptedData?.report_content?.fitness_data?.total_workouts || 0}</p>
                    <p><strong>Workout Plans:</strong> {decryptedData?.report_content?.fitness_data?.workout_plans_count || 0}</p>
                    <p><strong>Exercise Logs:</strong> {decryptedData?.report_content?.fitness_data?.exercise_logs_count || 0}</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Total Duration:</strong> {decryptedData?.report_content?.fitness_data?.total_duration_minutes || 0} min</p>
                    <p><strong>Avg Duration:</strong> {decryptedData?.report_content?.fitness_data?.avg_duration || '0 min'}</p>
                    <p><strong>Calories Burned:</strong> {decryptedData?.report_content?.fitness_data?.total_calories_burned || 0}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-orange-700">Fitness Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-600" 
                          style={{width: `${decryptedData?.report_content?.fitness_data?.fitness_score || 0}%`}}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">{decryptedData?.report_content?.fitness_data?.fitness_score || 0}%</span>
                    </div>
                  </div>
                  {decryptedData?.report_content?.fitness_data?.workout_types && 
                    decryptedData.report_content.fitness_data.workout_types.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Top Workout Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {decryptedData.report_content.fitness_data.workout_types.slice(0, 3).map((type: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                            {type.type}: {type.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mental Health Section */}
              <div className="bg-white rounded-lg border-2 border-purple-200 p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 pb-3 border-b-2 border-purple-200">
                  <span className="text-2xl">🧠</span>
                  <h2 className="text-lg font-bold text-purple-700">MENTAL HEALTH & WELLNESS</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <p><strong>Mood Entries:</strong> {decryptedData?.report_content?.mental_health_data?.mood_entries_count || 0}</p>
                    <p><strong>Journal Entries:</strong> {decryptedData?.report_content?.mental_health_data?.journal_entries_count || 0}</p>
                    <p><strong>Avg Mood Score:</strong> {decryptedData?.report_content?.mental_health_data?.avg_mood_score || 0}/10</p>
                  </div>
                  <div className="space-y-2">
                    <p><strong>Avg Stress Level:</strong> {decryptedData?.report_content?.mental_health_data?.avg_stress_level || 0}/10</p>
                    <p><strong>Avg Energy Level:</strong> {decryptedData?.report_content?.mental_health_data?.avg_energy_level || 0}/10</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-purple-700">Wellness Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-purple-600" 
                          style={{width: `${decryptedData?.report_content?.mental_health_data?.wellness_score || 0}%`}}
                        ></div>
                      </div>
                      <span className="font-bold text-lg">{decryptedData?.report_content?.mental_health_data?.wellness_score || 0}%</span>
                    </div>
                  </div>
                  {decryptedData?.report_content?.mental_health_data?.mood_distribution && 
                    decryptedData.report_content.mental_health_data.mood_distribution.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Mood Distribution:</p>
                      <div className="flex flex-wrap gap-2">
                        {decryptedData.report_content.mental_health_data.mood_distribution.slice(0, 4).map((mood: any, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                            {mood.mood}: {mood.count} ({mood.percentage}%)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Overall Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-300 p-5 shadow-sm">
                <div className="flex items-center space-x-2 mb-4 pb-3 border-b-2 border-blue-300">
                  <span className="text-2xl">📊</span>
                  <h2 className="text-lg font-bold text-blue-800">OVERALL HEALTH SUMMARY</h2>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">Overall Health Score</p>
                    <div className="relative inline-block">
                      <svg className="w-32 h-32">
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                        />
                        <circle
                          cx="64"
                          cy="64"
                          r="56"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="8"
                          strokeDasharray={`${((
                            ((decryptedData?.report_content?.diet_data?.nutrition_score || 0) +
                            (decryptedData?.report_content?.fitness_data?.fitness_score || 0) +
                            (decryptedData?.report_content?.mental_health_data?.wellness_score || 0)) / 3
                          ) / 100) * 351.86} 351.86`}
                          strokeLinecap="round"
                          transform="rotate(-90 64 64)"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-3xl font-bold text-blue-700">
                          {((
                            (decryptedData?.report_content?.diet_data?.nutrition_score || 0) +
                            (decryptedData?.report_content?.fitness_data?.fitness_score || 0) +
                            (decryptedData?.report_content?.mental_health_data?.wellness_score || 0)
                          ) / 3).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center text-xs text-gray-600">
                  <p><strong>Report Type:</strong> {decryptedData?.report_type || 'All Health Data'}</p>
                  <p className="mt-1"><strong>Data Source:</strong> {decryptedData?.data_source || 'N/A'}</p>
                </div>
              </div>

              {/* Security Footer */}
              <div className="bg-gray-100 rounded-lg border border-gray-300 p-4">
                <div className="flex items-start space-x-2">
                  <span className="text-xl">🔐</span>
                  <div className="text-xs text-gray-700">
                    <p className="font-semibold mb-1">Security Information:</p>
                    <p>✓ Three-step OTP verification completed</p>
                    <p>✓ Encrypted with Fernet symmetric encryption</p>
                    <p>✓ Your privacy and security are our top priorities</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Footer */}
            <div className="bg-gray-800 text-white text-center py-3 text-xs">
              <p>© {new Date().getFullYear()} Healthy Lifestyle Advisor - Data & Security Agent</p>
              <p className="opacity-75 mt-1">Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onBack}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw size={18} />
              <span>Request New Report</span>
            </button>
            <button
              onClick={downloadDecryptedData}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download size={18} />
              <span>Download as PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecryptReportForm;
