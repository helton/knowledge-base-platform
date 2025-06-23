'use client'

import { useState, useEffect } from 'react'
import { apiClient, Document, DocumentVersion } from '@/lib/api-client'
import {
  CheckCircle2,
  Clock,
  File as FileIcon,
  Globe,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
  XCircle,
  ArrowLeft,
  Archive,
  Inbox
} from 'lucide-react'

interface DocumentVersionsProps {
  document: Document
  onVersionSelect: (version: DocumentVersion | null) => void
  onBack: () => void
}

export function DocumentVersions({ document, onVersionSelect, onBack }: DocumentVersionsProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showArchived, setShowArchived] = useState(false)
  
  // Modal states
  const [showAddVersionModal, setShowAddVersionModal] = useState(false)
  const [showArchiveVersionModal, setShowArchiveVersionModal] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null)

  // Form states
  const [addVersionTab, setAddVersionTab] = useState<'upload' | 'url'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [newVersionSourceUrl, setNewVersionSourceUrl] = useState('')
  const [changeDescription, setChangeDescription] = useState('')
  const [archiveReason, setArchiveReason] = useState('')
  const [uploadingVersion, setUploadingVersion] = useState(false)

  const loadDocumentVersions = async () => {
    setIsLoading(true)
    try {
      const versionData = await apiClient.getDocumentVersions(document.id)
      setVersions(versionData)
    } catch (error) {
      console.error('Failed to load document versions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDocumentVersions()
  }, [document.id])

  useEffect(() => {
    const isProcessing = versions.some(v => v.status === 'processing' || v.status === 'pending')
    if (isProcessing) {
      const interval = setInterval(loadDocumentVersions, 5000)
      return () => clearInterval(interval)
    }
  }, [versions])

  const handleVersionUrlSubmit = async () => {
    if (!newVersionSourceUrl.trim() || !document) return
    setUploadingVersion(true)
    try {
      await apiClient.createDocumentVersionFromUrl(document.id, newVersionSourceUrl, changeDescription)
      setShowAddVersionModal(false)
      loadDocumentVersions()
    } catch (error) {
      alert('Failed to create version from URL.')
    } finally {
      setUploadingVersion(false)
    }
  }

  const handleVersionUpload = async () => {
    if (!selectedFile || !document) return
    setUploadingVersion(true)
    try {
      await apiClient.createDocumentVersion(document.id, selectedFile, changeDescription)
      setShowAddVersionModal(false)
      loadDocumentVersions()
    } catch (error) {
      alert('Failed to upload new version.')
    } finally {
      setUploadingVersion(false)
    }
  }

  const handleArchiveVersion = async () => {
    if (!selectedVersion || !archiveReason.trim()) return
    try {
      await apiClient.archiveDocumentVersionWithReason(document.id, selectedVersion.id, archiveReason)
      setShowArchiveVersionModal(false)
      setSelectedVersion(null)
      loadDocumentVersions()
    } catch (error) {
      alert('Failed to archive version.')
    }
  }
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const filteredVersions = versions.filter((v: DocumentVersion) => showArchived ? v.is_archived : !v.is_archived)

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </button>
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Versions for: {document.name}</h2>
            <div className="flex items-center space-x-1 rounded-md bg-gray-200 dark:bg-gray-800 p-1">
              <button onClick={() => setShowArchived(false)} className={`px-2 py-1 text-sm rounded-md flex items-center ${!showArchived ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                <Inbox className="mr-2 h-4 w-4" />
                Active
              </button>
              <button onClick={() => setShowArchived(true)} className={`px-2 py-1 text-sm rounded-md flex items-center ${showArchived ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}>
                <Archive className="mr-2 h-4 w-4" />
                Archived
              </button>
            </div>
          </div>
        </div>
        {!showArchived && (
          <button onClick={() => setShowAddVersionModal(true)} className="btn btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            Add New Version
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVersions.map((version) => (
            <div key={version.id} className="p-4 rounded-lg border bg-white dark:bg-gray-800/60">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">Version {version.version_number}</span>
                    {(version.status === 'pending' || version.status === 'processing') ? (
                      <div className="flex items-center text-yellow-500 text-xs"><Clock className="mr-1.5 h-3 w-3 animate-pulse" />Processing</div>
                    ) : version.status === 'completed' ? (
                      <div className="flex items-center text-green-500 text-xs"><CheckCircle2 className="mr-1.5 h-3 w-3" />Completed</div>
                    ) : version.status === 'failed' ? (
                      <div className="flex items-center text-red-500 text-xs"><XCircle className="mr-1.5 h-3 w-3" />Failed</div>
                    ) : version.status === 'archived' ? (
                      <div className="flex items-center text-gray-500 text-xs"><Archive className="mr-1.5 h-3 w-3" />Archived</div>
                    ) : null}
                  </div>

                  {showArchived && version.archive_reason && (
                    <div className="mt-2 mb-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        <span className="font-semibold">Reason for archival:</span> {version.archive_reason}
                      </p>
                      {version.archived_at && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Archived on {new Date(version.archived_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {version.change_description && (<p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{version.change_description}</p>)}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center space-x-1.5">{version.source_url ? <Globe className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}<span>{version.source_url ? 'URL' : 'Upload'}</span></span>
                    <span>{version.chunk_count} chunks</span>
                    {version.file_size && <span>{formatFileSize(version.file_size)}</span>}
                    <span>{new Date(version.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {!showArchived && (
                  <button 
                      onClick={() => { setSelectedVersion(version); onVersionSelect(version); setShowArchiveVersionModal(true); }} 
                      className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400" 
                      title="Archive version">
                        <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Version Modal */}
      {showAddVersionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Version</h3>
            <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
              <nav className="-mb-px flex space-x-8"><button onClick={() => setAddVersionTab('upload')} className={`${addVersionTab === 'upload' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Upload File</button><button onClick={() => setAddVersionTab('url')} className={`${addVersionTab === 'url' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>From URL</button></nav>
            </div>
            {addVersionTab === 'upload' && (<div className="space-y-4"><div><label className="block text-sm font-medium mb-2">File</label><div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md bg-gray-50 dark:bg-gray-700/50"><div className="space-y-1 text-center"><UploadCloud className="mx-auto h-12 w-12 text-gray-400" /><div className="flex text-sm text-gray-600 dark:text-gray-400"><label htmlFor="version-file-upload" className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"><span>Upload a file</span><input id="version-file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} /></label><p className="pl-1">or drag and drop</p></div><p className="text-xs text-gray-500 dark:text-gray-500">{selectedFile ? selectedFile.name : 'Any file type'}</p></div></div></div><div><label className="block text-sm font-medium mb-2">Change Description (optional)</label><textarea value={changeDescription} onChange={(e) => setChangeDescription(e.target.value)} className="input-field w-full" placeholder="What changed in this version?" rows={3}/></div><div className="flex justify-end space-x-3 pt-4"><button onClick={() => setShowAddVersionModal(false)} className="btn btn-secondary">Cancel</button><button onClick={handleVersionUpload} disabled={uploadingVersion || !selectedFile} className="btn btn-primary">{uploadingVersion ? 'Uploading...' : 'Upload Version'}</button></div></div>)}
            {addVersionTab === 'url' && (<div className="space-y-4"><div><label className="block text-sm font-medium mb-2">URL</label><input type="url" value={newVersionSourceUrl} onChange={(e) => setNewVersionSourceUrl(e.target.value)} className="input-field w-full" placeholder="https://example.com/document_v2.pdf"/></div><div><label className="block text-sm font-medium mb-2">Change Description (optional)</label><textarea value={changeDescription} onChange={(e) => setChangeDescription(e.target.value)} className="input-field w-full" placeholder="What changed in this version?" rows={3}/></div><div className="flex justify-end space-x-3 pt-4"><button onClick={() => setShowAddVersionModal(false)} className="btn btn-secondary">Cancel</button><button onClick={handleVersionUrlSubmit} disabled={uploadingVersion || !newVersionSourceUrl.trim()} className="btn btn-primary">{uploadingVersion ? 'Adding...' : 'Add Version'}</button></div></div>)}
          </div>
        </div>
      )}

      {/* Archive Version Modal */}
      {showArchiveVersionModal && selectedVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Archive Version {selectedVersion.version_number}</h3>
            <div className="space-y-4"><div><label className="block text-sm font-medium mb-2">Archive Reason</label><textarea value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)} className="input-field w-full" placeholder="Explain why this version is being archived" rows={3}/></div></div>
            <div className="flex justify-end space-x-3 mt-6">
              <button onClick={() => setShowArchiveVersionModal(false)} className="btn btn-secondary">Cancel</button>
              <button onClick={handleArchiveVersion} disabled={!archiveReason.trim()} className="btn btn-danger">Archive Version</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 