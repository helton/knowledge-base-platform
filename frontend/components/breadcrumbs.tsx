'use client'

import { useState } from 'react'
import { Project, KnowledgeBase, Document, DocumentVersion } from '@/lib/api-client'
import { Copy, Check, LayoutGrid, Library, FileText, FileClock } from 'lucide-react'

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
    <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <div className="flex items-center space-x-2">
            <item.Icon className="w-4 h-4 text-gray-500" />
            <div className="flex flex-col text-left">
              <button
                onClick={item.onClick}
                disabled={!item.onClick}
                className={`hover:text-gray-900 dark:hover:text-gray-100 transition-colors ${
                  item.onClick ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <span className="font-medium">{item.label}</span>
              </button>
              {item.id && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                    {item.id}
                  </span>
                  <button onClick={() => handleCopy(item.id!)} className="p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                    {copiedId === item.id ? (
                      <Check className="w-3 h-3 text-green-500" />
                    ) : (
                      <Copy className="w-3 h-3 text-gray-500" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </nav>
  )
} 