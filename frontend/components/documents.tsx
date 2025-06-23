'use client'

import React, { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { apiClient, Document, DocumentVersion } from '@/lib/api-client'
import {
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit,
  File as FileIcon,
  FileText,
  Globe,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from 'lucide-react'

// Extend the Document type for local state management
type DocumentWithVersionInfo = Document & {
  version_count?: number
  latest_version_number?: number
  versions?: DocumentVersion[]
  active_versions_count?: number
  archived_versions_count?: number
}

interface DocumentsProps {
  selectedKb: { id: string; name: string } | null
  onDocumentSelect: (document: Document) => void
  onViewVersions?: () => void
}

export function Documents({ selectedKb, onDocumentSelect, onViewVersions }: DocumentsProps) {
  const [documents, setDocuments] = useState<DocumentWithVersionInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals and their state
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false)

  // Data for modals
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVersionInfo | null>(null)

  // Form fields
  const [addDocTab, setAddDocTab] = useState<'upload' | 'url'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  const [uploading, setUploading] = useState(false)

  const loadDocuments = useCallback(async () => {
    if (!selectedKb) {
      setDocuments([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const docs = await apiClient.getDocumentsByKb(selectedKb.id)
      const docsWithVersionInfo: DocumentWithVersionInfo[] = await Promise.all(
        docs.map(async (doc) => {
          const versions = await apiClient.getDocumentVersions(doc.id)
          const versionNumbers = versions
            .filter(v => !v.is_archived)
            .map(
            (v) => parseInt(v.version_number.replace('v', ''), 10) || 0
          )
          return {
            ...doc,
            versions,
            version_count: versions.length,
            latest_version_number: versions.length > 0 ? Math.max(...versionNumbers) : 0,
            active_versions_count: versions.filter(v => !v.is_archived).length,
            archived_versions_count: versions.filter(v => v.is_archived).length,
          }
        })
      )
      setDocuments(docsWithVersionInfo)
    } catch (error) {
      console.error('Failed to load documents:', error)
      setError('Failed to load documents. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedKb])

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      if (!documentName) {
        setDocumentName(file.name)
      }
    }
  }
  
  const resetAddDocForm = () => {
    setShowAddDocModal(false);
    setDocumentName('');
    setDocumentDescription('');
    setSelectedFile(null);
    setSourceUrl('');
    setAddDocTab('upload');
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim() || !selectedKb) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('name', documentName.trim())
      if (documentDescription.trim()) {
        formData.append('description', documentDescription.trim())
      }

      const response = await fetch(
        `http://localhost:8000/api/knowledge-bases/${selectedKb.id}/documents/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`)

      await response.json()
      await loadDocuments()
      resetAddDocForm()
    } catch (error) {
      console.error('Failed to upload document:', error)
      alert('Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!sourceUrl.trim() || !selectedKb) return

    setUploading(true)
    try {
      await apiClient.createDocumentFromUrl(
        selectedKb.id,
        sourceUrl,
        documentName.trim() || undefined,
        documentDescription.trim() || undefined
      )
      await loadDocuments()
      resetAddDocForm()
    } catch (error) {
      console.error('Failed to create document from URL:', error)
      alert('Failed to create document from URL. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateDescription = async () => {
    if (!selectedDocument) return

    try {
      await apiClient.updateDocumentDescription(selectedDocument.id, editingDescription)
      await loadDocuments()
      setShowEditDescriptionModal(false)
      setEditingDescription('')
      setSelectedDocument(null)
    } catch (error) {
      console.error('Failed to update description:', error)
      alert('Failed to update description. Please try again.')
    }
  }

  const openEditDescriptionModal = (doc: DocumentWithVersionInfo) => {
    setSelectedDocument(doc)
    setEditingDescription(doc.description || '')
    setShowEditDescriptionModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!selectedKb) {
    return (
      <div className="flex flex-1 items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
        <div>
          <h3 className="text-2xl font-semibold">Select a Knowledge Base</h3>
          <p>Please select a knowledge base from the sidebar to view its documents.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-16 w-16 animate-spin text-gray-500" />
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
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Documents for <span className="text-gray-700 dark:text-gray-300">{selectedKb.name}</span>
        </h2>
        <div className="flex gap-2">
          {onViewVersions && (
            <button onClick={onViewVersions} className="btn btn-secondary">
              View Knowledge Base Versions
            </button>
          )}
          <button onClick={() => setShowAddDocModal(true)} className="btn btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Document
          </button>
        </div>
      </div>

      {!isLoading && documents.length === 0 ? (
        <div className="flex flex-1 items-center justify-center h-full rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex flex-col items-center gap-1 text-center text-gray-500 dark:text-gray-400">
            <FileText className="h-16 w-16 mb-4 text-gray-400 dark:text-gray-500" />
            <h3 className="text-2xl font-semibold mb-2">No Documents</h3>
            <p className="mb-4 max-w-md">
              Get started by adding your first document to this knowledge base.
            </p>
            <button onClick={() => setShowAddDocModal(true)} className="btn btn-primary">
              <Plus className="mr-2 h-4 w-4" /> Add Document
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-y-auto flex-grow space-y-4 pr-2">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {doc.name}
                  </h3>
                  {(doc.processing_status === 'pending' || doc.processing_status === 'processing') && (
                    <div className="flex items-center text-yellow-500 text-sm">
                      <Clock className="mr-2 h-4 w-4 animate-pulse" />
                      Pending
                    </div>
                  )}
                  {doc.processing_status === 'completed' && (
                    <div className="flex items-center text-green-500 text-sm">
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Completed
                    </div>
                  )}
                  {doc.processing_status === 'failed' && (
                    <div className="flex items-center text-red-500 text-sm">
                      <XCircle className="mr-2 h-4 w-4" />
                      Failed
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onDocumentSelect(doc)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    title="View versions"
                  >
                    <FileText className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openEditDescriptionModal(doc)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                    title="Edit description"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {doc.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{doc.description}</p>}
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                <span>{doc.active_versions_count} active version{doc.active_versions_count === 1 ? '' : 's'}</span>
                <span>{doc.archived_versions_count} archived version{doc.archived_versions_count === 1 ? '' : 's'}</span>
                {doc.latest_version_number && doc.latest_version_number > 0 ? (
                  <span>Latest: v{doc.latest_version_number}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODALS */}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Document</h3>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setAddDocTab('upload')}
                  className={`${
                    addDocTab === 'upload'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setAddDocTab('url')}
                  className={`${
                    addDocTab === 'url'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  From URL
                </button>
              </nav>
            </div>
            {addDocTab === 'upload' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">File</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-700/50">
                        <div className="space-y-1 text-center">
                           <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                           <div className="flex text-sm text-gray-600 dark:text-gray-400">
                              <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                 <span>Upload a file</span>
                                 <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-500">{selectedFile ? selectedFile.name : 'Any file type'}</p>
                        </div>
                     </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="input-field w-full"
                    placeholder="Document name (defaults to filename)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={documentDescription}
                    onChange={(e) => setDocumentDescription(e.target.value)}
                    className="input-field w-full"
                    placeholder="Document description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={resetAddDocForm} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleUpload} disabled={uploading || !selectedFile || !documentName.trim()} className="btn btn-primary">
                    {uploading ? 'Uploading...' : 'Upload'}
                  </button>
                </div>
              </div>
            )}
            {addDocTab === 'url' && (
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-2">URL</label><input type="url" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} className="input-field w-full" placeholder="https://example.com/document.pdf"/></div>
                <div><label className="block text-sm font-medium mb-2">Name (optional)</label><input type="text" value={documentName} onChange={(e) => setDocumentName(e.target.value)} className="input-field w-full" placeholder="Document name (defaults to URL)"/></div>
                <div><label className="block text-sm font-medium mb-2">Description (optional)</label><textarea value={documentDescription} onChange={(e) => setDocumentDescription(e.target.value)} className="input-field w-full" placeholder="Document description" rows={3}/></div>
                <div className="flex justify-end space-x-3 pt-4"><button onClick={() => setShowAddDocModal(false)} className="btn btn-secondary">Cancel</button><button onClick={handleUrlSubmit} disabled={uploading || !sourceUrl.trim()} className="btn btn-primary">{uploading ? 'Adding...' : 'Add Document'}</button></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditDescriptionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Description</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-2">Description</label><textarea value={editingDescription} onChange={(e) => setEditingDescription(e.target.value)} className="input-field w-full" placeholder="Document description" rows={4}/></div></div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowEditDescriptionModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleUpdateDescription} className="btn btn-primary">Update Description</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 