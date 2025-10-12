import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface ReportGenerationPageProps {
  userEmail: string;
  onReportDownloaded: (reportData: any) => void;
  onBack: () => void;
  showEmailInput?: boolean;
}

const ReportGenerationPage: React.FC<ReportGenerationPageProps> = ({ 
  userEmail, 
  onReportDownloaded,
  onBack,
  showEmailInput = false
}) => {
  const [reportType, setReportType] = useState('all');
  const [days, setDays] = useState(30);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [downloadOtpSent, setDownloadOtpSent] = useState(false);
  const [downloadOtp, setDownloadOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportData, setReportData] = useState(null);

  const handleRequestDownloadOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Email is already validated in the email verification step
    if (!userEmail.trim()) {
      setError('No email address provided. Please go back to email verification.');
      return;
    }
    
    // Validate date range if custom dates are used
    if (useCustomDates) {
      if (!startDate || !endDate) {
        setError('Please select both start and end dates');
        return;
      }
      if (new Date(startDate) > new Date(endDate)) {
        setError('Start date cannot be later than end date');
        return;
      }
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Requesting download OTP for:', userEmail);
      const response = await axios.post('/api/security/three-step/request-download-access', {
        identifier: userEmail
      });

      console.log('✅ Download OTP Response:', response.data);

      if (response.data.success) {
        setDownloadOtpSent(true);
        setSuccess(`📧 Step 2: Download OTP sent to ${userEmail}! Check your email to proceed with report generation.`);
      } else {
        setError(response.data.message || 'Failed to send download OTP. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Download OTP Error:', err);
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to send download OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDownloadOtp = async () => {
    if (!downloadOtp.trim()) {
      setError('Please enter the download OTP code');
      return;
    }

    // Basic OTP validation (should be 6 digits)
    if (!/^\d{6}$/.test(downloadOtp.trim())) {
      setError('OTP must be a 6-digit number');
      return;
    }

    setVerifying(true);
    setError('');
    setSuccess('');
    
    try {
      console.log('🔄 Verifying download OTP for:', userEmail);
      
      const requestData: any = {
        identifier: userEmail,
        otp_code: downloadOtp.trim(),
        report_type: reportType,
        days
      };

      if (useCustomDates) {
        requestData.start_date = startDate;
        requestData.end_date = endDate;
      }

      const response = await axios.post('/api/security/three-step/verify-download-access', requestData);

      console.log('✅ Download verification response:', response.data);

      if (response.data.success) {
        setReportGenerated(true);
        const reportData = response.data.data?.report_data || { 
          type: reportType, 
          period: useCustomDates ? `${startDate} to ${endDate}` : `Last ${days} days`,
          generated_at: new Date().toISOString(),
          encrypted: true
        };
        setReportData(reportData);
        setSuccess('✅ Report generated successfully! You can now download your encrypted health report and proceed to Step 3.');
      } else {
        setError(response.data.message || 'Invalid OTP code. Please try again.');
      }
    } catch (err: any) {
      console.error('❌ Download verification error:', err);
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('🔄 New download OTP has been sent to your email. Please check and enter the new code.');
        setDownloadOtp(''); // Clear the input
      } else {
        setError(err.response?.data?.message || err.response?.data?.detail || 'Invalid OTP code. Please try again.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleDownloadReport = () => {
    if (reportData) {
      console.log('📥 Downloading report data:', reportData);
      setSuccess('📥 Report downloaded! Proceeding to Step 3: Report Decryption...');
      setTimeout(() => {
        onReportDownloaded(reportData);
      }, 1500);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <FileText size={32} className="form-icon" />
        <h2>Generate Health Report</h2>
        <p>Step 2 of 3: Configure and download your encrypted health report</p>
      </div>

      <div className="steps-indicator">
        <div className="step completed">
          <div className="step-number">✓</div>
          <div className="step-label">Email Verified</div>
        </div>
        <div className="step active">
          <div className="step-number">2</div>
          <div className="step-label">Report Generation</div>
        </div>
        <div className="step">
          <div className="step-number">3</div>
          <div className="step-label">Report Decryption</div>
        </div>
      </div>

      <div className="info-box">
        <p><strong>📧 Verified Email:</strong> {userEmail}</p>
        <p><strong>🔐 Step 1:</strong> ✅ Email verification completed</p>
        <p><strong>📊 Step 2:</strong> {reportGenerated ? '✅ Report ready for download' : '🔄 Generate encrypted report'}</p>
      </div>

      <form onSubmit={handleRequestDownloadOtp} className="form">
        {showEmailInput && (
          <div className="form-group">
            <label>📧 Email Address</label>
            <input
              type="email"
              value={userEmail}
              readOnly
              className="input"
              placeholder="Email address already verified"
              disabled={true}
            />
          </div>
        )}
        
        <div className="form-group">
          <label>Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input"
            disabled={downloadOtpSent}
          >
            <option value="all">📊 All Health Data (Diet + Fitness + Mental Health)</option>
            <option value="diet">🍎 Diet Agent Only</option>
            <option value="fitness">💪 Fitness Agent Only</option>
            <option value="mental_health">🧠 Mental Health Agent Only</option>
          </select>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useCustomDates}
              onChange={(e) => setUseCustomDates(e.target.checked)}
              disabled={downloadOtpSent}
            />
            Use custom date range
          </label>
        </div>

        {useCustomDates ? (
          <>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required={useCustomDates}
                disabled={downloadOtpSent}
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                required={useCustomDates}
                disabled={downloadOtpSent}
              />
            </div>
          </>
        ) : (
          <div className="form-group">
            <label>Number of Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="input"
              disabled={downloadOtpSent}
            />
            <small className="help-text">Get data from the last {days} days</small>
          </div>
        )}

        {/* Download OTP Section */}
        {downloadOtpSent && (
          <div className="form-group">
            <label>Download Access Code</label>
            <div className="otp-input-group">
              <input
                type="text"
                value={downloadOtp}
                onChange={(e) => setDownloadOtp(e.target.value)}
                placeholder="Enter download OTP from email"
                className="input"
                maxLength={6}
                disabled={verifying || reportGenerated}
              />
              <button
                type="button"
                onClick={handleVerifyDownloadOtp}
                className="btn btn-secondary"
                disabled={verifying || !downloadOtp.trim() || reportGenerated}
              >
                {verifying ? '🔄' : reportGenerated ? '✅' : '🔍'}
                {verifying ? 'Generating...' : reportGenerated ? 'Generated' : 'Generate Report'}
              </button>
            </div>
            <small className="help-text">
              {reportGenerated ? 
                '✅ Report generated successfully! You can now download it.' :
                '📧 Check your email for the download access code (valid for 15 minutes)'
              }
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
            type="button"
            onClick={onBack}
            className="btn btn-secondary"
          >
            <ArrowLeft size={16} />
            Back to Email Verification
          </button>
          
          {!downloadOtpSent ? (
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
            >
              <FileText size={16} />
              {loading ? 'Requesting Access...' : 'Request Download Access'}
            </button>
          ) : reportGenerated ? (
            <button 
              type="button"
              onClick={handleDownloadReport}
              className="btn btn-primary" 
            >
              <Download size={16} />
              Download Encrypted Report
            </button>
          ) : (
            <button 
              type="button"
              className="btn btn-outline"
              disabled
            >
              <FileText size={16} />
              Waiting for OTP Verification
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ReportGenerationPage;