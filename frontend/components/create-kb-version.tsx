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
          
          const selected: Record<string, string> = {}
          draftVersion.document_version_ids.forEach(versionId => {
            for (const doc of docs) {
              const docVer = versionsByDoc[doc.id]?.find(v => v.id === versionId)
              if (docVer) {
                selected[doc.id] = versionId
                break
              }
            }
          })
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
      {error && <div className="text-red-500 bg-red-100 p-2 rounded mb-4">{error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
          <h3 className="text-lg font-semibold mb-4">Version Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Version Bump</label>
              <select
                value={versionBump}
                onChange={(e) => setVersionBump(e.target.value as 'major' | 'minor' | 'patch')}
                className="w-full px-3 py-2 border rounded-md"
                disabled={documents.length === 0} // Disable if no documents loaded yet
              >
                <option value="patch">Patch (1.0.0 → 1.0.1)</option>
                <option value="minor">Minor (1.0.0 → 1.1.0)</option>
                <option value="major">Major (1.0.0 → 2.0.0)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Version Name (Optional)</label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., 'Updated with new data'"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
                className="w-full px-3 py-2 border rounded-md"
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
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Available Versions</TableHead>
                    <TableHead>Selected Version</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => {
                    const versions = documentVersions[document.id] || []
                    const selectedVersionId = selectedVersions[document.id]
                    const selectedVersion = versions.find(v => v.id === selectedVersionId)
                    
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{document.name}</div>
                            <div className="text-sm text-gray-500">{document.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {versions.map((version) => (
                              <div key={version.id} className="text-sm">
                                <Badge className="mr-2">
                                  {version.version_number}
                                </Badge>
                                {version.version_name && (
                                  <span className="text-gray-600">{version.version_name}</span>
                                )}
                              </div>
                            ))}
                            {versions.length === 0 && (
                              <span className="text-gray-500 text-sm">No versions available</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <select
                            value={selectedVersionId || ''}
                            onChange={(e) => handleVersionSelect(document.id, e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                          >
                            <option value="">No version selected</option>
                            {versions.map((version) => (
                              <option key={version.id} value={version.id}>
                                {version.version_number} - {version.version_name || 'No name'}
                                {version.is_archived ? ' (ARCHIVED)' : ''}
                              </option>
                            ))}
                          </select>
                          {selectedVersion && selectedVersion.is_archived && (
                            <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm">
                              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                                <span className="text-orange-500">⚠️</span>
                                <span className="font-medium">Warning:</span>
                                <span>This document version is archived and may be outdated.</span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdateVersion} disabled={isLoading}>
              {isLoading ? (draftVersion ? 'Updating...' : 'Creating...') : (draftVersion ? 'Update Draft' : 'Create Version')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 