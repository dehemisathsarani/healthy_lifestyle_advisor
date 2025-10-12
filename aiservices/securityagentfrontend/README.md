# Data & Security Agent - Frontend

## 🔐 Overview

This is the **frontend application** for the Data and Security Agent, providing a user-friendly interface for secure health report access with **OTP authentication** and **encrypted data download/decryption**.

## ✨ Features

### 1. **OTP-Based Authentication**
- Request OTP via email or phone number
- Verify OTP code before report access
- Automatic token generation after verification

### 2. **Secure Report Requests**
- Choose report type (Diet, Fitness, Mental Health, or All)
- Specify date range (last N days or custom dates)
- Real-time report generation

### 3. **Encrypted Data Handling**
- Receive encrypted health reports
- Get decryption tokens automatically
- Two decryption methods:
  - Token-based decryption (recommended)
  - User ID-based decryption

### 4. **Data Visualization**
- View decrypted health data in JSON format
- Download reports as JSON files
- Copy encrypted data and tokens to clipboard

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:8000`
- MongoDB with health agent data

### Installation

```bash
cd aiservices/securityagentfrontend
npm install
```

### Development

```bash
npm run dev
```

The application will be available at: `http://localhost:5004`

### Build for Production

```bash
npm run build
npm run preview
```

## 📋 User Flow

### Step 1: Request OTP

1. **Choose contact method** (Email or Phone)
2. **Enter identifier** (your@email.com or +1234567890)
3. **Click "Send OTP"**
4. **Receive OTP code** (displayed on screen in demo mode)

### Step 2: Verify OTP & Request Report

1. **Enter the 6-digit OTP code**
2. **Click "Verify OTP"**
3. **Select report type**:
   - 📊 All Health Data
   - 🍎 Diet Agent Only
   - 💪 Fitness Agent Only
   - 🧠 Mental Health Agent Only
4. **Choose date range**:
   - Last N days (default: 30)
   - Custom date range
5. **Click "Get Encrypted Report"**

### Step 3: Decrypt Report

1. **Review encrypted report** (shown on screen)
2. **Copy credentials**:
   - Decryption Token (recommended)
   - User ID
3. **Choose decryption method**
4. **Click "Decrypt Report"**
5. **View your health data**
6. **Download as JSON** (optional)

## 🎨 UI Components

### RequestOTPForm
- Email/Phone selector
- OTP request interface
- OTP verification form
- Real-time validation

### SecureReportForm
- Report type selector
- Date range picker
- Custom date support
- Request summary

### DecryptReportForm
- Encrypted data display
- Credential management (copy to clipboard)
- Decryption method selector
- Decrypted data viewer
- JSON download

## 🔧 API Integration

### Backend Endpoints Used

1. **POST** `/api/security/request-otp`
   - Request OTP code

2. **POST** `/api/security/verify-otp`
   - Verify OTP code

3. **POST** `/api/security/secure-report`
   - Get encrypted health report

4. **POST** `/api/security/decrypt`
   - Decrypt with user ID

5. **POST** `/api/security/decrypt-with-token`
   - Decrypt with token

## 📱 Responsive Design

The application is fully responsive and works on:
- 📱 Mobile devices (320px+)
- 📱 Tablets (768px+)
- 💻 Desktop (1024px+)
- 🖥️ Large screens (1440px+)

## 🎨 Styling

- Modern gradient design
- Card-based layout
- Step progress indicator
- Icon-based navigation
- Color-coded status (success/error)
- Smooth transitions and animations

## 🔒 Security Features

### Frontend Security
- No sensitive data stored in localStorage
- Secure clipboard operations
- HTTPS recommended for production
- Input validation and sanitization

### API Communication
- Axios for HTTP requests
- Proxy configuration for CORS
- Error handling and user feedback

## 🧪 Testing the Flow

### Test Data

Use this sample email for testing:
```
Email: test@example.com
```

After requesting OTP, the code will be displayed on screen (demo mode only).

### Example OTP Flow

1. Enter email: `test@example.com`
2. Get OTP: `123456` (example)
3. Verify OTP
4. Select: "All Health Data"
5. Choose: "Last 30 days"
6. Get encrypted report
7. Use "Decryption Token" method
8. View and download data

## 📂 Project Structure

```
securityagentfrontend/
├── src/
│   ├── components/
│   │   ├── RequestOTPForm.tsx      # OTP request & verification
│   │   ├── SecureReportForm.tsx    # Report request form
│   │   └── DecryptReportForm.tsx   # Decryption interface
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # Global styles
│   └── main.tsx                    # Entry point
├── index.html                      # HTML template
├── package.json                    # Dependencies
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript config
└── README.md                       # This file
```

## 🎯 Key Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Axios** - HTTP client
- **Lucide React** - Icon library

## 🔐 Environment Variables

Create a `.env` file (optional):

```env
VITE_API_URL=http://localhost:8000
```

## 🐛 Troubleshooting

### Issue: OTP not received
**Solution**: In demo mode, OTP is displayed on screen. In production, check email/SMS service configuration.

### Issue: Cannot decrypt report
**Solution**: Ensure you're using the correct user_id or decryption token provided with the encrypted report.

### Issue: API connection error
**Solution**: Verify backend is running on `http://localhost:8000` and accessible.

### Issue: TypeScript errors
**Solution**: Run `npm install` to ensure all dependencies are installed.

## 📊 Features Roadmap

- [ ] Email OTP delivery (via SendGrid/AWS SES)
- [ ] SMS OTP delivery (via Twilio)
- [ ] Token expiration countdown
- [ ] Report preview before download
- [ ] Multiple report format support (PDF, CSV)
- [ ] Report scheduling
- [ ] Share encrypted reports
- [ ] Dark mode support

## 🤝 Integration with Backend

Ensure your backend (`backend/main.py`) includes the security router:

```python
from app.routes.security_routes import router as security_router

app.include_router(security_router)
```

## 📝 License

Part of the Healthy Lifestyle Advisor project.

## 👥 Support

For issues or questions:
1. Check the main project README
2. Review API documentation at `/docs`
3. Contact the development team

---

**Version**: 1.0.0  
**Last Updated**: October 12, 2025  
**Port**: 5004
