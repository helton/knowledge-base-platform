'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Documents } from '@/components/documents'
import { KnowledgeBases } from '@/components/knowledge-bases'
import { Settings } from '@/components/settings'
import { KnowledgeBase, Project, Document, DocumentVersion } from '@/lib/api-client'
import { apiClient } from '@/lib/api-client'
import { CreateKnowledgeBase } from '@/components/create-knowledge-base'
import { DocumentVersions } from '@/components/document-versions'

type ActiveView = 'kbs' | 'documents' | 'settings' | 'create_kb' | 'document_versions'

export default function Page() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedDocumentVersion, setSelectedDocumentVersion] = useState<DocumentVersion | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('kbs')
  const [project, setProject] = useState<Project | null>(null)

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId)
    } else {
      setProject(null)
    }
  }, [selectedProjectId])

  useEffect(() => {
    // When switching to a project-level view, reset the rest of the breadcrumb chain
    if (activeView === 'kbs' || activeView === 'create_kb' || activeView === 'settings') {
      setSelectedKb(null)
      setSelectedDocument(null)
      setSelectedDocumentVersion(null)
    }
  }, [activeView])

  const loadProject = async (projectId: string) => {
    try {
      const projectData = await apiClient.getProject(projectId)
      setProject(projectData)
    } catch (error) {
      console.error('Failed to load project:', error)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedKb(null)
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
    setActiveView('kbs')
  }

  const handleKbSelect = (kb: KnowledgeBase) => {
    setSelectedKb(kb)
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
    setActiveView('documents')
  }

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDocument(doc)
    setActiveView('document_versions')
  }

  const handleBackToDocuments = () => {
    setActiveView('documents')
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
  }

  const handleProjectClick = () => {
    setSelectedKb(null)
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
    setActiveView('kbs')
  }

  const handleKnowledgeBaseClick = () => {
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
    setActiveView('documents')
  }

  const handleDocumentClick = () => {
    setSelectedDocumentVersion(null)
  }

  const handleDocumentVersionClick = () => {
    // Already on document version view
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-black">
      <Header 
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
        project={project}
        knowledgeBase={selectedKb}
        document={selectedDocument}
        documentVersion={selectedDocumentVersion}
        onProjectClick={handleProjectClick}
        onKnowledgeBaseClick={handleKnowledgeBaseClick}
        onDocumentClick={handleDocumentClick}
        onDocumentVersionClick={handleDocumentVersionClick}
      />
      <div className="flex flex-1">
        <Sidebar 
          projectId={selectedProjectId}
          onSelectKb={handleKbSelect}
          onSelectView={setActiveView}
        />
        <main className="flex-1 p-6 overflow-auto">
          {activeView === 'kbs' && selectedProjectId && (
            <KnowledgeBases 
              projectId={selectedProjectId} 
              onKbSelect={handleKbSelect}
              onSelectView={setActiveView}
            />
          )}
          {activeView === 'create_kb' && selectedProjectId && (
            <CreateKnowledgeBase
              projectId={selectedProjectId}
              onKbCreated={handleKbSelect}
            />
          )}
          {activeView === 'documents' && selectedKb && (
            <Documents 
              selectedKb={selectedKb}
              onDocumentSelect={handleDocumentSelect}
            />
          )}
          {activeView === 'document_versions' && selectedDocument && (
            <DocumentVersions
              document={selectedDocument}
              onVersionSelect={setSelectedDocumentVersion}
              onBack={handleBackToDocuments}
            />
          )}
          {activeView === 'settings' && <Settings kbId={selectedKb?.id || null} />}
        </main>
      </div>
    </div>
  )
} 