'use client'

import { UserMenu } from './user-menu'

interface HeaderProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
}

export function Header({ selectedProjectId, onProjectSelect }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-semibold text-gray-900">
                Knowledge Base
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <UserMenu 
              selectedProjectId={selectedProjectId}
              onProjectSelect={onProjectSelect}
            />
          </div>
        </div>
      </div>
    </header>
  )
} 