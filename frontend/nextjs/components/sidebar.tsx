'use client'

interface SidebarProps {
  selectedProjectId: string | null
  selectedKbId: string | null
  onKbSelect: (kbId: string) => void
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Sidebar({ selectedProjectId, selectedKbId, onKbSelect, activeTab, onTabChange }: SidebarProps) {
  if (!selectedProjectId) {
    return null
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <nav className="space-y-1">
          {!selectedKbId ? (
            <>
              <button
                onClick={() => onTabChange('dashboard')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => onTabChange('knowledge-bases')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'knowledge-bases' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Knowledge Bases
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onTabChange('overview')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => onTabChange('documents')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'documents' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Documents
              </button>
              <button
                onClick={() => onTabChange('settings')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Settings
              </button>
            </>
          )}
        </nav>
      </div>
    </aside>
  )
} 