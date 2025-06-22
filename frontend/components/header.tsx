'use client'

import { UserAccountMenu } from '@/components/user-account-menu'
import { ProjectSelector } from '@/components/project-selector'
import { ThemeToggle } from '@/components/theme-toggle'

interface HeaderProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
}

export function Header({ selectedProjectId, onProjectSelect }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-white px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 py-2 dark:bg-black dark:border-b dark:border-gray-800">
      <div>
        <ProjectSelector 
          selectedProjectId={selectedProjectId} 
          onProjectSelect={onProjectSelect} 
        />
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserAccountMenu />
      </div>
    </header>
  )
} 