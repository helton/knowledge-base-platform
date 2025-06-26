'use client'

import React, { useState, useEffect } from 'react'
import { apiClient, KnowledgeBase, KnowledgeBaseVersion, Document } from '@/lib/api-client'
import { Plus, FileText, GitBranch, Star, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'

interface KnowledgeBasesProps {
  projectId: string
  onSelectView: (view: 'kbs' | 'documents' | 'create_kb' | 'document_versions' | 'kb_versions' | 'kb_detail' | 'kb_version_detail' | 'create_kb_version') => void
  onKbSelect: (kb: KnowledgeBase) => void
}

// Extended type for KB with counts
type KnowledgeBaseWithCounts = KnowledgeBase & {
  documentCount?: number
  versionCount?: number
  primaryVersion?: string
}

export function KnowledgeBases({ projectId, onSelectView, onKbSelect }: KnowledgeBasesProps) {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseWithCounts[]>([])
  const [filteredKnowledgeBases, setFilteredKnowledgeBases] = useState<KnowledgeBaseWithCounts[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadKnowledgeBases()
  }, [projectId])

  useEffect(() => {
    // Filter knowledge bases based on search query
    const filtered = knowledgeBases.filter(kb =>
      kb.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (kb.description && kb.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredKnowledgeBases(filtered)
  }, [knowledgeBases, searchQuery])

  const loadKnowledgeBases = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const kbs = await apiClient.getKnowledgeBases(projectId)
      
      // Load counts for each KB
      const kbsWithCounts = await Promise.all(
        kbs.map(async (kb) => {
          try {
            const [documents, versions] = await Promise.all([
              apiClient.getDocumentsByKb(kb.id),
              apiClient.getKnowledgeBaseVersions(kb.id)
            ])
            
            const primaryVersion = versions.find(v => v.is_primary)
            
            return {
              ...kb,
              documentCount: documents.length,
              versionCount: versions.length,
              primaryVersion: primaryVersion?.version_number || 'None'
            }
          } catch (error) {
            console.error(`Failed to load counts for KB ${kb.id}:`, error)
            return {
              ...kb,
              documentCount: 0,
              versionCount: 0,
              primaryVersion: 'None'
            }
          }
        })
      )
      
      setKnowledgeBases(kbsWithCounts)
    } catch (error) {
      console.error('Failed to load knowledge bases:', error)
      setError('Failed to load knowledge bases. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKbClick = (kb: KnowledgeBase) => {
    onKbSelect(kb)
    onSelectView('kb_detail')
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Knowledge Bases
        </h1>
        <Button
          onClick={() => onSelectView('create_kb')}
          className="flex items-center gap-2"
        >
          Create Knowledge Base
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge bases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Found {filteredKnowledgeBases.length} knowledge base{filteredKnowledgeBases.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {knowledgeBases.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-2">
              No Knowledge Bases
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first knowledge base to get started.
            </p>
            <Button
              onClick={() => onSelectView('create_kb')}
            >
              Create Knowledge Base
            </Button>
          </div>
        </div>
      ) : filteredKnowledgeBases.length === 0 ? (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKnowledgeBases.map((kb) => (
            <Card
              key={kb.id}
              onClick={() => handleKbClick(kb)}
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle className="text-lg">{kb.name}</CardTitle>
                {kb.description && (
                  <CardDescription className="line-clamp-2">
                    {kb.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>Documents</span>
                    </div>
                    <Badge variant="secondary">
                      {kb.documentCount || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GitBranch className="h-4 w-4" />
                      <span>Versions</span>
                    </div>
                    <Badge variant="secondary">
                      {kb.versionCount || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Star className="h-4 w-4" />
                      <span>Primary</span>
                    </div>
                    <Badge variant="outline">
                      {kb.primaryVersion}
                    </Badge>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  Click to view details
                </p>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 