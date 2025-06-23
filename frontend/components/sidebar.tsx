'use client'

import { apiClient, KnowledgeBase } from '@/lib/api-client'
import { Dispatch, SetStateAction } from 'react'

type ActiveView = 'kbs' | 'documents' | 'settings' | 'create_kb'

interface SidebarProps {
  projectId: string | null
  onSelectKb: (kb: KnowledgeBase) => void
  onSelectView: Dispatch<SetStateAction<ActiveView>>
}

export function Sidebar({ projectId, onSelectView }: SidebarProps) {
  const handleListKbs = () => {
    onSelectView('kbs')
  }

  const handleCreateKbClick = () => {
    onSelectView('create_kb')
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-4 dark:bg-black dark:border-gray-800">
      <nav className="space-y-1">
        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
          Knowledge Bases
        </h3>
        <button
          onClick={handleListKbs}
          disabled={!projectId}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          List Knowledge Bases
        </button>
        <button
          onClick={handleCreateKbClick}
          disabled={!projectId}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Knowledge Base
        </button>
        
        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider pt-4 mb-2">
          General
        </h3>
        <button
          onClick={() => onSelectView('settings')}
          className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          Settings
        </button>
      </nav>
    </aside>
  )
} 