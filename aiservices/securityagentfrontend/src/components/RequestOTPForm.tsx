import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Phone, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface Props {
  onOTPRequested: (identifier: string) => void;
  onOTPVerified: (otp: string) => void;
}

const RequestOTPForm: React.FC<Props> = ({ onOTPRequested, onOTPVerified }) => {
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post('/api/security/request-otp', {
        identifier,
        identifier_type: identifierType
      });

      if (response.data.success) {
        setOtpSent(true);
        setSuccess(`OTP sent to your ${identifierType}!`);
        onOTPRequested(identifier);
        
        // Simulate email with OTP code displayed in browser console
        console.log('\n' + '='.repeat(60));
        console.log('📧 EMAIL NOTIFICATION (Demo)');
        console.log('='.repeat(60));
        console.log(`To: ${identifier}`);
        console.log(`Subject: Your OTP Code for Secure Access`);
        console.log('');
        console.log(`Dear User,`);
        console.log('');
        console.log(`Your One-Time Password (OTP) is:`);
        console.log('');
        console.log(`     ${response.data.otp_code}`);
        console.log('');
        console.log(`This code will expire in 10 minutes.`);
        console.log(`Please do not share this code with anyone.`);
        console.log('');
        console.log('If you did not request this code, please ignore this email.');
        console.log('');
        console.log('Best regards,');
        console.log('Health Lifestyle Advisor Team');
        console.log('='.repeat(60) + '\n');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/security/verify-otp', {
        identifier,
        otp_code: otpCode,
        identifier_type: identifierType
      });

      if (response.data.success) {
        setSuccess('OTP verified successfully!');
        setTimeout(() => {
          onOTPVerified(otpCode);
        }, 1000);
      } else {
        setError(response.data.message || 'Invalid OTP');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <Mail size={32} className="form-icon" />
        <h2>Request Access Code</h2>
        <p>Enter your email or phone to receive a secure OTP</p>
      </div>

      {!otpSent ? (
        <form onSubmit={handleRequestOTP} className="form">
          <div className="form-group">
            <label>Contact Method</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="email"
                  checked={identifierType === 'email'}
                  onChange={() => setIdentifierType('email')}
                />
                <Mail size={16} />
                Email
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="phone"
                  checked={identifierType === 'phone'}
                  onChange={() => setIdentifierType('phone')}
                />
                <Phone size={16} />
                Phone
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>
              {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
            </label>
            <input
              type={identifierType === 'email' ? 'email' : 'tel'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={identifierType === 'email' ? 'your@email.com' : '+1234567890'}
              required
              className="input"
            />
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={16} />
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="form">
          <div className="otp-info">
            <CheckCircle size={24} className="success-icon" />
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              OTP sent to {identifier}
            </h3>
            <div className="otp-display">
              <p className="note" style={{ fontSize: '0.95rem', margin: '0.5rem 0', fontWeight: '600' }}>
                ✉️ Check your email for the 6-digit OTP code
              </p>
              <p className="note" style={{ marginTop: '0.75rem' }}>
                The code will expire in 10 minutes
              </p>
            </div>
          </div>

          <div className="form-group">
            <label>Enter OTP Code</label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              required
              className="input otp-input"
            />
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
              onClick={() => {
                setOtpSent(false);
                setOtpCode('');
                setError('');
                setSuccess('');
              }}
              className="btn btn-secondary"
            >
              Change {identifierType === 'email' ? 'Email' : 'Phone'}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <CheckCircle size={16} />
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RequestOTPForm;
