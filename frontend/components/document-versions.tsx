'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { apiClient, DocumentVersion } from '@/lib/api-client'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Plus,
  Search,
  Trash2,
  Upload,
  XCircle,
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

interface DocumentVersionsProps {
  documentId: string
  documentName: string
  onBack: () => void
}

export function DocumentVersions({ documentId, documentName, onBack }: DocumentVersionsProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [filteredVersions, setFilteredVersions] = useState<DocumentVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const loadVersions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const versionsData = await apiClient.getDocumentVersions(documentId)
      setVersions(versionsData)
    } catch (error) {
      console.error('Failed to load document versions:', error)
      setError('Failed to load document versions. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    loadVersions()
  }, [loadVersions])

  useEffect(() => {
    // Filter versions based on search query
    const filtered = versions.filter(version =>
      version.version_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (version.processing_status && version.processing_status.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredVersions(filtered)
  }, [versions, searchQuery])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/versions/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) throw new Error(`Upload failed: ${response.statusText}`)

      await response.json()
      await loadVersions()
      setShowUploadModal(false)
      setSelectedFile(null)
    } catch (error) {
      console.error('Failed to upload version:', error)
      alert('Failed to upload version. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = async (version: DocumentVersion) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/documents/${documentId}/versions/${version.id}/download`
      )
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${documentName}_${version.version_number}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download version:', error)
      alert('Failed to download version. Please try again.')
    }
  }

  const handleDelete = async (version: DocumentVersion) => {
    if (!confirm(`Are you sure you want to delete version ${version.version_number}?`)) return

    try {
      await apiClient.deleteDocumentVersion(documentId, version.id)
      await loadVersions()
    } catch (error) {
      console.error('Failed to delete version:', error)
      alert('Failed to delete version. Please try again.')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack} className="p-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              Document Versions
            </h2>
            <p className="text-muted-foreground">
              {documentName}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowUploadModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Version
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search versions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredVersions.length} version{filteredVersions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : !versions.length ? (
        <Card className="flex flex-1 items-center justify-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-2xl font-semibold mb-2">No Versions</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Get started by uploading the first version of this document.
                </p>
                <Button onClick={() => setShowUploadModal(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Add Version
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : filteredVersions.length === 0 ? (
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
          <CardHeader>
            <CardTitle>Version List</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File Size</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVersions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell>
                      <div className="font-medium">{version.version_number}</div>
                      {version.is_archived && (
                        <Badge variant="secondary" className="mt-1">
                          Archived
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {(version.processing_status === 'pending' || version.processing_status === 'processing') && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                          <Clock className="mr-2 h-4 w-4 animate-pulse" />
                          Pending
                        </Badge>
                      )}
                      {version.processing_status === 'completed' && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Completed
                        </Badge>
                      )}
                      {version.processing_status === 'failed' && (
                        <Badge variant="destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Failed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {version.file_size ? formatFileSize(version.file_size) : 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(version.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownload(version)}
                          title="Download"
                          disabled={version.processing_status !== 'completed'}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(version)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Upload New Version</CardTitle>
              <CardDescription>
                Upload a new version of {documentName}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file">Select File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false)
                    setSelectedFile(null)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 