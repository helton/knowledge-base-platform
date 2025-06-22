'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { KnowledgeBases } from '@/components/knowledge-bases'
import { Documents } from '@/components/documents'
import { Settings } from '@/components/settings'
import { Welcome } from '@/components/welcome'
import { apiClient } from '@/lib/api-client'

export default function Home() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if we have stored selections in localStorage
    const storedProjectId = localStorage.getItem('selectedProjectId')
    const storedKbId = localStorage.getItem('selectedKbId')
    
    if (storedProjectId) {
      setSelectedProjectId(storedProjectId)
    }
    if (storedKbId) {
      setSelectedKbId(storedKbId)
    }
    
    setIsLoading(false)
  }, [])

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedKbId(null) // Reset KB selection
    localStorage.setItem('selectedProjectId', projectId)
    localStorage.removeItem('selectedKbId')
  }

  const handleKbSelect = (kbId: string) => {
    setSelectedKbId(kbId)
    localStorage.setItem('selectedKbId', kbId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        selectedProjectId={selectedProjectId}
        onProjectSelect={handleProjectSelect}
      />
      
      <div className="flex">
        <Sidebar 
          selectedProjectId={selectedProjectId}
          selectedKbId={selectedKbId}
          onKbSelect={handleKbSelect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 p-8">
          {!selectedProjectId ? (
            <Welcome onProjectSelect={handleProjectSelect} />
          ) : !selectedKbId ? (
            <div>
              {activeTab === 'dashboard' && (
                <Dashboard projectId={selectedProjectId} />
              )}
              {activeTab === 'knowledge-bases' && (
                <KnowledgeBases 
                  projectId={selectedProjectId}
                  onKbSelect={handleKbSelect}
                />
              )}
            </div>
          ) : (
            <div>
              {activeTab === 'overview' && (
                <Dashboard projectId={selectedProjectId} kbId={selectedKbId} />
              )}
              {activeTab === 'documents' && (
                <Documents kbId={selectedKbId} />
              )}
              {activeTab === 'settings' && (
                <Settings kbId={selectedKbId} />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
} 