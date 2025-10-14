export const TestMinimal = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#10b981',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '2rem',
      fontWeight: 'bold',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <h1>✅ MINIMAL TEST WORKING</h1>
        <p>If you see this GREEN page, basic React is working!</p>
        <p>Time: {new Date().toLocaleTimeString()}</p>
        <p style={{ fontSize: '1rem', marginTop: '20px' }}>
          This means the issue is with complex components
        </p>
      </div>
    </div>
  )
}
