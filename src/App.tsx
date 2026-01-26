import './App.css'
import { IssueType, IssueStatus, Priority } from './types'

function App() {
  // Demonstrate that types are importable and usable
  const issueTypes = Object.values(IssueType)
  const statuses = Object.values(IssueStatus)
  const priorities = Object.values(Priority)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Jira Structure Learning Tool
        </h1>
        <p className="text-lg text-gray-600">
          React + TypeScript + Vite + Tailwind CSS
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Project initialized successfully!
        </p>
        <div className="mt-6 text-left inline-block">
          <p className="text-sm font-semibold text-gray-700 mb-2">Types Loaded:</p>
          <p className="text-xs text-gray-500">
            Issue Types: {issueTypes.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            Statuses: {statuses.join(', ')}
          </p>
          <p className="text-xs text-gray-500">
            Priorities: {priorities.join(', ')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
