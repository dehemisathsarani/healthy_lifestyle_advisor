import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Calendar, Download, AlertCircle, CheckCircle, ArrowLeft, Key } from 'lucide-react';

interface Props {
  identifier: string;
  onReportReceived: (data: any) => void;
  onBack: () => void;
}

const SecureReportForm: React.FC<Props> = ({ identifier, onReportReceived, onBack }) => {
  const [reportType, setReportType] = useState('all');
  const [days, setDays] = useState(30);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Second OTP for download
  const [reportGenerated, setReportGenerated] = useState(false);
  const [downloadOtp, setDownloadOtp] = useState('');
  const [downloadOtpVerified, setDownloadOtpVerified] = useState(false);
  const [verifyingDownloadOtp, setVerifyingDownloadOtp] = useState(false);
  const [generatedReportData, setGeneratedReportData] = useState(null);

  const verifyOtp = async () => {
    if (!enteredOtp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    setVerifyingOtp(true);
    setError('');

    try {
      const response = await axios.post('/api/security/verify-decrypt-otp', {
        identifier,
        otp_code: enteredOtp.trim()
      });

      if (response.data.success) {
        setOtpVerified(true);
        setSuccess('OTP verified successfully! You can now generate your report.');
        setError('');
      }
    } catch (err: any) {
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('New OTP has been sent to your email. Please check and enter the new code.');
      } else {
        setError(err.response?.data?.detail || 'Invalid OTP code. Please try again.');
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const verifyDownloadOtp = async () => {
    if (!downloadOtp.trim()) {
      setError('Please enter the download OTP code');
      return;
    }

    setVerifyingDownloadOtp(true);
    try {
      const response = await axios.post('/api/security/verify-decrypt-otp', {
        identifier,
        otp_code: downloadOtp.trim()
      });

      if (response.data.success) {
        setDownloadOtpVerified(true);
        setSuccess('Download access granted! You can now download your encrypted report.');
        setError('');
        
        // Trigger the actual download
        if (generatedReportData) {
          onReportReceived(generatedReportData);
        }
      }
    } catch (err: any) {
      if (err.response?.data?.action === 'new_otp_sent') {
        setError('New download OTP has been sent to your email. Please check and enter the new code.');
      } else {
        setError(err.response?.data?.detail || 'Invalid download OTP code. Please try again.');
      }
    } finally {
      setVerifyingDownloadOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const requestData: any = {
        identifier,
        otp_code: enteredOtp.trim(),
        report_type: reportType,
        days
      };

      if (useCustomDates) {
        requestData.start_date = startDate;
        requestData.end_date = endDate;
      }

      const response = await axios.post('/api/security/secure-report', requestData);

      if (response.data.success) {
        // Store the report data for later download
        setGeneratedReportData(response.data);
        setReportGenerated(true);
        
        // Request download OTP
        try {
          await axios.post('/api/security/request-decrypt-otp', {
            identifier
          });
          setSuccess('Report generated! A download OTP has been sent to your email. Please enter it below to download your encrypted report.');
        } catch (otpErr: any) {
          setSuccess('Report generated! Please request a download OTP to access your encrypted report.');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <FileText size={32} className="form-icon" />
        <h2>Request Health Report</h2>
        <p>Specify the type and date range for your encrypted report</p>
      </div>

      <form onSubmit={handleSubmit} className="form">
        {/* OTP Verification Section */}
        <div className="form-group">
          <label>Enter OTP Code</label>
          <div className="otp-input-group">
            <input
              type="text"
              value={enteredOtp}
              onChange={(e) => setEnteredOtp(e.target.value)}
              placeholder="Enter 6-digit OTP from your email"
              className="input"
              maxLength={6}
              disabled={otpVerified}
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={verifyingOtp || otpVerified || !enteredOtp.trim()}
              className={`btn ${otpVerified ? 'btn-success' : 'btn-primary'}`}
            >
              {verifyingOtp ? 'Verifying...' : otpVerified ? '✓ Verified' : 'Verify OTP'}
            </button>
          </div>
          <small className="help-text">
            {otpVerified ? 
              '✅ OTP verified successfully! You can now generate your report.' :
              '📧 Check your email for the OTP code. If you didn\'t receive it, a new one will be sent automatically.'
            }
          </small>
        </div>

        <div className="form-group">
          <label>Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="input"
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
            />
            Use custom date range
          </label>
        </div>

        {!useCustomDates ? (
          <div className="form-group">
            <label>Number of Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              min="1"
              max="365"
              className="input"
            />
            <small className="help-text">Get data from the last {days} days</small>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                required={useCustomDates}
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
              />
            </div>
          </>
        )}

        {/* Download OTP Section - Only shown after report is generated */}
        {reportGenerated && (
          <div className="form-group">
            <label>Download OTP Code</label>
            <div className="otp-input-group">
              <input
                type="text"
                value={downloadOtp}
                onChange={(e) => setDownloadOtp(e.target.value)}
                placeholder="Enter download OTP from your email"
                className="input"
                maxLength={6}
                disabled={downloadOtpVerified}
              />
              <button
                type="button"
                onClick={verifyDownloadOtp}
                className="btn btn-secondary"
                disabled={verifyingDownloadOtp || !downloadOtp.trim() || downloadOtpVerified}
              >
                {verifyingDownloadOtp ? '🔄' : downloadOtpVerified ? '✅' : '🔍'}
                {verifyingDownloadOtp ? 'Verifying...' : downloadOtpVerified ? 'Verified' : 'Verify'}
              </button>
            </div>
            <small className="help-text">
              {downloadOtpVerified ? 
                '✅ Download access granted! Your report will download automatically.' :
                '📧 Check your email for the download OTP code to access your encrypted report.'
              }
            </small>
          </div>
        )}

        <div className="info-box">
          <p><strong>📧 Email:</strong> {identifier}</p>
          <p><strong>🔐 Access OTP:</strong> {otpVerified ? 'Verified ✓' : 'Pending verification'}</p>
          {reportGenerated && (
            <p><strong>📥 Download OTP:</strong> {downloadOtpVerified ? 'Verified ✓' : 'Pending verification'}</p>
          )}
          <p><strong>📅 Period:</strong> {useCustomDates ? `${startDate} to ${endDate}` : `Last ${days} days`}</p>
        </div>

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
            Back
          </button>
          
          {!reportGenerated ? (
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !otpVerified}
            >
              <Download size={16} />
              {loading ? 'Generating...' : otpVerified ? 'Generate Encrypted Report' : 'Verify OTP First'}
            </button>
          ) : (
            <button 
              type="button"
              onClick={() => {
                if (downloadOtpVerified && generatedReportData) {
                  onReportReceived(generatedReportData);
                }
              }}
              className="btn btn-primary" 
              disabled={!downloadOtpVerified}
            >
              <Download size={16} />
              {downloadOtpVerified ? 'Download Encrypted Report' : 'Enter Download OTP First'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SecureReportForm;
