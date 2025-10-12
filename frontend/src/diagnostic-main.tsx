import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

// Emergency diagnostic script
console.log('🚀 DIAGNOSTIC MAIN.TSX LOADING')
console.log('✅ JavaScript working at:', new Date().toISOString())
console.log('✅ Location:', window.location.href)

// Test React without any imports
function EmergencyTest() {
  console.log('🎯 EmergencyTest component rendering')
  
  const [count, setCount] = useState(0)
  
  useEffect(() => {
    console.log('✅ React hooks working!')
    const timer = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: '#4CAF50',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '20px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 9999
    }}>
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <h1>🔥 EMERGENCY DIAGNOSTIC</h1>
        <p>Live Counter: {count}</p>
        <p>URL: {window.location.href}</p>
        <p>✅ React is WORKING!</p>
        <button 
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
          onClick={() => {
            console.log('✅ Button clicked! React events working!')
            alert('React is working perfectly!')
          }}
        >
          Test Click
        </button>
      </div>
    </div>
  )
}

// Bootstrap
console.log('🔧 Starting React bootstrap...')

try {
  const rootElement = document.getElementById('root')
  console.log('✅ Root element:', rootElement)
  
  if (rootElement) {
    const root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <EmergencyTest />
      </StrictMode>
    )
    console.log('✅ React emergency test rendered!')
  } else {
    throw new Error('Root element not found')
  }
} catch (error) {
  console.error('❌ CRITICAL ERROR:', error)
  
  // Ultimate fallback
  document.body.innerHTML = `
    <div style="
      position: fixed; 
      top: 0; 
      left: 0; 
      width: 100%; 
      height: 100%; 
      background: #FF4444; 
      color: white; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-family: Arial; 
      font-size: 18px;
      z-index: 10000;
    ">
      <div style="text-align: center; padding: 20px;">
        <h1>🚨 CRITICAL FAILURE</h1>
        <p>React could not load</p>
        <p>Error: ${String(error)}</p>
        <p>Time: ${new Date().toLocaleTimeString()}</p>
        <p>URL: ${window.location.href}</p>
        <p style="margin-top: 20px; font-size: 14px;">Check browser console for details</p>
      </div>
    </div>
  `
}
