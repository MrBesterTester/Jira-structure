import { useEffect, useState } from 'react'
import './App.css'
import { AppShell, ErrorBoundary, ToastContainer, KeyboardShortcutsModal } from './components'
import { initializeStores } from './store'

function App() {
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Initialize stores on mount
  useEffect(() => {
    async function init() {
      const result = await initializeStores()
      if (!result.success) {
        setInitError(result.errors.join(', '))
      }
      setInitialized(true)
    }
    init()
  }, [])

  // Loading state
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Jira Structure...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (initError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200 max-w-md">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold text-red-700 mb-2">Initialization Error</h2>
          <p className="text-red-600">{initError}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the API server is running:
          </p>
          <code className="block mt-2 text-sm bg-gray-100 p-2 rounded text-gray-700">
            npm run dev:server
          </code>
        </div>
      </div>
    )
  }

  // Main application
  return (
    <ErrorBoundary>
      <AppShell />
      <ToastContainer />
      <KeyboardShortcutsModal />
    </ErrorBoundary>
  )
}

export default App
