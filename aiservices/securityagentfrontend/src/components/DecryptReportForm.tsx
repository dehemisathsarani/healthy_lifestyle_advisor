import React, { useState } from 'react';
import axios from 'axios';
import { Unlock, Key, Copy, Download, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface Props {
  encryptedReport: string;
  decryptionToken: string;
  userId: string;
  onReset: () => void;
}

const DecryptReportForm: React.FC<Props> = ({
  encryptedReport,
  decryptionToken,
  userId,
  onReset
}) => {
  const [decryptMethod, setDecryptMethod] = useState<'token' | 'userId'>('token');
  const [decryptedData, setDecryptedData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDecrypt = async () => {
    setLoading(true);
    setError('');

    try {
      let response;

      if (decryptMethod === 'token') {
        response = await axios.post('/api/security/decrypt-with-token', {
          encrypted_data: encryptedReport,
          decryption_token: decryptionToken
        });
      } else {
        response = await axios.post('/api/security/decrypt', {
          encrypted_data: encryptedReport,
          user_id: userId
        });
      }

      if (response.data.success || response.data.data) {
        setDecryptedData(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to decrypt data');
    } finally {
      setLoading(false);
    }
  };

  const downloadDecryptedData = () => {
    const dataStr = JSON.stringify(decryptedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <Unlock size={32} className="form-icon" />
        <h2>Decrypt Your Report</h2>
        <p>Use your decryption token or user ID to view your health data</p>
      </div>

      {!decryptedData ? (
        <div className="form">
          {/* Encrypted Report Display */}
          <div className="encrypted-box">
            <h3>🔒 Encrypted Report</h3>
            <div className="encrypted-content">
              <code>{encryptedReport.substring(0, 100)}...</code>
            </div>
            <button
              onClick={() => handleCopy(encryptedReport, 'report')}
              className="btn btn-small"
            >
              <Copy size={14} />
              {copied === 'report' ? 'Copied!' : 'Copy Full Report'}
            </button>
          </div>

          {/* Decryption Credentials */}
          <div className="credentials-box">
            <h3>🔐 Decryption Credentials</h3>

            <div className="credential-item">
              <label>Decryption Token:</label>
              <div className="credential-value">
                <code>{decryptionToken.substring(0, 40)}...</code>
                <button
                  onClick={() => handleCopy(decryptionToken, 'token')}
                  className="btn btn-icon"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>

            <div className="credential-item">
              <label>User ID:</label>
              <div className="credential-value">
                <code>{userId}</code>
                <button
                  onClick={() => handleCopy(userId, 'userId')}
                  className="btn btn-icon"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Decryption Method */}
          <div className="form-group">
            <label>Decryption Method</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  checked={decryptMethod === 'token'}
                  onChange={() => setDecryptMethod('token')}
                />
                <Key size={16} />
                Use Decryption Token (Recommended)
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  checked={decryptMethod === 'userId'}
                  onChange={() => setDecryptMethod('userId')}
                />
                <Key size={16} />
                Use User ID
              </label>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button
            onClick={handleDecrypt}
            className="btn btn-primary btn-large"
            disabled={loading}
          >
            <Unlock size={20} />
            {loading ? 'Decrypting...' : 'Decrypt Report'}
          </button>
        </div>
      ) : (
        <div className="form">
          <div className="alert alert-success">
            <CheckCircle size={16} />
            Report decrypted successfully!
          </div>

          {/* Decrypted Data Display */}
          <div className="decrypted-box">
            <h3>📊 Your Health Report</h3>
            <pre className="decrypted-content">
              {JSON.stringify(decryptedData, null, 2)}
            </pre>
          </div>

          <div className="button-group">
            <button
              onClick={onReset}
              className="btn btn-secondary"
            >
              <RefreshCw size={16} />
              Request New Report
            </button>
            <button
              onClick={downloadDecryptedData}
              className="btn btn-primary"
            >
              <Download size={16} />
              Download as JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DecryptReportForm;
