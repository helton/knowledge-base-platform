'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, Document, DocumentVersion } from '@/lib/api-client'
import { History, Pencil, X } from 'lucide-react'

interface DocumentsProps {
  kbId: string
}

export function Documents({ kbId }: DocumentsProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Upload form state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  
  // Version management state
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showVersionForm, setShowVersionForm] = useState(false)
  const [documentVersions, setDocumentVersions] = useState<DocumentVersion[]>([])
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)
  const [changeDescription, setChangeDescription] = useState('')
  const [uploadingVersion, setUploadingVersion] = useState(false)
  
  // Archive modal state
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [archiveReason, setArchiveReason] = useState('')
  
  // Edit description modal state
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false)
  const [editingDescription, setEditingDescription] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [kbId])

  const loadDocuments = async () => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('Loading documents for KB:', kbId)
      const docs = await apiClient.getDocumentsByKb(kbId)
      console.log('Documents loaded:', docs)
      
      // Manually enrich documents with version info until backend is fixed
      for (const doc of docs) {
        const versions = await apiClient.getDocumentVersions(doc.id);
        doc.version_count = versions.length;
        if (versions.length > 0) {
            // Handle version numbers like "v3" by extracting the numeric part
            const versionNumbers = versions.map(v => {
                const versionStr = v.version_number;
                // Extract numeric part from strings like "v3" or "3"
                const match = versionStr.match(/\d+/);
                return match ? parseInt(match[0], 10) : 0;
            });
            doc.latest_version_number = Math.max(...versionNumbers);
        } else {
            doc.latest_version_number = 0;
        }
      }
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

  const handleArchiveVersion = async () => {
    if (!selectedVersion || !selectedDocument) return

    try {
      const success = await apiClient.archiveDocumentVersionWithReason(
        selectedDocument.id,
        selectedVersion.id,
        archiveReason.trim()
      )

      if (success) {
        await loadDocumentVersions(selectedDocument.id)
        setShowArchiveModal(false)
        setSelectedVersion(null)
        setArchiveReason('')
      } else {
        alert('Failed to archive version. Please try again.')
      }
    } catch (error) {
      console.error('Failed to archive version:', error)
      alert('Failed to archive version. Please try again.')
    }
  }

  const handleUpdateDescription = async () => {
    if (!selectedDocument) return;

    try {
      const updatedDoc = await apiClient.updateDocumentDescription(selectedDocument.id, editingDescription);
      // Update the document in the list
      setDocuments(documents.map(d => d.id === updatedDoc.id ? updatedDoc : d));
      setShowEditDescriptionModal(false);
      setSelectedDocument(null);
      setEditingDescription('');
    } catch (error) {
      console.error('Failed to update description:', error);
      alert('Failed to update description. Please try again.');
    }
  };

  const openVersionModal = async (doc: Document) => {
    setSelectedDocument(doc)
    await loadDocumentVersions(doc.id)
    setShowVersionModal(true)
  }

  const openEditDescriptionModal = (doc: Document) => {
    setSelectedDocument(doc);
    setEditingDescription(doc.description || '');
    setShowEditDescriptionModal(true);
  };

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
      case 'archived':
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
      case 'pending':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'failed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'archived':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400 mb-4">{error}</div>
        <button
          onClick={loadDocuments}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage documents in this knowledge base
          </p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="btn-primary px-4 py-2 rounded-lg transition-colors"
        >
          Upload Document
        </button>
      </div>

      {/* Documents List */}
      <div className="grid gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {doc.name}
                </h3>
                {doc.description && (
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {doc.description}
                  </p>
                )}
                
                {/* Document metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>{doc.mime_type}</span>
                  <span>{doc.chunk_count} chunks</span>
                  <span>{doc.version_count || 0} versions</span>
                  {doc.latest_version_number && doc.latest_version_number > 0 && (
                    <span>Latest: v{doc.latest_version_number}</span>
                  )}
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openVersionModal(doc)}
                  className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  title="View versions"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => openEditDescriptionModal(doc)}
                  className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                  title="Edit description"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Status and tags at bottom */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                  {getStatusIcon(doc.status)}
                  <span className="ml-1">{doc.status}</span>
                </span>
                {doc.processing_progress && doc.processing_progress > 0 && doc.processing_progress < 1 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {Math.round(doc.processing_progress * 100)}%
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(doc.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  placeholder="Document name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description (optional)</label>
                <textarea
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  placeholder="Document description"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !selectedFile || !documentName.trim()}
                className="btn-primary px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Modal */}
      {showVersionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Versions: {selectedDocument.name}</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowVersionForm(true)}
                  className="btn-primary px-3 py-1 rounded text-sm"
                >
                  Upload New Version
                </button>
                <button
                  onClick={() => setShowVersionModal(false)}
                  className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Versions List */}
            <div className="space-y-3">
              {documentVersions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 rounded-lg border ${
                    version.is_archived ? 'bg-gray-50 dark:bg-gray-800/30 border-gray-200 dark:border-gray-700' : 'bg-white dark:bg-gray-800/60 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Version {version.version_number}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(version.status)}`}>
                          {getStatusIcon(version.status)}
                          <span className="ml-1">{version.status}</span>
                        </span>
                      </div>
                      
                      {version.change_description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {version.change_description}
                        </p>
                      )}
                      
                      {/* Version metadata */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                        <span>{version.chunk_count} chunks</span>
                        <span>{version.embedding_count || 0} embeddings</span>
                        {version.file_size && <span>{formatFileSize(version.file_size)}</span>}
                        <span>{new Date(version.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex items-center space-x-1">
                      {!version.is_archived && (
                        <button
                          onClick={() => {
                            setSelectedVersion(version)
                            setShowArchiveModal(true)
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                          title="Archive version"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Tags at bottom */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {version.chunking_method}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {version.embedding_provider}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {version.embedding_model}
                      </span>
                    </div>
                    
                    {version.is_archived && version.archive_reason && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Reason: {version.archive_reason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upload Version Form */}
      {showVersionForm && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Upload New Version</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">File</label>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Change Description (optional)</label>
                <textarea
                  value={changeDescription}
                  onChange={(e) => setChangeDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  placeholder="What changed in this version?"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowVersionForm(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleVersionUpload}
                disabled={uploadingVersion || !selectedFile}
                className="btn-primary px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50"
              >
                {uploadingVersion ? 'Uploading...' : 'Upload Version'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Version Modal */}
      {showArchiveModal && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Archive Version {selectedVersion.version_number}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Archive Reason</label>
                <textarea
                  value={archiveReason}
                  onChange={(e) => setArchiveReason(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  placeholder="Explain why this version is being archived"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveVersion}
                disabled={!archiveReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                Archive Version
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditDescriptionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Description</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={editingDescription}
                  onChange={(e) => setEditingDescription(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700"
                  placeholder="Document description"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditDescriptionModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDescription}
                className="btn-primary px-4 py-2 rounded hover:bg-primary/90"
              >
                Update Description
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 