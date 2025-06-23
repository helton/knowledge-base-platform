'use client'

import { apiClient, KnowledgeBase, KnowledgeBaseVersion } from '@/lib/api-client'
import { useEffect, useState } from 'react'
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
import { Eye, GitBranch, Archive, CheckCircle, Star, Edit, Trash2, Lock, Users, Globe } from 'lucide-react'

interface KnowledgeBaseVersionsProps {
  kb: KnowledgeBase
  onViewDocuments?: () => void
  onCreateVersion?: () => void
  onViewVersionDetails?: (version: KnowledgeBaseVersion) => void
  onBack?: () => void
}

export function KnowledgeBaseVersions({ kb, onViewDocuments, onCreateVersion, onViewVersionDetails, onBack }: KnowledgeBaseVersionsProps) {
  const [versions, setVersions] = useState<KnowledgeBaseVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasDraftVersion = versions.some(v => v.status === 'draft');

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

  const handlePublish = async (versionId: string) => {
    try {
      await apiClient.publishKnowledgeBaseVersion(kb.id, versionId);
      fetchVersions(); // Refetch to update the UI
    } catch (error) {
      console.error("Failed to publish version:", error);
      setError("Failed to publish version. Please try again.");
    }
  };

  const handleArchive = async (versionId: string) => {
    try {
      await apiClient.archiveKnowledgeBaseVersion(kb.id, versionId);
      fetchVersions(); // Refetch to update the UI
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to archive version:", error);
      setError(`Failed to archive version: ${errorMessage}`);
    }
  };

  const handleSetPrimary = async (versionId: string) => {
    try {
      await apiClient.setPrimaryKnowledgeBaseVersion(kb.id, versionId);
      fetchVersions(); // Refetch to update the UI
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      console.error("Failed to set primary version:", error);
      setError(`Failed to set primary version: ${errorMessage}`);
    }
  };

  if (!kb) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a Knowledge Base to see its versions.
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{kb.name} - Versions</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button variant="outline" onClick={onViewDocuments}>
            View Documents
          </Button>
          <Button onClick={onCreateVersion}>
            {hasDraftVersion ? 'Edit Draft Version' : 'Create Version'}
          </Button>
        </div>
      </div>
      {isLoading ? (
        <p>Loading versions...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Release Notes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow key={version.id}>
                  <TableCell>
                    {version.version_number}{' '}
                    {version.is_primary && <Badge>Primary</Badge>}
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
                      {version.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2" title={version.access_level.charAt(0).toUpperCase() + version.access_level.slice(1)}>
                      {version.access_level === 'private' && <Lock className="inline h-4 w-4" />}
                      {version.access_level === 'protected' && <Users className="inline h-4 w-4" />}
                      {version.access_level === 'public' && <Globe className="inline h-4 w-4" />}
                      <span className="capitalize">{version.access_level}</span>
                    </span>
                  </TableCell>
                  <TableCell>{version.release_notes}</TableCell>
                  <TableCell>
                    {new Date(version.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="space-x-2">
                    {onViewVersionDetails && (
                      <button
                        onClick={() => onViewVersionDetails(version)}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full"
                        title={version.status === 'draft' ? "Edit Draft" : "View details"}
                      >
                        {version.status === 'draft' ? <Edit className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    )}
                    <button
                      disabled={version.status !== 'draft'}
                      onClick={() => handlePublish(version.id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Publish"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button
                      disabled={version.is_primary || version.status !== 'published'}
                      onClick={() => handleSetPrimary(version.id)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Set as Primary"
                    >
                      <Star className={`h-5 w-5 ${version.is_primary ? 'text-yellow-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleArchive(version.id)}
                      disabled={version.status !== 'published'}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      title={version.status === 'published' ? "Archive version" : "Only published versions can be archived"}
                    >
                      <Archive className="h-5 w-5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
} 