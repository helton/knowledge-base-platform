'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import type { ActiveView } from '@/lib/types'
import { Sidebar } from '@/components/sidebar'
import { Documents } from '@/components/documents'
import { KnowledgeBases } from '@/components/knowledge-bases'
import { CreateKnowledgeBase } from '@/components/create-knowledge-base'
import { DocumentVersions } from '@/components/document-versions'
import { KnowledgeBaseDetailTabs } from '@/components/knowledge-base-detail-tabs'
import { CreateKbVersion } from '@/components/create-kb-version'
import { KbVersionDetail } from '@/components/kb-version-detail'
import { Welcome } from '@/components/welcome'
import { KnowledgeBase, Project, Document, DocumentVersion, KnowledgeBaseVersion } from '@/lib/api-client'
import { apiClient } from '@/lib/api-client'

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
  const [defaultTab, setDefaultTab] = useState<'overview' | 'documents' | 'versions'>('overview')

  useEffect(() => {
    if (selectedProjectId) {
      loadProject(selectedProjectId)
    } else {
      setProject(null)
    }
  }, [selectedProjectId])

  useEffect(() => {
    // When switching to a project-level view, reset the rest of the breadcrumb chain
    if (activeView === 'kbs' || activeView === 'create_kb') {
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
    setDefaultTab('overview')
    setActiveView('kb_detail')
  }

  const handleDocumentSelect = (document: Document) => {
    setSelectedDocument(document)
    setActiveView('document_versions')
  }

  const handleBackToDocuments = () => {
    setActiveView('kb_detail')
    setSelectedDocument(null)
    setSelectedDocumentVersion(null)
  }

  const handleBackToKbs = () => {
    setActiveView('kbs')
    setSelectedKb(null)
  }

  const handleCreateVersion = () => {
    // Always find the latest draft version object
    const draftVersion = versions.find((v: KnowledgeBaseVersion) => v.status === 'draft') || null;
    setSelectedKbVersion(draftVersion)
    setActiveView('create_kb_version')
  }

  const handleVersionCreated = () => {
    setDefaultTab('versions')
    setActiveView('kb_detail')
    // Refresh versions list
    if (selectedKb) {
      apiClient.getKbVersions(selectedKb.id).then(setVersions)
    }
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
    // Always use the actual version object from the versions list
    const realVersion = versions.find(v => v.id === version.id) || version;
    setSelectedKbVersion(realVersion)
    if (realVersion.status === 'draft') {
      setActiveView('create_kb_version')
    } else {
      setActiveView('kb_version_detail')
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header 
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
        project={project}
        knowledgeBase={selectedKb}
        document={selectedDocument}
        documentVersion={activeView === 'kb_version_detail' ? selectedDocumentVersion : null}
        onProjectClick={handleProjectClick}
        onKnowledgeBaseClick={handleKnowledgeBaseClick}
        onDocumentClick={handleDocumentClick}
        onDocumentVersionClick={handleDocumentVersionClick}
      />
      <div className="flex flex-1">
        <Sidebar 
          projectId={selectedProjectId}
          onSelectView={setActiveView}
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
          {activeView === 'document_versions' && selectedDocument && (
            <DocumentVersions
              documentId={selectedDocument.id}
              documentName={selectedDocument.name}
              onBack={handleBackToDocuments}
            />
          )}
          {activeView === 'create_kb_version' && selectedKb && (
            <CreateKbVersion
              kb={selectedKb}
              draftVersion={selectedKbVersion}
              onVersionCreated={handleVersionCreated}
              onCancel={() => setActiveView('kb_detail')}
            />
          )}
          {activeView === 'kb_detail' && selectedKb && (
            <KnowledgeBaseDetailTabs
              kb={selectedKb}
              onBack={handleBackToKbs}
              onDocumentSelect={handleDocumentSelect}
              onViewVersionDetails={handleKbVersionSelect}
              onCreateVersion={handleCreateVersion}
              defaultTab={defaultTab}
            />
          )}
          {activeView === 'kb_version_detail' && selectedKbVersion && (
            <KbVersionDetail
              kbVersion={selectedKbVersion}
              onBack={() => {
                setDefaultTab('versions');
                setActiveView('kb_detail');
              }}
            />
          )}
        </main>
      </div>
    </div>
  )
} 