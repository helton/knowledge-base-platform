'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Documents } from '@/components/documents'
import { KnowledgeBases } from '@/components/knowledge-bases'
import { Settings } from '@/components/settings'
import { KnowledgeBase, Project, Document, DocumentVersion, KnowledgeBaseVersion } from '@/lib/api-client'
import { apiClient } from '@/lib/api-client'
import { CreateKnowledgeBase } from '@/components/create-knowledge-base'
import { DocumentVersions } from '@/components/document-versions'
import { KnowledgeBaseVersions } from '@/components/knowledge-base-versions'
import { CreateKbVersion } from '@/components/create-kb-version'
import { KnowledgeBaseDetail } from '@/components/knowledge-base-detail'
import { KbVersionDetail } from '@/components/kb-version-detail'

type ActiveView = 'kbs' | 'documents' | 'settings' | 'create_kb' | 'document_versions' | 'kb_versions' | 'kb_detail' | 'kb_version_detail' | 'create_kb_version'

export default function Page() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null)
  const [selectedDocumentVersion, setSelectedDocumentVersion] = useState<DocumentVersion | null>(null)
  const [selectedKbVersion, setSelectedKbVersion] = useState<KnowledgeBaseVersion | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('kbs')
  const [project, setProject] = useState<Project | null>(null)
  const [versions, setVersions] = useState<KnowledgeBaseVersion[]>([])
  const [currentView, setCurrentView] = useState('welcome')

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

  useEffect(() => {
    if (selectedKb) {
      apiClient.getKbVersions(selectedKb.id).then(setVersions)
    }
  }, [selectedKb])

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
    setActiveView('kb_versions')
  }

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document)
    setActiveView('document_versions')
  }

  const handleBackToDocuments = () => {
    setActiveView('documents')
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
  }

  const handleBackToKbs = () => {
    setActiveView('kbs')
    setSelectedKb(null)
  }

  const handleBackToKbVersions = () => {
    setActiveView('kb_versions')
  }

  const handleCreateVersion = () => {
    const draftVersion = versions.find((v: KnowledgeBaseVersion) => v.status === 'draft')
    setSelectedKbVersion(draftVersion || null)
    setActiveView('create_kb_version')
  }

  const handleVersionCreated = () => {
    setActiveView('kb_versions')
  }

  const handleViewKbVersions = () => {
    setActiveView('kb_versions')
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
    setActiveView('kb_detail')
  }

  const handleDocumentClick = () => {
    setSelectedDocumentVersion(null)
  }

  const handleDocumentVersionClick = () => {
    // Already on document version view
  }

  const handleKbVersionSelect = (version: KnowledgeBaseVersion) => {
    setSelectedKbVersion(version)
    setActiveView('kb_version_detail')
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
          onSelectView={(view: ActiveView) => setActiveView(view)}
        />
        <main className="flex-1 p-6 overflow-auto">
          {activeView === 'kbs' && selectedProjectId && (
            <KnowledgeBases
              projectId={selectedProjectId}
              onKbSelect={handleKbSelect}
              onSelectView={(view: ActiveView) => setActiveView(view)}
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
              onViewVersions={() => setActiveView('kb_versions')}
            />
          )}
          {activeView === 'document_versions' && selectedDocument && (
            <DocumentVersions
              document={selectedDocument}
              onVersionSelect={setSelectedDocumentVersion}
              onBack={handleBackToDocuments}
            />
          )}
          {activeView === 'kb_versions' && selectedKb && (
            <KnowledgeBaseVersions
              kb={selectedKb}
              onViewDocuments={() => setActiveView('documents')}
              onCreateVersion={handleCreateVersion}
              onViewVersionDetails={handleKbVersionSelect}
              onBack={handleBackToKbs}
            />
          )}
          {activeView === 'create_kb_version' && selectedKb && (
            <CreateKbVersion
              kb={selectedKb}
              draftVersion={selectedKbVersion}
              onVersionCreated={handleVersionCreated}
              onCancel={handleBackToKbVersions}
            />
          )}
          {activeView === 'settings' && <Settings kbId={selectedKb?.id || null} />}
          {activeView === 'kb_detail' && selectedKb && (
            <KnowledgeBaseDetail
              kb={selectedKb}
              onViewDocuments={() => setActiveView('documents')}
              onViewVersions={() => setActiveView('kb_versions')}
              onBack={() => setActiveView('kbs')}
            />
          )}
          {activeView === 'kb_version_detail' && selectedKbVersion && (
            <KbVersionDetail
              kbVersion={selectedKbVersion}
              onBack={() => setActiveView('kb_versions')}
            />
          )}
        </main>
      </div>
    </div>
  )
} 