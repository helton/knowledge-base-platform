'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, KnowledgeBaseVersion, Document, DocumentVersion } from '@/lib/api-client'
import { ArrowLeft, FileText, GitBranch, Calendar, User, AlertTriangle, CheckCircle, Clock, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface KbVersionDetailProps {
  kbVersion: KnowledgeBaseVersion
  onBack: () => void
}

type DocumentWithAllVersions = {
  document: Document
  documentVersion: DocumentVersion
  allDocumentVersions: DocumentVersion[]
}

export function KbVersionDetail({ kbVersion, onBack }: KbVersionDetailProps) {
  const [documentsWithVersions, setDocumentsWithVersions] = useState<DocumentWithAllVersions[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadVersionDetails()
  }, [kbVersion.id])

  const loadVersionDetails = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // For each document, fetch all versions to determine latest/outdated
      const docsWithVersions: DocumentWithAllVersions[] = await Promise.all(
        kbVersion.document_version_ids.map(async (versionId) => {
          const documentVersion = await apiClient.getDocumentVersion(versionId)
          const document = await apiClient.getDocument(documentVersion.document_id)
          const allDocumentVersions = await apiClient.getDocumentVersions(document.id)
          return { document, documentVersion, allDocumentVersions }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {kbVersion.version_number}
            </h1>
            <p className="text-muted-foreground">
              Knowledge Base Version Details
            </p>
          </div>
        </div>
      </div>

      {/* Version Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge
                  variant={
                    kbVersion.status === 'published'
                      ? 'default'
                      : kbVersion.status === 'archived'
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="mt-1"
                >
                  {kbVersion.status}
                </Badge>
              </div>
              {kbVersion.status === 'published' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {kbVersion.status === 'draft' && <Clock className="h-6 w-6 text-yellow-500" />}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Access Level</p>
                <Badge
                  variant={
                    kbVersion.access_level === 'public'
                      ? 'default'
                      : kbVersion.access_level === 'protected'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="mt-1"
                >
                  {kbVersion.access_level}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Primary</p>
                <p className="text-lg font-semibold">
                  {kbVersion.is_primary ? 'Yes' : 'No'}
                </p>
              </div>
              {kbVersion.is_primary && (
                <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Documents</p>
                <p className="text-lg font-semibold">
                  {documentsWithVersions.length}
                </p>
              </div>
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Version Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Version Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created:</span>
                <span className="text-sm font-medium">
                  {new Date(kbVersion.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Created by:</span>
                <span className="text-sm font-medium">
                  {kbVersion.created_by || 'Unknown'}
                </span>
              </div>
              {kbVersion.updated_at && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Updated:</span>
                  <span className="text-sm font-medium">
                    {new Date(kbVersion.updated_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Release Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {kbVersion.release_notes ? (
              <p className="text-sm whitespace-pre-wrap">
                {kbVersion.release_notes}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No release notes provided
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Included Documents ({documentsWithVersions.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {documentsWithVersions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No documents included in this version</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documentsWithVersions.map(({ document, documentVersion, allDocumentVersions }) => {
                // Sort all versions by creation date (newest first) and get the latest
                const sortedVersions = [...allDocumentVersions].sort((a, b) => 
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
                const latestVersion = sortedVersions[0];
                const isLatest = documentVersion.id === latestVersion?.id;
                return (
                  <Card key={`${document.id}-${documentVersion.id}`} className="border">
                    <CardContent className="pt-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold">v{documentVersion.version_number}</span>
                          {documentVersion.version_name && <span className="text-muted-foreground">{documentVersion.version_name}</span>}
                          {documentVersion.processing_status === 'completed' && (
                            <Badge variant="default" className="bg-green-600 text-white ml-2">Completed</Badge>
                          )}
                          {documentVersion.processing_status === 'pending' && (
                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 ml-2">Pending</Badge>
                          )}
                          {documentVersion.processing_status === 'processing' && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 ml-2">Processing</Badge>
                          )}
                          {documentVersion.processing_status === 'failed' && (
                            <Badge variant="destructive" className="ml-2">Failed</Badge>
                          )}
                          {documentVersion.is_archived && (
                            <Badge variant="outline" className="text-orange-600 border-orange-600 ml-2">archived</Badge>
                          )}
                          {isLatest && !documentVersion.is_archived && (
                            <Badge variant="default" className="bg-green-600 text-white ml-2">latest</Badge>
                          )}
                          {!isLatest && !documentVersion.is_archived && (
                            <Badge variant="secondary" className="bg-yellow-200 text-yellow-900 ml-2">outdated</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <div><span className="font-semibold">Created:</span> {new Date(documentVersion.created_at).toLocaleDateString()}</div>
                          {documentVersion.file_name && <div><span className="font-semibold">File:</span> {documentVersion.file_name}</div>}
                          {documentVersion.source_url && <div><span className="font-semibold">URL:</span> <a href={documentVersion.source_url} className="underline" target="_blank" rel="noopener noreferrer">{documentVersion.source_url}</a></div>}
                        </div>
                        {documentVersion.change_description && (
                          <div className="mt-0.5"><span className="font-semibold">Description:</span> {documentVersion.change_description}</div>
                        )}
                        {documentVersion.is_archived && documentVersion.archive_reason && (
                          <div className="mt-0.5 text-orange-700"><span className="font-semibold">Archive Reason:</span> {documentVersion.archive_reason}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 