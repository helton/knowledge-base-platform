'use client'

import { useState, useEffect } from 'react'
import { apiClient, Document, DocumentVersion } from '@/lib/api-client'

interface DocumentsProps {
  kbId: string
}

export function Documents({ kbId }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  
  // Version management
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [showVersionForm, setShowVersionForm] = useState(false)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showDeprecateModal, setShowDeprecateModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)
  const [changeDescription, setChangeDescription] = useState('')
  const [deprecationReason, setDeprecationReason] = useState('')
  const [uploadingVersion, setUploadingVersion] = useState(false)
  const [processingDocuments, setProcessingDocuments] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadDocuments()
  }, [kbId])

  // Poll for status updates on processing documents
  useEffect(() => {
    const processingDocs = documents.filter(doc => doc.status === 'processing' || doc.status === 'pending')
    setProcessingDocuments(new Set(processingDocs.map(doc => doc.id)))

    if (processingDocs.length === 0) return

    const interval = setInterval(async () => {
      try {
        // Reload documents to get updated status
        await loadDocuments()
        
        // Check if any documents are still processing
        const currentDocs = await apiClient.getDocumentsByKb(kbId)
        const stillProcessing = currentDocs.filter(doc => doc.status === 'processing' || doc.status === 'pending')
        
        if (stillProcessing.length === 0) {
          setProcessingDocuments(new Set())
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling for status updates:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [documents, kbId])

  const loadDocuments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Loading documents for KB:', kbId)
      const docs = await apiClient.getDocumentsByKb(kbId)
      console.log('Documents loaded:', docs)
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setError('Failed to load documents. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const loadDocumentVersions = async (docId: string) => {
    try {
      const versions = await apiClient.getDocumentVersions(docId)
      setDocumentVersions(versions)
    } catch (error) {
      console.error('Failed to load document versions:', error)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!documentName) {
        setDocumentName(file.name)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim()) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', documentName.trim())
      if (documentDescription.trim()) {
        formData.append('description', documentDescription.trim())
      }

      const response = await fetch(`http://localhost:8000/api/knowledge-bases/${kbId}/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Upload result:', result)

      await loadDocuments()
      
      setSelectedFile(null)
      setDocumentName('')
      setDocumentDescription('')
      setShowUploadForm(false)
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleVersionUpload = async () => {
    if (!selectedFile || !selectedDocument) return

    setUploadingVersion(true)
    try {
      const result = await apiClient.createDocumentVersion(
        selectedDocument.id,
        selectedFile,
        changeDescription.trim() || undefined
      )

      console.log('Version upload result:', result)
      
      // Reload versions
      await loadDocumentVersions(selectedDocument.id)
      
      // Reset form
      setSelectedFile(null)
      setChangeDescription('')
      setShowVersionForm(false)
    } catch (error) {
      console.error('Failed to upload version:', error)
      alert('Failed to upload version. Please try again.')
    } finally {
      setUploadingVersion(false)
    }
  }

  const handleDeprecateVersion = async () => {
    if (!selectedVersion || !selectedDocument) return

    try {
      const success = await apiClient.deprecateDocumentVersionWithReason(
        selectedDocument.id,
        selectedVersion.id,
        deprecationReason.trim()
      )

      if (success) {
        await loadDocumentVersions(selectedDocument.id)
        setShowDeprecateModal(false)
        setSelectedVersion(null)
        setDeprecationReason('')
      } else {
        alert('Failed to deprecate version. Please try again.')
      }
    } catch (error) {
      console.error('Failed to deprecate version:', error)
      alert('Failed to deprecate version. Please try again.')
    }
  }

  const openVersionModal = async (doc: Document) => {
    setSelectedDocument(doc)
    await loadDocumentVersions(doc.id)
    setShowVersionModal(true)
  }

  // Poll for version status updates when modal is open
  useEffect(() => {
    if (!showVersionModal || !selectedDocument) return

    const processingVersions = documentVersions.filter(v => v.status === 'processing' || v.status === 'pending')
    if (processingVersions.length === 0) return

    const interval = setInterval(async () => {
      try {
        await loadDocumentVersions(selectedDocument.id)
        
        // Check if any versions are still processing
        const currentVersions = await apiClient.getDocumentVersions(selectedDocument.id)
        const stillProcessing = currentVersions.filter(v => v.status === 'processing' || v.status === 'pending')
        
        if (stillProcessing.length === 0) {
          clearInterval(interval)
        }
      } catch (error) {
        console.error('Error polling for version status updates:', error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(interval)
  }, [showVersionModal, selectedDocument, documentVersions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
      case 'processing':
      case 'pending':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
      case 'deprecated':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'processing':
        return (
          <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Documents</h1>
        <button
          onClick={() => setShowUploadForm(!showUploadForm)}
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          {showUploadForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {showUploadForm && (
        <div className="bg-white dark:bg-openai-dark-light rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Upload New Document</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="document-file" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                File *
              </label>
              <input
                id="document-file"
                type="file"
                onChange={handleFileSelect}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                accept=".pdf,.txt,.doc,.docx,.md"
              />
              {selectedFile && (
                <p className="mt-1 text-sm text-gray-500">
                  Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>
            <div>
              <label htmlFor="document-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name *
              </label>
              <input
                id="document-name"
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter document name"
              />
            </div>
            <div>
              <label htmlFor="document-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="document-description"
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="Enter description (optional)"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleUpload}
                disabled={!selectedFile || !documentName.trim() || uploading}
                className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
              </button>
              <button
                onClick={() => {
                  setShowUploadForm(false)
                  setSelectedFile(null)
                  setDocumentName('')
                  setDocumentDescription('')
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-openai-dark-light rounded-lg shadow-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Document List</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading documents...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : documents.length > 0 ? (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {documents.map(doc => (
              <li key={doc.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">{doc.name}</h4>
                      {doc.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doc.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{doc.mime_type}</span>
                        <span>{formatFileSize(doc.file_size)}</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>Created: {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(doc.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                      {processingDocuments.has(doc.id) && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 animate-pulse">
                          Updating...
                        </span>
                      )}
                    </div>
                    {doc.processing_progress !== undefined && doc.status === 'processing' && (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${doc.processing_progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{doc.processing_progress}%</span>
                      </div>
                    )}
                    {doc.error_message && (
                      <div className="text-xs text-red-600 dark:text-red-400 max-w-xs truncate" title={doc.error_message}>
                        {doc.error_message}
                      </div>
                    )}
                    <button
                      onClick={() => openVersionModal(doc)}
                      className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Versions
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="mx-auto h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Documents</h3>
            <p>Upload your first document to start building your knowledge base.</p>
          </div>
        )}
      </div>

      {/* Version Modal */}
      {showVersionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-openai-dark-light rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto border dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Document Versions: {selectedDocument.name}
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowVersionForm(true)}
                  disabled={showVersionForm}
                  className="px-3 py-1 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload New Version
                </button>
                <button
                  onClick={() => {
                    setShowVersionModal(false)
                    setSelectedDocument(null)
                    setDocumentVersions([])
                    setShowVersionForm(false)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Upload New Version Form */}
            {showVersionForm && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Upload New Version</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      File *
                    </label>
                    <input
                      type="file"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      accept=".pdf,.txt,.doc,.docx,.md"
                    />
                    {selectedFile && (
                      <p className="mt-1 text-sm text-gray-500">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Change Description (optional)
                    </label>
                    <textarea
                      value={changeDescription}
                      onChange={(e) => setChangeDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      placeholder="Describe what changed in this version"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleVersionUpload}
                      disabled={!selectedFile || uploadingVersion}
                      className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {uploadingVersion && (
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      <span>{uploadingVersion ? 'Uploading...' : 'Upload Version'}</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowVersionForm(false)
                        setSelectedFile(null)
                        setChangeDescription('')
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Versions List */}
            <div className="space-y-4">
              {documentVersions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No versions found for this document.</p>
                  <p className="text-sm mt-2">Upload the first version to get started.</p>
                </div>
              ) : (
                documentVersions.map((version) => (
                  <div
                    key={version.id}
                    className={`border rounded-lg p-4 ${
                      version.is_deprecated ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                              {version.version_number}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              Version {version.version_number}
                            </h4>
                            {version.is_deprecated && (
                              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 rounded-full">
                                Deprecated
                              </span>
                            )}
                          </div>
                          {version.change_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{version.change_description}</p>
                          )}
                          {version.deprecation_reason && (
                            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                              <strong>Deprecation reason:</strong> {version.deprecation_reason}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{version.chunk_count} chunks</span>
                            <span>Created: {new Date(version.created_at).toLocaleDateString()}</span>
                            {version.file_size && <span>{formatFileSize(version.file_size)}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(version.status)}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(version.status)}`}>
                            {version.status}
                          </span>
                        </div>
                        {!version.is_deprecated && (
                          <button
                            onClick={() => {
                              setSelectedVersion(version)
                              setShowDeprecateModal(true)
                            }}
                            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                          >
                            Deprecate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Deprecate Version Modal */}
      {showDeprecateModal && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-openai-dark-light rounded-lg p-6 w-full max-w-md border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Deprecate Version {selectedVersion.version_number}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Deprecation *
                </label>
                <textarea
                  value={deprecationReason}
                  onChange={(e) => setDeprecationReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="Explain why this version is being deprecated"
                />
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleDeprecateVersion}
                  disabled={!deprecationReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deprecate Version
                </button>
                <button
                  onClick={() => {
                    setShowDeprecateModal(false)
                    setSelectedVersion(null)
                    setDeprecationReason('')
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 