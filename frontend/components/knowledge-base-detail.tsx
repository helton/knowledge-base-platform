'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase, KnowledgeBaseVersion, Document } from '@/lib/api-client'
import { ArrowLeft, FileText, GitBranch, Plus, Settings } from 'lucide-react'

interface KnowledgeBaseDetailProps {
  kb: KnowledgeBase
  onViewDocuments: () => void
  onViewVersions: () => void
  onBack: () => void
}

export function KnowledgeBaseDetail({ kb, onViewDocuments, onViewVersions, onBack }: KnowledgeBaseDetailProps) {
  const [kbVersions, setKbVersions] = useState<KnowledgeBaseVersion[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadKbData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [versions, docs] = await Promise.all([
          apiClient.getKnowledgeBaseVersions(kb.id),
          apiClient.getDocumentsByKb(kb.id)
        ])
        setKbVersions(versions)
        setDocuments(docs)
      } catch (error) {
        console.error('Failed to load KB data:', error)
        setError('Failed to load KB data. Please check if the backend is running.')
      } finally {
        setIsLoading(false)
      }
    }

    loadKbData()
  }, [kb.id])

  const primaryVersion = kbVersions.find(v => v.is_primary)
  const publishedVersions = kbVersions.filter(v => v.status === 'published')
  const draftVersions = kbVersions.filter(v => v.status === 'draft')

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {kb.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Knowledge Base Details
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onViewDocuments}
            className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Manage Documents
          </button>
          <button
            onClick={onViewVersions}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <GitBranch className="h-4 w-4" />
            Manage Versions
          </button>
        </div>
      </div>

      {/* KB Description */}
      {kb.description && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-700 dark:text-gray-300">{kb.description}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {documents.length}
              </p>
            </div>
            <FileText className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">KB Versions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {kbVersions.length}
              </p>
            </div>
            <GitBranch className="h-8 w-8 text-gray-600 dark:text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary Version</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {primaryVersion ? primaryVersion.version_number : 'None'}
              </p>
            </div>
            <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">★</span>
            </div>
          </div>
        </div>
      </div>

      {/* Version Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Version Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Published</span>
              <span className="font-semibold text-green-600">{publishedVersions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Draft</span>
              <span className="font-semibold text-yellow-600">{draftVersions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Archived</span>
              <span className="font-semibold text-gray-600">
                {kbVersions.length - publishedVersions.length - draftVersions.length}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            Latest Activity
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {kbVersions.length > 0 ? (
              <div>
                <p>Latest version: {kbVersions[0].version_number}</p>
                <p>Created: {new Date(kbVersions[0].created_at).toLocaleDateString()}</p>
              </div>
            ) : (
              <p>No versions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 