'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase, KnowledgeBaseVersion, Document } from '@/lib/api-client'
import { Plus, FileText, GitBranch, Star } from 'lucide-react'

interface KnowledgeBasesProps {
  projectId: string
  onSelectView: (view: 'kbs' | 'documents' | 'settings' | 'create_kb' | 'document_versions' | 'kb_versions' | 'kb_detail' | 'kb_version_detail' | 'create_kb_version') => void
  onKbSelect: (kb: KnowledgeBase) => void
}

// Extended type for KB with counts
type KnowledgeBaseWithCounts = KnowledgeBase & {
  documentCount?: number
  versionCount?: number
  primaryVersion?: string
}

export function KnowledgeBases({ projectId, onSelectView, onKbSelect }: KnowledgeBasesProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseWithCounts[]>([])
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
      
      // Load counts for each KB
      const kbsWithCounts = await Promise.all(
        kbs.map(async (kb) => {
          try {
            const [documents, versions] = await Promise.all([
              apiClient.getDocumentsByKb(kb.id),
              apiClient.getKnowledgeBaseVersions(kb.id)
            ])
            
            const primaryVersion = versions.find(v => v.is_primary)
            
            return {
              ...kb,
              documentCount: documents.length,
              versionCount: versions.length,
              primaryVersion: primaryVersion?.version_number || 'None'
            }
          } catch (error) {
            console.error(`Failed to load counts for KB ${kb.id}:`, error)
            return {
              ...kb,
              documentCount: 0,
              versionCount: 0,
              primaryVersion: 'None'
            }
          }
        })
      )
      
      setKnowledgeBases(kbsWithCounts)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setError('Failed to load knowledge bases. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKbClick = (kb: KnowledgeBase) => {
    onKbSelect(kb)
    onSelectView('kb_detail')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Knowledge Bases
        </h1>
        <button
          onClick={() => onSelectView('create_kb')}
          className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Knowledge Base
        </button>
      </div>

      {knowledgeBases.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No Knowledge Bases
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first knowledge base to get started.
            </p>
            <button
              onClick={() => onSelectView('create_kb')}
              className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Create Knowledge Base
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {knowledgeBases.map((kb) => (
            <div
              key={kb.id}
              onClick={() => handleKbClick(kb)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {kb.name}
                </h3>
                {kb.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {kb.description}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {kb.documentCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <GitBranch className="h-4 w-4" />
                    <span>Versions</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {kb.versionCount || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Star className="h-4 w-4" />
                    <span>Primary</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {kb.primaryVersion}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Click to view details
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 