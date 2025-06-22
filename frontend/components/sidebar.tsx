'use client'

import { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase } from '@/lib/api-client'

type ActiveView = 'kbs' | 'settings'

interface SidebarProps {
  projectId: string | null
  onSelectKb: (kb: KnowledgeBase) => void
  onSelectView: (view: ActiveView) => void
}

export function Sidebar({ projectId, onSelectKb, onSelectView }: SidebarProps) {
  const [kbs, setKbs] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      loadKnowledgeBases(projectId)
    } else {
      setKbs([])
    }
  }, [projectId])

  const loadKnowledgeBases = async (pId: string) => {
    setIsLoading(true)
    try {
      const kbData = await apiClient.getKnowledgeBases(pId)
      setKbs(kbData)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setKbs([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (kb: KnowledgeBase) => {
    setSelectedKbId(kb.id)
    onSelectKb(kb)
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-white p-4 dark:bg-black dark:border-gray-800">
      <nav className="space-y-1">
        <h3 className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider mb-2">
          Knowledge Bases
        </h3>
        {isLoading && <div className="text-sm text-gray-500">Loading KBs...</div>}
        {kbs.map(kb => (
          <button
            key={kb.id}
            onClick={() => handleSelect(kb)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedKbId === kb.id
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
            }`}
          >
            {kb.name}
          </button>
        ))}
        <button
          onClick={() => onSelectView('kbs')}
          className="w-full text-left mt-2 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
        >
          + Manage KBs
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