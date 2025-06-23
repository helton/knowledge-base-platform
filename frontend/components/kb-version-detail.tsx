'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, KnowledgeBaseVersion, Document, DocumentVersion } from '@/lib/api-client'
import { ArrowLeft, FileText, GitBranch, Calendar, User, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface KbVersionDetailProps {
  kbVersion: KnowledgeBaseVersion
  onBack: () => void
}

type DocumentWithVersion = {
  document: Document
  documentVersion: DocumentVersion
}

export function KbVersionDetail({ kbVersion, onBack }: KbVersionDetailProps) {
  const [documentsWithVersions, setDocumentsWithVersions] = useState<DocumentWithVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVersionDetails()
  }, [kbVersion.id])

  const loadVersionDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Use the document_version_ids from the kbVersion prop
      const docsWithVersions: DocumentWithVersion[] = await Promise.all(
        kbVersion.document_version_ids.map(async (versionId) => {
          const documentVersion = await apiClient.getDocumentVersion(versionId)
          const document = await apiClient.getDocument(documentVersion.document_id)
          return { document, documentVersion }
        })
      )
      setDocumentsWithVersions(docsWithVersions)
    } catch (error) {
      console.error('Failed to load version details:', error)
      setError('Failed to load version details. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
      case 'archived':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
              {kbVersion.version_number}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Knowledge Base Version Details
            </p>
          </div>
        </div>
      </div>

      {/* Version Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(kbVersion.status)}`}>
                {kbVersion.status}
              </span>
            </div>
            {kbVersion.status === 'published' && <CheckCircle className="h-6 w-6 text-green-500" />}
            {kbVersion.status === 'draft' && <Clock className="h-6 w-6 text-yellow-500" />}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Access Level</p>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAccessLevelColor(kbVersion.access_level)}`}>
                {kbVersion.access_level}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {kbVersion.is_primary ? 'Yes' : 'No'}
              </p>
            </div>
            {kbVersion.is_primary && (
              <div className="h-8 w-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 dark:text-yellow-400 text-sm font-bold">★</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {documentsWithVersions.length}
              </p>
            </div>
            <FileText className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Version Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Version Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Created:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {new Date(kbVersion.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Created by:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {kbVersion.created_by || 'Unknown'}
              </span>
            </div>
            {kbVersion.updated_at && (
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Updated:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(kbVersion.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Release Notes
          </h3>
          {kbVersion.release_notes ? (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {kbVersion.release_notes}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No release notes provided
            </p>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Included Documents ({documentsWithVersions.length})
          </h3>
        </div>
        
        {documentsWithVersions.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No documents included in this version</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {documentsWithVersions.map(({ document, documentVersion }) => (
              <div key={`${document.id}-${documentVersion.id}`} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {document.name}
                      </h4>
                      {documentVersion.is_archived && (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-medium">Archived</span>
                        </div>
                      )}
                    </div>
                    
                    {document.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {document.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Version: {documentVersion.version_number}</span>
                      <span>Status: {documentVersion.processing_status}</span>
                      <span>Added: {new Date(documentVersion.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 