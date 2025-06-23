'use client'

import { UserAccountMenu } from '@/components/user-account-menu'
import { ProjectSelector } from '@/components/project-selector'
import { ThemeToggle } from '@/components/theme-toggle'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Project, KnowledgeBase, Document, DocumentVersion } from '@/lib/api-client'

interface HeaderProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
  project?: Project | null
  knowledgeBase?: KnowledgeBase | null
  document?: Document | null
  documentVersion?: DocumentVersion | null
  onProjectClick?: () => void
  onKnowledgeBaseClick?: () => void
  onDocumentClick?: () => void
  onDocumentVersionClick?: () => void
}

export function Header({ 
  selectedProjectId, 
  onProjectSelect,
  project,
  knowledgeBase,
  document,
  documentVersion,
  onProjectClick,
  onKnowledgeBaseClick,
  onDocumentClick,
  onDocumentVersionClick
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 dark:bg-black dark:border-b dark:border-gray-800">
      <div>
        <ProjectSelector 
          selectedProjectId={selectedProjectId} 
          onProjectSelect={onProjectSelect} 
        />
      </div>
      
      <div className="flex-1 flex justify-center">
        <Breadcrumbs
          project={project}
          knowledgeBase={knowledgeBase}
          document={document}
          documentVersion={documentVersion}
          onProjectClick={onProjectClick}
          onKnowledgeBaseClick={onKnowledgeBaseClick}
          onDocumentClick={onDocumentClick}
          onDocumentVersionClick={onDocumentVersionClick}
        />
      </div>
      
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserAccountMenu />
      </div>
    </header>
  )
} 