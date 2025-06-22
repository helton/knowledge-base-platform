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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newKbName, setNewKbName] = useState('')
  const [newKbDescription, setNewKbDescription] = useState('')
  const [newKbAccessLevel, setNewKbAccessLevel] = useState<'private' | 'protected' | 'public'>('private')

  useEffect(() => {
    loadKnowledgeBases()
  }, [projectId])

  const loadKnowledgeBases = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Loading knowledge bases for project:', projectId)
      const kbs = await apiClient.getKnowledgeBases(projectId)
      console.log('Knowledge bases loaded:', kbs)
      setKnowledgeBases(kbs)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setError('Failed to load knowledge bases. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateKnowledgeBase = async () => {
    if (!newKbName.trim()) return

    try {
      const newKb = await apiClient.createKnowledgeBase(
        projectId,
        newKbName.trim(),
        newKbDescription.trim(),
        newKbAccessLevel
      )
      setKnowledgeBases([...knowledgeBases, newKb])
      setNewKbName('')
      setNewKbDescription('')
      setNewKbAccessLevel('private')
      setShowCreateForm(false)
      onKbSelect(newKb)
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      alert('Failed to create knowledge base. Please try again.')
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
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Create Knowledge Base</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white dark:bg-openai-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Create New Knowledge Base</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="kb-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                id="kb-name"
                type="text"
                value={newKbName}
                onChange={(e) => setNewKbName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter knowledge base name"
              />
            </div>
            <div>
              <label htmlFor="kb-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="kb-description"
                value={newKbDescription}
                onChange={(e) => setNewKbDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter description (optional)"
              />
            </div>
            <div>
              <label htmlFor="kb-access" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Access Level
              </label>
              <select
                id="kb-access"
                value={newKbAccessLevel}
                onChange={(e) => setNewKbAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              >
                <option value="private">Private</option>
                <option value="protected">Protected</option>
                <option value="public">Public</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCreateKnowledgeBase}
                disabled={!newKbName.trim()}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Knowledge Base
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setNewKbName('')
                  setNewKbDescription('')
                  setNewKbAccessLevel('private')
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {knowledgeBases.length === 0 ? (
        <div className="bg-white dark:bg-openai-dark-light border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <div className="mx-auto h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Knowledge Bases</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Get started by creating your first knowledge base to organize your documents and data.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Create Knowledge Base
          </button>
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
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">{kb.description}</p>
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