'use client'

import { useState } from 'react'
import { Project, KnowledgeBase, Document, DocumentVersion } from '@/lib/api-client'
import { Copy, Check, LayoutGrid, Library, FileText, FileClock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BreadcrumbItem {
  label: string
  id?: string
  onClick?: () => void
  Icon: React.ElementType
}

interface BreadcrumbsProps {
  project?: Project | null
  knowledgeBase?: KnowledgeBase | null
  document?: Document | null
  documentVersion?: DocumentVersion | null
  onProjectClick?: () => void
  onKnowledgeBaseClick?: () => void
  onDocumentClick?: () => void
  onDocumentVersionClick?: () => void
}

export function Breadcrumbs({
  project,
  knowledgeBase,
  document,
  documentVersion,
  onProjectClick,
  onKnowledgeBaseClick,
  onDocumentClick,
  onDocumentVersionClick
}: BreadcrumbsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const breadcrumbs: BreadcrumbItem[] = []

  // Add project
  if (project) {
    breadcrumbs.push({
      label: project.name,
      id: project.id,
      onClick: onProjectClick,
      Icon: LayoutGrid
    })
  }

  // Add knowledge base
  if (knowledgeBase) {
    breadcrumbs.push({
      label: knowledgeBase.name,
      id: knowledgeBase.id,
      onClick: onKnowledgeBaseClick,
      Icon: Library
    })
  }

  // Add document
  if (document) {
    breadcrumbs.push({
      label: document.name,
      id: document.id,
      onClick: onDocumentClick,
      Icon: FileText
    })
  }

  // Add document version
  if (documentVersion) {
    breadcrumbs.push({
      label: `v${documentVersion.version_number}`,
      id: documentVersion.id,
      onClick: onDocumentVersionClick,
      Icon: FileClock
    })
  }

  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
          )}
          <div className="flex items-center space-x-2">
            <item.Icon className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-col text-left">
              <Button
                onClick={item.onClick}
                disabled={!item.onClick}
                variant="ghost"
                size="sm"
                className={`h-auto p-0 hover:text-foreground transition-colors ${
                  item.onClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="font-medium">{item.label}</span>
              </Button>
              {item.id && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.id}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(item.id!)}
                    className="h-auto p-0.5 hover:bg-muted"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </nav>
  )
} 