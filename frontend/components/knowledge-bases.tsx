'use client'

import { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase } from '@/lib/api-client'

interface KnowledgeBasesProps {
  projectId: string
  onKbSelect: (kb: KnowledgeBase) => void
}

export function KnowledgeBases({ projectId, onKbSelect }: KnowledgeBasesProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadKnowledgeBases()
  }, [projectId])

  const loadKnowledgeBases = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const kbs = await apiClient.getKnowledgeBases(projectId)
      setKnowledgeBases(kbs)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setError('Failed to load knowledge bases. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectKb = (kb: KnowledgeBase) => {
    onKbSelect(kb)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'archived':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getAccessLevelColor = (accessLevel: string) => {
    switch (accessLevel) {
      case 'private':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      case 'protected':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
      case 'public':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">📚 Knowledge Bases</h2>
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">📚 Knowledge Bases</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-medium text-red-900">Error Loading Knowledge Bases</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
          <button
            onClick={loadKnowledgeBases}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">📚 Knowledge Bases</h2>
      </div>

      {knowledgeBases.length === 0 ? (
        <div className="bg-white dark:bg-openai-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Knowledge Bases Found</h3>
          <p className="text-gray-600 dark:text-gray-400">This project doesn't have any knowledge bases yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => handleSelectKb(kb)}
              className="bg-white dark:bg-openai-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{kb.name}</h3>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(kb.status)}`}>
                    {kb.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAccessLevelColor(kb.access_level)}`}>
                    {kb.access_level}
                  </span>
                </div>
              </div>
              
              {kb.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                  {kb.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Created: {new Date(kb.created_at).toLocaleDateString()}</span>
                <span>Updated: {new Date(kb.updated_at).toLocaleDateString()}</span>
              </div>
              
              {kb.current_version && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Current Version: {kb.current_version}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 