import React, { useState } from 'react';
import { Lock, Unlock, CheckCircle, AlertCircle, ArrowLeft, FileText } from 'lucide-react';
import axios from 'axios';

interface DecryptionPageProps {
  userEmail: string;
  reportData: any;
  onBack: () => void;
}

const DecryptionPage: React.FC<DecryptionPageProps> = ({ 
  userEmail, 
  reportData,
  onBack 
}) => {
  const [decryptOtpSent, setDecryptOtpSent] = useState(false);
  const [decryptOtp, setDecryptOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [decrypted, setDecrypted] = useState(false);
  const [decryptedReport, setDecryptedReport] = useState<any>(null);

  const handleRequestDecryptOtp = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Requesting decrypt OTP for:', userEmail);
      const response = await axios.post('/api/security/three-step/request-decrypt-access', {
        identifier: userEmail
      });

      console.log('✅ Decrypt OTP Response:', response.data);

      if (response.data.success) {
        setDecryptOtpSent(true);
        setSuccess(`📧 Step 3: Final decryption OTP sent to ${userEmail}! Check your email to unlock your health report.`);
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
      console.log('🔄 Verifying decrypt OTP for:', userEmail);
      const response = await axios.post('/api/security/three-step/verify-decrypt-access', {
        identifier: userEmail,
        otp_code: decryptOtp.trim(),
        report_type: reportData?.type || 'all'  // Include selected report type
      });

      console.log('✅ Decrypt verification response:', response.data);

      if (response.data.success) {
        setDecrypted(true);
        
        // 🎉 USE REAL HEALTH DATA FROM CLOUD DATABASE
        const realHealthReport = response.data.data?.decrypted_report;
        
        if (realHealthReport && realHealthReport.data_source === "REAL_DATABASE_COLLECTIONS") {
          // Real data from cloud database
          setDecryptedReport(realHealthReport);
          setSuccess('🎉 Report decrypted successfully! This is your REAL health data from the cloud database.');
        } else if (realHealthReport && realHealthReport.data_source === "DEMO_DATA_USER_NOT_FOUND") {
          // User not found - show demo message
          setDecryptedReport(realHealthReport);
          setSuccess('📊 Report decrypted successfully! No existing data found - start tracking to see your real health insights.');
        } else {
          // Fallback to basic structure if needed
          const fallbackReport = {
            report_id: `RPT_${Date.now()}`,
            decrypted_at: new Date().toISOString(),
            data_source: "FALLBACK_DATA",
            report_content: {
              diet_data: { total_meals: 0, avg_calories: 0, nutrition_score: 0 },
              fitness_data: { total_workouts: 0, avg_duration: '0 min', fitness_score: 0 },
              mental_health_data: { mood_average: 0, stress_level: 'Unknown', wellness_score: 0 }
            },
            recommendations: ['Start tracking your health data to see personalized insights']
          };
          setDecryptedReport(fallbackReport);
          setSuccess('📊 Report decrypted successfully! Start adding health data to see your personalized insights.');
        }
        setSuccess('🎉 Report decrypted successfully! You now have complete access to your health data.');
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

  return (
    <div className="form-container">
      <div className="form-header">
        <Lock size={32} className="form-icon" />
        <h2>Decrypt Health Report</h2>
        <p>Step 3 of 3: Enter decryption code to view your health data</p>
      </div>

      <div className="steps-indicator">
        <div className="step completed">
          <div className="step-number">✓</div>
          <div className="step-label">Email Verified</div>
        </div>
        <div className="step completed">
          <div className="step-number">✓</div>
          <div className="step-label">Report Downloaded</div>
        </div>
        <div className="step active">
          <div className="step-number">3</div>
          <div className="step-label">Report Decryption</div>
        </div>
      </div>

      <div className="info-box">
        <p><strong>📧 Verified Email:</strong> {userEmail}</p>
        <p><strong>📊 Downloaded Report:</strong> {reportData?.report_id || 'Encrypted Health Report'}</p>
        <p><strong>📁 File Size:</strong> {reportData?.file_size || '2.5 MB'}</p>
        <p><strong>🔐 Status:</strong> {decrypted ? '🔓 Decrypted and Accessible' : '🔒 Encrypted - Need OTP to view'}</p>
      </div>

      {!decrypted ? (
        <div className="form">
          {!decryptOtpSent ? (
            <div className="decrypt-request">
              <div className="alert alert-info">
                <Lock size={16} />
                Your health report is encrypted for security. Click below to receive a decryption code via email.
              </div>
              
              <button
                onClick={handleRequestDecryptOtp}
                className="btn btn-primary full-width"
                disabled={loading}
              >
                <Unlock size={16} />
                {loading ? 'Requesting Decryption Code...' : 'Request Decryption Code'}
              </button>
            </div>
          ) : (
            <div className="form-group">
              <label>Decryption Code</label>
              <div className="otp-input-group">
                <input
                  type="text"
                  value={decryptOtp}
                  onChange={(e) => setDecryptOtp(e.target.value)}
                  placeholder="Enter decryption OTP from email"
                  className="input"
                  maxLength={6}
                  disabled={verifying}
                />
                <button
                  type="button"
                  onClick={handleVerifyDecryptOtp}
                  className="btn btn-secondary"
                  disabled={verifying || !decryptOtp.trim()}
                >
                  {verifying ? '🔄' : '🔓'}
                  {verifying ? 'Decrypting...' : 'Decrypt Report'}
                </button>
              </div>
              <small className="help-text">
                🔐 Enter the 6-digit decryption code sent to your email (valid for 20 minutes)
              </small>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <CheckCircle size={16} />
              {success}
            </div>
          )}

          <div className="button-group">
            <button
              onClick={onBack}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              Back to Report Generation
            </button>
          </div>
        </div>
      ) : (
        /* Decrypted Report View */
        <div className="decrypted-report">
          <div className="alert alert-success">
            <Unlock size={16} />
            Report successfully decrypted! Here's your health data:
          </div>

          {decryptedReport && (
            <div className="report-content">
              {/* Data Source Indicator */}
              <div className="data-source-indicator" style={{
                marginBottom: '20px',
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: decryptedReport.data_source === 'REAL_DATABASE_COLLECTIONS' ? '#e7f5e7' : '#fff3cd',
                border: `1px solid ${decryptedReport.data_source === 'REAL_DATABASE_COLLECTIONS' ? '#28a745' : '#ffc107'}`,
                color: decryptedReport.data_source === 'REAL_DATABASE_COLLECTIONS' ? '#155724' : '#856404'
              }}>
                <strong>📊 Data Source: </strong>
                {decryptedReport.data_source === 'REAL_DATABASE_COLLECTIONS' && '✅ Real Health Data from Cloud Database'}
                {decryptedReport.data_source === 'DEMO_DATA_USER_NOT_FOUND' && '📝 Demo Data - User Profile Not Found'}
                {decryptedReport.data_source === 'FALLBACK_DATA' && '🔧 System Fallback Data'}
                {decryptedReport.user_id && (
                  <span style={{ marginLeft: '10px', fontSize: '0.9em' }}>
                    (User ID: {decryptedReport.user_id})
                  </span>
                )}
              </div>
              
              <div className="report-section">
                <h3>📊 Health Summary</h3>
                <div className="health-metrics">
                  {decryptedReport.report_content?.diet_data && (
                    <div className="metric-card">
                      <h4>🍎 Diet & Nutrition Analysis</h4>
                      <p><strong>Total Meals Tracked:</strong> {decryptedReport.report_content.diet_data.total_meals || 0}</p>
                      <p><strong>Average Daily Calories:</strong> {decryptedReport.report_content.diet_data.avg_calories_per_day || decryptedReport.report_content.diet_data.avg_calories || 0}</p>
                      <p><strong>Total Calories:</strong> {decryptedReport.report_content.diet_data.total_calories || 'N/A'}</p>
                      <p><strong>Nutrition Score:</strong> {decryptedReport.report_content.diet_data.nutrition_score}/10</p>
                      {decryptedReport.report_content.diet_data.nutrition_entries_count && (
                        <p><strong>Nutrition Entries:</strong> {decryptedReport.report_content.diet_data.nutrition_entries_count}</p>
                      )}
                      {decryptedReport.report_content.diet_data.data_period_days && (
                        <p><strong>Data Period:</strong> {decryptedReport.report_content.diet_data.data_period_days} days</p>
                      )}
                    </div>
                  )}

                  {decryptedReport.report_content?.fitness_data && (
                    <div className="metric-card">
                      <h4>💪 Fitness & Exercise Analysis</h4>
                      <p><strong>Total Workouts:</strong> {decryptedReport.report_content.fitness_data.total_workouts || 0}</p>
                      <p><strong>Average Duration:</strong> {decryptedReport.report_content.fitness_data.avg_duration || 'N/A'}</p>
                      <p><strong>Fitness Score:</strong> {decryptedReport.report_content.fitness_data.fitness_score}/10</p>
                      {decryptedReport.report_content.fitness_data.total_workout_plans && (
                        <p><strong>Workout Plans:</strong> {decryptedReport.report_content.fitness_data.total_workout_plans}</p>
                      )}
                      {decryptedReport.report_content.fitness_data.total_duration_minutes && (
                        <p><strong>Total Exercise Time:</strong> {decryptedReport.report_content.fitness_data.total_duration_minutes} minutes</p>
                      )}
                    </div>
                  )}

                  {decryptedReport.report_content?.mental_health_data && (
                    <div className="metric-card">
                      <h4>🧠 Mental Health & Wellness</h4>
                      <p><strong>Average Mood Rating:</strong> {decryptedReport.report_content.mental_health_data.mood_average}/10</p>
                      <p><strong>Stress Level:</strong> {decryptedReport.report_content.mental_health_data.stress_level}</p>
                      <p><strong>Wellness Score:</strong> {decryptedReport.report_content.mental_health_data.wellness_score}/10</p>
                      {decryptedReport.report_content.mental_health_data.mental_health_entries && (
                        <p><strong>Mental Health Records:</strong> {decryptedReport.report_content.mental_health_data.mental_health_entries}</p>
                      )}
                      {decryptedReport.report_content.mental_health_data.meditation_sessions_count && (
                        <p><strong>Meditation Sessions:</strong> {decryptedReport.report_content.mental_health_data.meditation_sessions_count}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {decryptedReport.recommendations && (
                <div className="report-section">
                  <h3>💡 Personalized Recommendations</h3>
                  <div className="recommendations">
                    {decryptedReport.recommendations.map((rec: string, index: number) => (
                      <div key={index} className="recommendation-item">
                        <span className="rec-number">{index + 1}</span>
                        <span className="rec-text">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="report-footer">
                <p><strong>📅 Generated:</strong> {decryptedReport.decrypted_at}</p>
                <p><strong>🆔 Report ID:</strong> {decryptedReport.report_id}</p>
              </div>
            </div>
          )}

          <div className="completion-message">
            <div className="alert alert-success">
              <CheckCircle size={16} />
              🎉 Congratulations! You have successfully completed the three-step security process and accessed your encrypted health report.
            </div>
          </div>

          <div className="button-group">
            <button
              onClick={onBack}
              className="btn btn-secondary"
            >
              <ArrowLeft size={16} />
              Generate Another Report
            </button>
            <button
              onClick={() => window.print()}
              className="btn btn-primary"
            >
              <FileText size={16} />
              Print Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecryptionPage;