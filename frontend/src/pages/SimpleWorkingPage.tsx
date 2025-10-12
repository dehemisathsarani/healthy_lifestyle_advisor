export const SimpleWorkingPage = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px',
        width: '100%'
      }}>
        <h1 style={{
          fontSize: '3rem',
          color: '#333',
          marginBottom: '20px',
          fontWeight: 'bold'
        }}>
          🎉 Frontend is Working!
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#666',
          marginBottom: '30px'
        }}>
          Your HealthFit Advisor application is successfully running.
        </p>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ color: '#28a745', marginBottom: '10px' }}>✅ React</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Working properly</p>
          </div>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ color: '#28a745', marginBottom: '10px' }}>✅ Vite</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Server running</p>
          </div>
          
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid #e9ecef'
          }}>
            <h3 style={{ color: '#28a745', marginBottom: '10px' }}>✅ Routing</h3>
            <p style={{ color: '#666', fontSize: '0.9rem' }}>Navigation ready</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => window.location.href = '/services'}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#007bff'}
          >
            🏥 Health Services
          </button>
          
          <button 
            onClick={() => window.location.href = '/calendar'}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#1e7e34'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#28a745'}
          >
            📅 Calendar
          </button>
          
          <button 
            onClick={() => window.location.href = '/about'}
            style={{
              backgroundColor: '#6f42c1',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#5a32a3'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#6f42c1'}
          >
            ℹ️ About
          </button>
        </div>
        
        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#e8f5e8',
          borderRadius: '10px',
          border: '1px solid #d4edda'
        }}>
          <h4 style={{ color: '#155724', marginBottom: '10px' }}>🚀 Ready for Development</h4>
          <p style={{ color: '#155724', fontSize: '0.9rem', margin: 0 }}>
            Your health ecosystem with Diet Agent, Fitness Planner, Mental Health services, and Calendar integration is ready to use.
          </p>
        </div>
      </div>
    </div>
  )
}
