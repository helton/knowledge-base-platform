'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient, Project } from '@/lib/api-client'

interface ProjectSelectorProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
}

export function ProjectSelector({ selectedProjectId, onProjectSelect }: ProjectSelectorProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const loadProjects = async () => {
    setIsLoading(true)
    try {
      const projectsData = await apiClient.getProjects()
      setProjects(projectsData)
      if (!selectedProjectId && projectsData.length > 0) {
        onProjectSelect(projectsData[0].id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (projectId: string) => {
    onProjectSelect(projectId)
    setIsOpen(false)
  }

  const currentProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="relative text-sm" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-openai-dark-light transition-colors"
      >
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {currentProject?.name || 'Select Project'}
        </span>
        <svg
          className="w-4 h-4 text-gray-500 dark:text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 9l4-4 4 4m0 6l-4 4-4-4"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-60 bg-white dark:bg-openai-dark-light rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
              PROJECTS
            </div>
            <div className="mt-1">
              {isLoading ? (
                <div className="px-2 py-1.5 text-sm text-gray-500">Loading...</div>
              ) : (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md flex items-center gap-2 ${
                      project.id === selectedProjectId
                        ? 'bg-gray-100 dark:bg-gray-900/50 text-gray-900 dark:text-gray-100'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        project.id === selectedProjectId ? 'opacity-100' : 'opacity-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{project.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 