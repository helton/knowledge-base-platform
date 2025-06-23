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
  useEffect(() => {
    async function fetchLastVersion() {
      const kbVersions = await apiClient.getKnowledgeBaseVersions(kb.id)
      const published = kbVersions.filter(v => v.status !== 'draft')
      if (published.length > 0) {
        // Sort by version_number descending
        published.sort((a, b) => (b.version_number || '').localeCompare(a.version_number || ''))
        setLastVersion(published[0].version_number || '1.0.0')
      } else {
        setLastVersion('1.0.0')
      }
    }
    fetchLastVersion()
  }, [kb.id])

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

  // Determine if this is the first release (no previous versions)
  const isFirstRelease = !draftVersion && documents.length > 0 && Object.values(documentVersions).flat().length === 0;

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
        const [docs, docVersionsRaw] = await Promise.all([
          apiClient.getDocuments(kb.project_id),
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
        
        if (existingDraft) {
          setError('A draft version already exists. Please publish or archive the existing draft before creating a new one.')
          return
        }

        // Set initial version bump based on existing versions
        if (kbVersions.length === 0) {
          setVersionBump('patch') // First version will be 1.0.0
        } else {
          setVersionBump('patch') // Default to patch for subsequent versions
        }

        if (draftVersion) {
          setVersionName(draftVersion.version_name || '')
          setReleaseNotes(draftVersion.release_notes || '')
          setAccessLevel(draftVersion.access_level || 'private')
          
          // Robust mapping: for each document_version_id, find the corresponding document and set mapping
          const selected: Record<string, string> = {}
          // Fetch all document versions for the draft's document_version_ids
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
      fetchData(); // Refresh document/version lists after adding
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
      <div className="p-4 text-center text-gray-500">
        Select a Knowledge Base to create a version.
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        {draftVersion ? 'Edit Draft Version' : 'Create New Version'} for {kb.name}
      </h1>
      {error && (
        <div className="mb-4">
          <div className="rounded border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 text-sm flex items-center gap-2">
            <span className="font-semibold">Draft:</span> This is a draft version. Please publish it before creating a new version.
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-8 max-w-3xl">
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4">Version Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Version</label>
              {isFirstRelease ? (
                <div className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">v1.0.0</div>
              ) : (
                <select
                  value={versionBump}
                  onChange={(e) => setVersionBump(e.target.value as 'major' | 'minor' | 'patch')}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={documents.length === 0}
                >
                  <option value="patch">{nextVersions.patch}</option>
                  <option value="minor">{nextVersions.minor}</option>
                  <option value="major">{nextVersions.major}</option>
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version Name (Optional)</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 'Updated with new data'"
                disabled={false}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={false}
              >
                <option value="private">Private</option>
                <option value="protected">Protected</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Release Notes (Optional)</label>
            <textarea
              value={releaseNotes}
              onChange={(e) => setReleaseNotes(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Describe what's new in this version..."
              rows={3}
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Select Document Versions</h3>
          {isLoading ? (
            <p>Loading documents...</p>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="mb-4 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddDoc(true)}
                  disabled={availableDocs.length === 0}
                >
                  + Add Document
                </Button>
                {showAddDoc && (
                  <div className="flex items-center gap-2 ml-2">
                    <select
                      value={docToAdd}
                      onChange={e => setDocToAdd(e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
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
                      <TableCell colSpan={3} className="text-center text-gray-500">No documents added</TableCell>
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
                            <div className="text-sm text-gray-500">{doc.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={selectedVersionId || ''}
                            onChange={e => handleVersionSelect(doc.id, e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
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
        </div>

        <div className="mt-8 flex gap-2">
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