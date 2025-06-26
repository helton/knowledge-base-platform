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
  Search,
  ChevronRight,
  Archive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Extend the Document type for local state management
type DocumentWithVersionInfo = Document & {
  version_count?: number
  latest_version_number?: number
  versions?: DocumentVersion[]
  active_versions_count?: number
  archived_versions_count?: number
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
}

interface DocumentsProps {
  selectedKb: { id: string; name: string } | null
  onDocumentSelect: (document: Document) => void
  onViewVersions?: () => void
}

export function Documents({ selectedKb, onDocumentSelect, onViewVersions }: DocumentsProps) {
  const [documents, setDocuments] = useState<DocumentWithVersionInfo[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentWithVersionInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modals and their state
  const [showAddDocModal, setShowAddDocModal] = useState(false)
  const [showEditDescriptionModal, setShowEditDescriptionModal] = useState(false)

  // Data for modals
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithVersionInfo | null>(null)
  const [addVersionForDoc, setAddVersionForDoc] = useState<DocumentWithVersionInfo | null>(null)

  // Form fields
  const [addDocTab, setAddDocTab] = useState<'upload' | 'url'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [documentName, setDocumentName] = useState('')
  const [documentDescription, setDocumentDescription] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [editingDescription, setEditingDescription] = useState('')

  const [uploading, setUploading] = useState(false)

  const [expandedDocIds, setExpandedDocIds] = useState<Set<string>>(new Set())

  const toggleExpand = (docId: string) => {
    setExpandedDocIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(docId)) {
        newSet.delete(docId)
      } else {
        newSet.add(docId)
      }
      return newSet
    })
  }

  const handleAddVersion = (doc: DocumentWithVersionInfo) => {
    setAddVersionForDoc(doc)
    setShowAddDocModal(true)
    setAddDocTab('upload')
    setDocumentName('')
    setDocumentDescription('')
    setSelectedFile(null)
    setSourceUrl('')
  }

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
            processing_status: versions.length > 0 ? versions[versions.length - 1].processing_status : undefined,
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

  useEffect(() => {
    // Filter documents based on search query
    const filtered = documents.filter(doc =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredDocuments(filtered)
  }, [documents, searchQuery])

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
    setShowAddDocModal(false)
    setAddVersionForDoc(null)
    setDocumentName('')
    setDocumentDescription('')
    setSelectedFile(null)
    setSourceUrl('')
    setAddDocTab('upload')
  }

  const handleUpload = async () => {
    if (!selectedFile || !documentName.trim() || !selectedKb) return
    setUploading(true)
    try {
      if (addVersionForDoc) {
        // Add new version to existing document
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('version_name', documentName.trim())
        if (documentDescription.trim()) {
          formData.append('change_description', documentDescription.trim())
        }
        // Save file name
        formData.append('file_name', selectedFile.name)
        const url = `/api/documents/${addVersionForDoc.id}/versions`
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        })
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`)
        await response.json()
      } else {
        // Add new document
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
      }
      await loadDocuments()
      resetAddDocForm()
    } catch (error) {
      console.error('Failed to upload:', error)
      alert('Failed to upload. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = async () => {
    if (!sourceUrl.trim() || !selectedKb) return
    setUploading(true)
    try {
      if (addVersionForDoc) {
        // Add new version from URL
        const response = await fetch(`/api/documents/${addVersionForDoc.id}/versions/from-url`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sourceUrl, version_name: documentName.trim() || undefined, change_description: documentDescription.trim() || undefined }),
        })
        if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`)
        await response.json()
        await loadDocuments()
        resetAddDocForm()
      } else {
        await apiClient.createDocumentFromUrl(
          selectedKb.id,
          sourceUrl,
          documentName.trim() || undefined,
          documentDescription.trim() || undefined
        )
        await loadDocuments()
        resetAddDocForm()
      }
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

  const openAddDocModal = () => {
    setShowAddDocModal(true)
    setAddVersionForDoc(null)
    setAddDocTab('upload')
    setDocumentName('')
    setDocumentDescription('')
    setSelectedFile(null)
    setSourceUrl('')
  }

  const handleArchiveVersion = async (docId: string, version: DocumentVersion) => {
    if (!version.id) return;
    const reason = prompt('Enter archive reason:');
    if (!reason) return;
    try {
      await apiClient.archiveDocumentVersion(docId, version.id, reason);
      await loadDocuments();
    } catch (error) {
      alert('Failed to archive version.');
    }
  };

  if (!selectedKb) {
    return (
      <div className="flex flex-1 items-center justify-center h-full text-center">
        <div>
          <h3 className="text-2xl font-semibold mb-2">Select a Knowledge Base</h3>
          <p className="text-muted-foreground">Please select a knowledge base from the sidebar to view its documents.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            Documents
          </h2>
          <p className="text-muted-foreground">
            Knowledge Base: {selectedKb.name}
          </p>
        </div>
        <div className="flex gap-2">
          {onViewVersions && (
            <Button variant="outline" onClick={onViewVersions}>
              View Knowledge Base Versions
            </Button>
          )}
          <Button onClick={openAddDocModal}>
            Add Document
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !documents.length ? (
        <Card className="flex flex-1 items-center justify-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-2xl font-semibold mb-2">No Documents</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Get started by adding your first document to this knowledge base.
                </p>
                <Button onClick={openAddDocModal}>
                  Add Document
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">
              No Results Found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search terms.
            </p>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Versions</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => {
                  const expanded = expandedDocIds.has(doc.id)
                  return (
                    <React.Fragment key={doc.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpand(doc.id)}
                            className="mr-2"
                            aria-label={expanded ? 'Collapse' : 'Expand'}
                          >
                            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div className="inline-block align-middle">
                            <div className="font-medium">{doc.name}</div>
                            {doc.description && (
                              <div className="text-sm text-muted-foreground">{doc.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {(doc.processing_status === 'pending' || doc.processing_status === 'processing') && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                              <Clock className="mr-2 h-4 w-4 animate-pulse" />
                              Pending
                            </Badge>
                          )}
                          {doc.processing_status === 'completed' && (
                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Completed
                            </Badge>
                          )}
                          {doc.processing_status === 'failed' && (
                            <Badge variant="destructive">
                              <XCircle className="mr-2 h-4 w-4" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{doc.active_versions_count} active</div>
                            <div className="text-muted-foreground">{doc.archived_versions_count} archived</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {doc.latest_version_number && doc.latest_version_number > 0 ? (
                            <span className="text-sm font-medium">v{doc.latest_version_number}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDescriptionModal(doc)}
                              title="Edit description"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAddVersion(doc)}
                              title="Add new version"
                            >
                              <Plus className="h-4 w-4 text-green-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={6} className="bg-muted/30 p-0">
                            <div className="p-4">
                              {(doc.versions ?? []).length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {[...(doc.versions ?? [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((version) => {
                                    return (
                                      <div key={version.id} className="border rounded bg-background p-2 flex flex-col gap-1 shadow-sm text-xs">
                                        <div className="flex items-center gap-2 mb-0.5">
                                          <span className="font-semibold">v{version.version_number}</span>
                                          {version.version_name && <span className="text-muted-foreground">{version.version_name}</span>}
                                          {version.processing_status === 'completed' && (
                                            <Badge variant="default" className="bg-green-600 text-white ml-2">Completed</Badge>
                                          )}
                                          {version.processing_status === 'pending' && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">Pending</Badge>
                                          )}
                                          {version.processing_status === 'processing' && (
                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 ml-2">Processing</Badge>
                                          )}
                                          {version.processing_status === 'failed' && (
                                            <Badge variant="destructive" className="ml-2">Failed</Badge>
                                          )}
                                          {!version.is_archived && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="ml-auto"
                                              title="Archive version"
                                              onClick={() => handleArchiveVersion(doc.id, version)}
                                            >
                                              <Archive className="h-4 w-4 text-orange-600" />
                                            </Button>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          <div><span className="font-semibold">Created:</span> {new Date(version.created_at).toLocaleDateString()}</div>
                                          {version.file_name && <div><span className="font-semibold">File:</span> {version.file_name}</div>}
                                          {version.source_url && <div><span className="font-semibold">URL:</span> <a href={version.source_url} className="underline" target="_blank" rel="noopener noreferrer">{version.source_url}</a></div>}
                                        </div>
                                        {version.change_description && (
                                          <div className="mt-0.5"><span className="font-semibold">Description:</span> {version.change_description}</div>
                                        )}
                                        {version.is_archived && version.archive_reason && (
                                          <div className="mt-0.5 text-orange-700"><span className="font-semibold">Archive Reason:</span> {version.archive_reason}</div>
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-center py-2">No versions for this document.</div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MODALS */}

      {/* Add Document Modal */}
      {showAddDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>{addVersionForDoc ? `Add Version to "${addVersionForDoc.name}"` : 'Add Document'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-b mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setAddDocTab('upload')}
                    className={`${
                      addDocTab === 'upload'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    Upload File
                  </button>
                  <button
                    onClick={() => setAddDocTab('url')}
                    className={`${
                      addDocTab === 'url'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                  >
                    From URL
                  </button>
                </nav>
              </div>
              {addDocTab === 'upload' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>File</Label>
                    <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-muted-foreground/25 rounded-md bg-muted/25">
                      <div className="space-y-1 text-center">
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="flex text-sm text-muted-foreground">
                          <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80 focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileSelect} />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{selectedFile ? selectedFile.name : 'Any file type'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-name">Name</Label>
                    <Input
                      id="doc-name"
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder={addVersionForDoc ? 'Version name' : 'Document name (defaults to filename)'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="doc-description">Description (optional)</Label>
                    <textarea
                      id="doc-description"
                      value={documentDescription}
                      onChange={(e) => setDocumentDescription(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Document description"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={resetAddDocForm}>Cancel</Button>
                    <Button onClick={handleUpload} disabled={uploading || !selectedFile || !documentName.trim()}>
                      {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              )}
              {addDocTab === 'url' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="source-url">URL</Label>
                    <Input
                      id="source-url"
                      type="url"
                      value={sourceUrl}
                      onChange={(e) => setSourceUrl(e.target.value)}
                      placeholder="https://example.com/document.pdf"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url-doc-name">Name (optional)</Label>
                    <Input
                      id="url-doc-name"
                      type="text"
                      value={documentName}
                      onChange={(e) => setDocumentName(e.target.value)}
                      placeholder="Document name (defaults to URL)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url-doc-description">Description (optional)</Label>
                    <textarea
                      id="url-doc-description"
                      value={documentDescription}
                      onChange={(e) => setDocumentDescription(e.target.value)}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Document description"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setShowAddDocModal(false)}>Cancel</Button>
                    <Button onClick={handleUrlSubmit} disabled={uploading || !sourceUrl.trim()}>
                      {uploading ? 'Adding...' : 'Add Document'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Description Modal */}
      {showEditDescriptionModal && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <textarea
                    id="edit-description"
                    value={editingDescription}
                    onChange={(e) => setEditingDescription(e.target.value)}
                    className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Document description"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setShowEditDescriptionModal(false)}>Cancel</Button>
                <Button onClick={handleUpdateDescription}>Update Description</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 