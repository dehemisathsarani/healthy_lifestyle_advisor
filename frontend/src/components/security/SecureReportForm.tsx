import React, { useState } from 'react';
import axios from 'axios';
import { FileText, Calendar, Download, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

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
  
  // Step 2: Download OTP states
  const [downloadOtpSent, setDownloadOtpSent] = useState(false);
  const [downloadOtp, setDownloadOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 2.1: Request Download OTP (Second OTP)
  const handleRequestDownloadOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      console.log('🔄 Step 2: Requesting download OTP for:', identifier);
      const response = await axios.post('/api/security/three-step/request-download-access', {
        identifier
      });

      console.log('✅ Download OTP Response:', response.data);

      if (response.data.success) {
        setDownloadOtpSent(true);
        setSuccess(`📧 Second OTP sent to ${identifier}! Check your email (valid for 15 minutes).`);
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

  // Step 2.2: Verify Download OTP and Generate Report
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
      console.log('🔄 Step 2: Verifying download OTP and generating report...');
      
      const requestData: any = {
        identifier,
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
        setSuccess('✅ Report generated successfully! Click "Download Encrypted Report" to proceed to Step 3.');
        // Don't auto-navigate - let user click download button
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

  // Handle download and proceed to Step 3
  const handleDownloadReport = () => {
    console.log('📥 Downloading encrypted report and proceeding to Step 3...');
    setSuccess('📥 Report downloaded! Proceeding to Step 3: Report Decryption...');
    
    // Navigate to Step 3 after a short delay
    setTimeout(() => {
      onReportReceived({
        success: true,
        encrypted_report: 'encrypted_data_placeholder',
        decryption_token: 'token_placeholder',
        user_id: identifier,
        report_type: reportType,
        generated_at: new Date().toISOString()
      });
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <FileText size={32} className="text-blue-600" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Request Health Report</h2>
          <p className="text-sm text-gray-600">Step 2 of 3: Specify the type and date range for your encrypted report</p>
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
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold mb-2">2</div>
          <div className="text-xs text-blue-600 font-medium">Generate Report</div>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold mb-2">3</div>
          <div className="text-xs text-gray-500">Decryption</div>
        </div>
      </div>

      <form onSubmit={handleRequestDownloadOtp} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={downloadOtpSent}
          >
            <option value="all">📊 All Health Data (Diet + Fitness + Mental Health)</option>
            <option value="diet">🍎 Diet Agent Only</option>
            <option value="fitness">💪 Fitness Agent Only</option>
            <option value="mental_health">🧠 Mental Health Agent Only</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="useCustomDates"
            checked={useCustomDates}
            onChange={(e) => setUseCustomDates(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={downloadOtpSent}
          />
          <label htmlFor="useCustomDates" className="text-sm text-gray-700">
            Use custom date range
          </label>
        </div>

        {!useCustomDates ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Days</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              min="1"
              max="365"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={downloadOtpSent}
            />
            <small className="text-gray-500 text-xs mt-1 block">Get data from the last {days} days</small>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={useCustomDates}
                disabled={downloadOtpSent}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={useCustomDates}
                disabled={downloadOtpSent}
              />
            </div>
          </div>
        )}

        {/* Second OTP Input - Shows after requesting download access */}
        {downloadOtpSent && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📧 Second OTP - Download Access Code
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={downloadOtp}
                onChange={(e) => setDownloadOtp(e.target.value)}
                placeholder="Enter 6-digit OTP from email"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={6}
                disabled={verifying || reportGenerated}
              />
              <button
                type="button"
                onClick={handleVerifyDownloadOtp}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={verifying || !downloadOtp.trim() || reportGenerated}
              >
                {verifying ? '🔄 Verifying...' : reportGenerated ? '✅ Verified' : '🔍 Verify & Generate'}
              </button>
            </div>
            <small className="text-gray-600 text-xs mt-2 block">
              {reportGenerated ? 
                '✅ Report generated successfully! Click "Download" below.' :
                '📧 Check your email for the download access code (valid for 15 minutes)'
              }
            </small>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm"><strong className="text-gray-700">📧 Email:</strong> <span className="text-gray-900">{identifier}</span></p>
          <p className="text-sm"><strong className="text-gray-700">📅 Period:</strong> <span className="text-gray-900">{useCustomDates ? `${startDate} to ${endDate}` : `Last ${days} days`}</span></p>
          <p className="text-sm"><strong className="text-gray-700">📊 Report Type:</strong> <span className="text-gray-900">{reportType === 'all' ? 'All Health Data' : reportType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span></p>
        </div>

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
            type="button"
            onClick={onBack}
            className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            <ArrowLeft size={18} className="inline mr-2" />
            Back
          </button>
          
          {!downloadOtpSent ? (
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <><span className="animate-spin">⏳</span><span>Requesting...</span></>
              ) : (
                <><FileText size={18} /><span>Request Download Access</span></>
              )}
            </button>
          ) : reportGenerated ? (
            <button
              type="button"
              onClick={handleDownloadReport}
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Download size={18} />
              <span>Download Encrypted Report</span>
            </button>
          ) : (
            <button
              type="button"
              className="flex-1 py-3 bg-gray-300 text-gray-600 font-medium rounded-lg cursor-not-allowed flex items-center justify-center space-x-2"
              disabled
            >
              <Download size={18} />
              <span>Waiting for OTP Verification</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default SecureReportForm;
