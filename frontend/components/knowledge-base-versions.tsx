'use client'

import React, { useEffect, useState } from 'react'
import { apiClient, KnowledgeBase, KnowledgeBaseVersion, Document, DocumentVersion } from '@/lib/api-client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, GitBranch, Archive, CheckCircle, Star, Edit, Trash2, Lock, Users, Globe, ArrowLeft, ChevronDown, ChevronRight, FileText, AlertTriangle, Search } from 'lucide-react'
import { Input } from './ui/input'
import semver from 'semver'

interface KnowledgeBaseVersionsProps {
  kb: KnowledgeBase
  onCreateVersion?: () => void
  onViewVersionDetails?: (version: KnowledgeBaseVersion) => void
  onBack?: () => void
}

type DocumentWithVersion = {
  document: Document
  documentVersion: DocumentVersion
  allDocumentVersions: DocumentVersion[]
}

type ExpandedVersion = {
  versionId: string
  documents: DocumentWithVersion[]
  isLoading: boolean
  error: string | null
}

export function KnowledgeBaseVersions({ kb, onCreateVersion, onViewVersionDetails, onBack }: KnowledgeBaseVersionsProps) {
  const [versions, setVersions] = useState<KnowledgeBaseVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedVersions, setExpandedVersions] = useState<Map<string, ExpandedVersion>>(new Map())
  const [search, setSearch] = useState('')

  const hasDraftVersion = versions.some(v => v.status === 'draft')

  const fetchVersions = () => {
    if (kb) {
      setIsLoading(true)
      apiClient
        .getKnowledgeBaseVersions(kb.id)
        .then(setVersions)
        .catch((err: any) => {
          console.error(err)
          setError('Failed to fetch knowledge base versions.')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }

  useEffect(() => {
    fetchVersions()
  }, [kb])

  // Filter versions by search
  const filteredVersions = versions.filter(v => {
    const s = search.trim()
    if (!s) return true
    // If search looks like a semver range, use semver.satisfies
    if (/^[~^><=]/.test(s) || s.match(/\d+\.\d+\.\d+/)) {
      // Remove leading 'v' if present in version_number
      const versionNum = v.version_number.replace(/^v/, '')
      try {
        return semver.satisfies(versionNum, s)
      } catch {
        // If semver fails, fallback to substring search
        return v.version_number.toLowerCase().includes(s.toLowerCase())
      }
    }
    // Fallback: substring search
    return (
      v.version_number.toLowerCase().includes(s.toLowerCase()) ||
      v.status.toLowerCase().includes(s.toLowerCase()) ||
      (v.release_notes && v.release_notes.toLowerCase().includes(s.toLowerCase()))
    )
  })

  const handlePublish = async (versionId: string) => {
    try {
      await apiClient.publishKnowledgeBaseVersion(kb.id, versionId)
      fetchVersions()
    } catch (error) {
      console.error('Failed to publish version:', error)
      setError('Failed to publish version. Please try again.')
    }
  }

  const handleArchive = async (versionId: string) => {
    try {
      await apiClient.archiveKnowledgeBaseVersion(kb.id, versionId)
      fetchVersions()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
      console.error('Failed to archive version:', error)
      setError(`Failed to archive version: ${errorMessage}`)
    }
  }

  const handleSetPrimary = async (versionId: string) => {
    try {
      await apiClient.setPrimaryKnowledgeBaseVersion(kb.id, versionId)
      fetchVersions()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.'
      console.error('Failed to set primary version:', error)
      setError(`Failed to set primary version: ${errorMessage}`)
    }
  }

  const toggleExpanded = async (version: KnowledgeBaseVersion) => {
    const versionId = version.id;
    const isCurrentlyExpanded = expandedVersions.has(versionId);

    if (isCurrentlyExpanded) {
      // Collapse
      const newExpandedVersions = new Map(expandedVersions);
      newExpandedVersions.delete(versionId);
      setExpandedVersions(newExpandedVersions);
    } else {
      // Expand - load documents with all their versions
      const loadingMap = new Map(expandedVersions);
      loadingMap.set(versionId, {
        versionId,
        documents: [],
        isLoading: true,
        error: null,
      });
      setExpandedVersions(loadingMap);

      try {
        const docsWithVersions: DocumentWithVersion[] = await Promise.all(
          version.document_version_ids.map(async (versionId) => {
            const documentVersion = await apiClient.getDocumentVersion(versionId);
            const document = await apiClient.getDocument(documentVersion.document_id);
            
            // Fetch all versions for this document to determine if current version is latest
            const allDocumentVersions = await apiClient.getDocumentVersions(document.id);
            
            return { 
              document, 
              documentVersion,
              allDocumentVersions 
            };
          })
        );

        const loadedMap = new Map(loadingMap);
        loadedMap.set(versionId, {
          versionId,
          documents: docsWithVersions,
          isLoading: false,
          error: null,
        });
        setExpandedVersions(loadedMap);
      } catch (error) {
        console.error('Failed to load version documents:', error);
        const errorMap = new Map(loadingMap);
        errorMap.set(versionId, {
          versionId,
          documents: [],
          isLoading: false,
          error: 'Failed to load documents',
        });
        setExpandedVersions(errorMap);
      }
    }
  };

  const isExpanded = (versionId: string) => expandedVersions.has(versionId)
  const getExpandedData = (versionId: string) => expandedVersions.get(versionId)

  if (!kb) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a Knowledge Base to see its versions.
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">{kb.name}</h2>
            <p className="text-muted-foreground">Knowledge Base Versions</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onCreateVersion && (
            <Button onClick={onCreateVersion}>
              {hasDraftVersion ? 'Edit Draft Version' : 'Create Version'}
            </Button>
          )}
        </div>
      </div>
      {/* Search input */}
      <div className="mb-4 flex w-full">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search versions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        {search && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredVersions.length} version{filteredVersions.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* No Versions screen */}
      {filteredVersions.length === 0 ? (
        <Card className="flex flex-1 items-center justify-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <GitBranch className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-2xl font-semibold mb-2">No Versions</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Get started by creating the first version for this knowledge base.
                </p>
                {onCreateVersion && (
                  <Button onClick={onCreateVersion}>
                    Create Version
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            {/* Removed redundant Version History title */}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Release Notes</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVersions.map((version) => {
                  const expanded = isExpanded(version.id)
                  const expandedData = getExpandedData(version.id)
                  
                  return (
                    <React.Fragment key={version.id}>
                      <TableRow>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleExpanded(version)}
                            className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            {expanded ? (
                              <ChevronDown className="h-5 w-5" />
                            ) : (
                              <ChevronRight className="h-5 w-5" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{version.version_number}</span>
                            {version.is_primary && (
                              <Badge variant="default" className="bg-yellow-600 hover:bg-yellow-700">
                                primary
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              version.status === 'published'
                                ? 'default'
                                : version.status === 'archived'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {version.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {version.access_level === 'private' && <Lock className="h-4 w-4 text-muted-foreground" />}
                            {version.access_level === 'protected' && <Users className="h-4 w-4 text-muted-foreground" />}
                            {version.access_level === 'public' && <Globe className="h-4 w-4 text-muted-foreground" />}
                            <span className="lowercase">{version.access_level}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {version.release_notes || '-'}
                        </TableCell>
                        <TableCell>
                          {new Date(version.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {onViewVersionDetails && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onViewVersionDetails(version)}
                                title={version.status === 'draft' ? "Edit Draft" : "View details"}
                              >
                                {version.status === 'draft' ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={version.status !== 'draft'}
                              onClick={() => handlePublish(version.id)}
                              title="Publish"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={version.is_primary || version.status !== 'published'}
                              onClick={() => handleSetPrimary(version.id)}
                              title="Set as Primary"
                            >
                              <Star className={`h-4 w-4 ${version.is_primary ? 'text-yellow-500' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleArchive(version.id)}
                              disabled={version.is_primary || version.status !== 'published'}
                              title={version.is_primary ? "Primary versions cannot be archived" : version.status === 'published' ? "Archive version" : "Only published versions can be archived"}
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Expanded content row */}
                      {expanded && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/30 border-t">
                              <div className="p-4">
                                {expandedData?.isLoading ? (
                                  <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  </div>
                                ) : expandedData?.error ? (
                                  <div className="text-center py-4 text-destructive">
                                    {expandedData.error}
                                  </div>
                                ) : expandedData?.documents && expandedData.documents.length > 0 ? (
                                  <div className="space-y-3">
                                    {expandedData.documents.map(({ document, documentVersion, allDocumentVersions }) => {
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
                                ) : (
                                  <div className="text-center py-8">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">No documents included in this version</p>
                                  </div>
                                )}
                              </div>
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
    </div>
  )
} 