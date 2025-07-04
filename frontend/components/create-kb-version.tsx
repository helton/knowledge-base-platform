'use client'

import { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase, Document, DocumentVersion, KnowledgeBaseVersion } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface CreateKbVersionProps {
  kb: KnowledgeBase
  draftVersion?: KnowledgeBaseVersion | null
  onVersionCreated: () => void
  onCancel: () => void
}

export function CreateKbVersion({ kb, draftVersion, onVersionCreated, onCancel }: CreateKbVersionProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [documentVersions, setDocumentVersions] = useState<Record<string, DocumentVersion[]>>({})
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Form fields
  const [versionBump, setVersionBump] = useState<'major' | 'minor' | 'patch'>('patch')
  const [versionName, setVersionName] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [accessLevel, setAccessLevel] = useState<'private' | 'protected' | 'public'>('private')
  const [showAddDoc, setShowAddDoc] = useState(false)
  const [docToAdd, setDocToAdd] = useState<string>('')

  // Helper: get the last version number from previous KB versions (excluding drafts)
  const [lastVersion, setLastVersion] = useState<string>('1.0.0')
  const [hasAnyVersion, setHasAnyVersion] = useState<boolean>(false)
  const [isFirstDraft, setIsFirstDraft] = useState<boolean>(false)
  useEffect(() => {
    async function fetchLastVersion() {
      const kbVersions = await apiClient.getKnowledgeBaseVersions(kb.id)
      const published = kbVersions.filter(v => v.status === 'published')
      setHasAnyVersion(kbVersions.length > 0)
      // If the only version is a draft and it's the one being edited, treat as first draft
      if (kbVersions.length === 1 && kbVersions[0].status === 'draft' && draftVersion && kbVersions[0].id === draftVersion.id) {
        setIsFirstDraft(true)
      } else {
        setIsFirstDraft(false)
      }
      if (published.length > 0) {
        published.sort((a, b) => (b.version_number || '').localeCompare(a.version_number || ''))
        setLastVersion(published[0].version_number || '1.0.0')
      } else {
        setLastVersion('1.0.0')
      }
    }
    fetchLastVersion()
  }, [kb.id, draftVersion])

  // Helper: calculate next version numbers
  function getNextVersionNumbers(current: string) {
    const [major, minor, patch] = current.split('.').map(Number)
    return {
      patch: `v${major}.${minor}.${patch + 1} (patch)` ,
      minor: `v${major}.${minor + 1}.0 (minor)` ,
      major: `v${major + 1}.0.0 (major)`
    }
  }
  const nextVersions = getNextVersionNumbers(lastVersion)

  // Determine if this is the first release (no previous versions at all)
  const isFirstRelease = !hasAnyVersion

  // If first release, set defaults and lock fields
  useEffect(() => {
    if (isFirstRelease) {
      setVersionBump('patch');
      setVersionName('First Release');
      setAccessLevel('private');
    }
  }, [isFirstRelease]);

  const fetchData = async () => {
    if (kb) {
      setIsLoading(true)
      try {
        // Only fetch documents for this KB
        const [docs, docVersionsRaw] = await Promise.all([
          apiClient.getDocumentsByKb(kb.id),
          apiClient.getAllDocumentVersions(kb.project_id)
        ])
        const docVersions = docVersionsRaw || [];
        
        const versionsByDoc: Record<string, DocumentVersion[]> = {}
        docVersions.forEach((version: DocumentVersion) => {
          if (!versionsByDoc[version.document_id]) {
            versionsByDoc[version.document_id] = []
          }
          versionsByDoc[version.document_id].push(version)
        })

        setDocuments(docs)
        setDocumentVersions(versionsByDoc)

        // Check existing KB versions to determine initial version and prevent multiple drafts
        const kbVersions = await apiClient.getKnowledgeBaseVersions(kb.id)
        const existingDraft = kbVersions.find(v => v.status === 'draft')
        // Only allow creating a draft if none exists
        if (!draftVersion && existingDraft) {
          setError('A draft version already exists. Please publish or archive the existing draft before creating a new one.')
          setIsLoading(false)
          return
        }

        if (draftVersion) {
          setVersionName(draftVersion.version_name || '')
          setReleaseNotes(draftVersion.release_notes || '')
          setAccessLevel(draftVersion.access_level || 'private')
          // Robust mapping: for each document_version_id, find the corresponding document and set mapping
          const selected: Record<string, string> = {}
          await Promise.all(draftVersion.document_version_ids.map(async (versionId) => {
            try {
              const version = await apiClient.getDocumentVersion(versionId)
              selected[version.document_id] = versionId
            } catch (e) {
              // If not found, skip
            }
          }))
          setSelectedVersions(selected)
        }
      } catch (err: any) {
        console.error(err)
        setError('Failed to fetch data.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchData()
  }, [kb, draftVersion])

  const handleCreateOrUpdateVersion = async () => {
    setIsLoading(true);
    setError(null);
    const versionData = {
      version_bump: isFirstRelease ? 'patch' : versionBump,
      version_name: versionName,
      release_notes: releaseNotes,
      access_level: accessLevel,
      document_version_ids: Object.keys(selectedVersions).map(key => selectedVersions[key]),
    };

    try {
      if (draftVersion && draftVersion.id) {
        await apiClient.updateKbVersion(kb.id, draftVersion.id, versionData);
      } else {
        await apiClient.createKbVersion(kb.id, versionData);
      }
      await fetchData(); // Refresh state after update
      onVersionCreated();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVersionSelect = (docId: string, versionId: string) => {
    setSelectedVersions(prev => ({
      ...prev,
      [docId]: versionId
    }))
  }

  // Helper: get list of document IDs currently in the draft
  const selectedDocIds = Object.keys(selectedVersions)
  // Helper: get list of documents not yet added
  const availableDocs = documents.filter(doc => !selectedDocIds.includes(doc.id))

  // Add a document to the draft
  const handleAddDocument = () => {
    if (docToAdd && !selectedDocIds.includes(docToAdd)) {
      // Pick the latest version by default if available
      const versions = (documentVersions[docToAdd] || []).slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      const latest = versions[0]?.id || ''
      setSelectedVersions(prev => ({ ...prev, [docToAdd]: latest }))
      setDocToAdd('')
      setShowAddDoc(false)
      // fetchData(); // Removed to prevent UI state overwrite
    }
  }

  // Remove a document from the draft
  const handleRemoveDocument = (docId: string) => {
    setSelectedVersions(prev => {
      const copy = { ...prev }
      delete copy[docId]
      return copy
    })
  }

  // Validation: require a version selected for every document
  const allVersionsSelected = selectedDocIds.length > 0 && selectedDocIds.every(docId => selectedVersions[docId])

  if (!kb) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a Knowledge Base to create a version.
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {draftVersion ? 'Edit Draft Version' : 'Create New Version'} for {kb.name}
        </h1>
        <p className="text-muted-foreground">
          Configure version details and select document versions to include.
        </p>
      </div>

      {error && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <span className="font-semibold">Draft:</span> This is a draft version. Please publish it before creating a new version.
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Version Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Version</Label>
                {(isFirstRelease || isFirstDraft) ? (
                  <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                    v1.0.0
                  </div>
                ) : (
                  <select
                    value={versionBump}
                    onChange={(e) => setVersionBump(e.target.value as 'major' | 'minor' | 'patch')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={documents.length === 0 || !!draftVersion}
                  >
                    <option value="patch">{nextVersions.patch}</option>
                    <option value="minor">{nextVersions.minor}</option>
                    <option value="major">{nextVersions.major}</option>
                  </select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Version Name (Optional)</Label>
                <input
                  type="text"
                  value={versionName}
                  onChange={(e) => setVersionName(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="e.g., 'Updated with new data'"
                  disabled={false}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Level</Label>
                <select
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={false}
                >
                  <option value="private">Private</option>
                  <option value="protected">Protected</option>
                  <option value="public">Public</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Release Notes (Optional)</Label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Describe what's new in this version..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Select Document Versions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddDoc(true)}
                    disabled={availableDocs.length === 0}
                  >
                    Add Document
                  </Button>
                  {showAddDoc && (
                    <div className="flex items-center gap-2 ml-2">
                      <select
                        value={docToAdd}
                        onChange={e => setDocToAdd(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select document...</option>
                        {availableDocs.map(doc => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        onClick={handleAddDocument}
                        disabled={!docToAdd}
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setShowAddDoc(false); setDocToAdd('') }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDocIds.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">No documents added</TableCell>
                      </TableRow>
                    )}
                    {selectedDocIds.map(docId => {
                      const doc = documents.find(d => d.id === docId)
                      const versions = documentVersions[docId] || []
                      const selectedVersionId = selectedVersions[docId]
                      return doc ? (
                        <TableRow key={doc.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-sm text-muted-foreground">{doc.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <select
                              value={selectedVersionId || ''}
                              onChange={e => handleVersionSelect(doc.id, e.target.value)}
                              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <option value="">No version selected</option>
                              {versions
                                .slice() // copy to avoid mutating state
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map(version => (
                                  <option key={version.id} value={version.id}>
                                    {version.version_number.startsWith('v') ? version.version_number : `v${version.version_number}`} - {new Date(version.created_at).toISOString().slice(0, 10)}{version.is_archived ? ' (ARCHIVED)' : ''}
                                  </option>
                                ))}
                            </select>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveDocument(doc.id)}
                              aria-label="Remove document"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ) : null
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleCreateOrUpdateVersion} disabled={isLoading || !allVersionsSelected}>
            {isLoading ? (draftVersion ? 'Updating...' : 'Creating...') : (draftVersion ? 'Update Draft' : 'Create Version')}
          </Button>
        </div>
        {!allVersionsSelected && (
          <div className="text-sm text-red-500 mt-2">Please select a version for every document before saving.</div>
        )}
      </div>
    </div>
  )
} 