// No import needed with react-jsx transform

function TestApp() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f0f0f0', 
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#2563eb' }}>🎉 Frontend is Working!</h1>
      <p>React is successfully mounting and rendering.</p>
      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#10b981', 
        color: 'white', 
        borderRadius: '5px' 
      }}>
        ✅ Frontend Status: ONLINE
      </div>
      <div style={{ 
        marginTop: '10px', 
        padding: '10px', 
        backgroundColor: '#f59e0b', 
        color: 'white', 
        borderRadius: '5px' 
      }}>
        🔗 Backend should be at: http://localhost:8000
      </div>
    </div>
  )
}

export default TestApp
