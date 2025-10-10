
export const DiagnosticPage = () => {
  console.log('DiagnosticPage rendering...')
  
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Diagnostic Page</h1>
        <p className="text-gray-600">If you can see this, React is working!</p>
        <div className="mt-4">
          <p>Current URL: {window.location.href}</p>
          <p>Current Time: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  )
}
