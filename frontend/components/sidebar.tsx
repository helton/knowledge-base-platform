'use client'

import { apiClient, KnowledgeBase } from '@/lib/api-client'
import type { ActiveView } from '@/lib/types'
import { Dispatch, SetStateAction } from 'react'
import { Button } from '@/components/ui/button'

interface SidebarProps {
  projectId: string | null
  onSelectView: React.Dispatch<React.SetStateAction<ActiveView>>
}

export function Sidebar({ projectId, onSelectView }: SidebarProps) {
  const handleListKbs = () => {
    onSelectView('kbs')
  }

  const handleCreateKbClick = () => {
    onSelectView('create_kb')
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-background p-4">
      <nav className="space-y-2">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">
            Knowledge Bases
          </h3>
          <div className="space-y-1">
            <Button
              onClick={handleListKbs}
              disabled={!projectId}
              variant="ghost"
              className="w-full justify-start"
            >
              List Knowledge Bases
            </Button>
            <Button
              onClick={handleCreateKbClick}
              disabled={!projectId}
              variant="ghost"
              className="w-full justify-start"
            >
              Create Knowledge Base
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  )
} 