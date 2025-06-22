'use client'

import { useState } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Documents } from '@/components/documents'
import { KnowledgeBases } from '@/components/knowledge-bases'
import { Settings } from '@/components/settings'
import { KnowledgeBase } from '@/lib/api-client'

type ActiveView = 'kbs' | 'documents' | 'settings'

export default function Page() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null)
  const [activeView, setActiveView] = useState<ActiveView>('kbs')

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedKb(null)
    setActiveView('kbs')
  }

  const handleKbSelect = (kb: KnowledgeBase) => {
    setSelectedKb(kb)
    setActiveView('documents')
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50 dark:bg-black">
      <Header 
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
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
            />
          )}
          {activeView === 'documents' && selectedKb && (
            <Documents kbId={selectedKb.id} />
          )}
          {activeView === 'settings' && <Settings kbId={selectedKb?.id || null} />}
        </main>
      </div>
    </div>
  )
} 