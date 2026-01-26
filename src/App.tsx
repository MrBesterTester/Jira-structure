import { useEffect, useState } from 'react'
import './App.css'
import { IssueType, IssueStatus, Priority } from './types'
import { 
  useProjectStore, 
  useIssueStore, 
  useSprintStore, 
  useUserStore,
  useUIStore,
  initializeStores 
} from './store'

function App() {
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  // Subscribe to stores
  const projects = useProjectStore(state => state.projects)
  const currentProject = useProjectStore(state => state.getCurrentProject())
  const projectLoading = useProjectStore(state => state.loading)
  
  const issues = useIssueStore(state => state.issues)
  const issueLoading = useIssueStore(state => state.loading)
  const getRootIssues = useIssueStore(state => state.getRootIssues)
  
  const sprints = useSprintStore(state => state.sprints)
  const getActiveSprint = useSprintStore(state => state.getActiveSprint)
  
  const users = useUserStore(state => state.users)
  
  const currentView = useUIStore(state => state.currentView)
  const setView = useUIStore(state => state.setView)

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

  // Demonstrate that types are importable and usable
  const issueTypes = Object.values(IssueType)
  const statuses = Object.values(IssueStatus)
  const priorities = Object.values(Priority)

  const isLoading = projectLoading || issueLoading

  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Initializing stores...</p>
        </div>
      </div>
    )
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center bg-red-50 p-6 rounded-lg border border-red-200">
          <h2 className="text-xl font-bold text-red-700 mb-2">Initialization Error</h2>
          <p className="text-red-600">{initError}</p>
          <p className="text-sm text-gray-500 mt-4">
            Make sure the API server is running (npm run dev:server)
          </p>
        </div>
      </div>
    )
  }

  const rootIssues = getRootIssues()
  const activeSprint = getActiveSprint()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Jira Structure Learning Tool
          </h1>
          <p className="text-lg text-gray-600">
            State Management Test - Phase 2, Step 2.1
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setView('tree')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'tree'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Tree View
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentView === 'kanban'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Kanban View
          </button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-center mb-4">
            <span className="text-blue-600">Loading...</span>
          </div>
        )}

        {/* Data Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Projects Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
            <p className="text-3xl font-bold text-blue-600">{projects.length}</p>
            {currentProject && (
              <p className="text-sm text-gray-500 mt-2">
                Active: {currentProject.name} ({currentProject.key})
              </p>
            )}
          </div>

          {/* Issues Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Issues</h3>
            <p className="text-3xl font-bold text-green-600">{issues.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              Root Issues: {rootIssues.length}
            </p>
          </div>

          {/* Sprints Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Sprints</h3>
            <p className="text-3xl font-bold text-purple-600">{sprints.length}</p>
            {activeSprint && (
              <p className="text-sm text-gray-500 mt-2">
                Active: {activeSprint.name}
              </p>
            )}
          </div>

          {/* Users Card */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Members</h3>
            <p className="text-3xl font-bold text-orange-600">{users.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              {users.slice(0, 3).map(u => u.displayName.split(' ')[0]).join(', ')}
              {users.length > 3 && '...'}
            </p>
          </div>
        </div>

        {/* Current View Indicator */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Current View: <span className="text-blue-600 capitalize">{currentView}</span>
          </h3>
          <p className="text-gray-600">
            View toggle is working! The UI Store is managing the current view state.
          </p>
        </div>

        {/* Types Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">TypeScript Types Loaded</h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Issue Types:</span> {issueTypes.join(', ')}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Statuses:</span> {statuses.join(', ')}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Priorities:</span> {priorities.join(', ')}
            </p>
          </div>
        </div>

        {/* Sample Issues List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sample Issues (First 10 Root Issues)
          </h3>
          {rootIssues.length === 0 ? (
            <p className="text-gray-500">No root issues found.</p>
          ) : (
            <div className="space-y-2">
              {rootIssues.slice(0, 10).map(issue => (
                <div 
                  key={issue.id} 
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-xs font-mono bg-gray-200 px-2 py-1 rounded">
                    {issue.key}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    issue.type === IssueType.Initiative ? 'bg-purple-100 text-purple-700' :
                    issue.type === IssueType.Epic ? 'bg-blue-100 text-blue-700' :
                    issue.type === IssueType.Bug ? 'bg-red-100 text-red-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {issue.type}
                  </span>
                  <span className="flex-1 text-gray-900">{issue.title}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    issue.status === IssueStatus.Done ? 'bg-green-100 text-green-700' :
                    issue.status === IssueStatus.InProgress ? 'bg-blue-100 text-blue-700' :
                    issue.status === IssueStatus.InReview ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {issue.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>State Management with Zustand - All stores operational</p>
        </div>
      </div>
    </div>
  )
}

export default App
