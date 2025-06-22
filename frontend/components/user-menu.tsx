'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient, Project } from '@/lib/api-client'

interface UserMenuProps {
  selectedProjectId: string | null
  onProjectSelect: (projectId: string) => void
}

export function UserMenu({ selectedProjectId, onProjectSelect }: UserMenuProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      console.log('Loading projects in user menu...')
      const projectsData = await apiClient.getProjects()
      console.log('Projects loaded in user menu:', projectsData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Failed to load projects in user menu:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectSelect = (projectId: string) => {
    onProjectSelect(projectId)
    setIsOpen(false)
  }

  const handleAddProject = async () => {
    const name = prompt('Enter project name:')
    if (!name) return

    const description = prompt('Enter project description (optional):')
    
    try {
      const newProject = await apiClient.createProject(name, description || undefined)
      setProjects([...projects, newProject])
      onProjectSelect(newProject.id)
      setIsOpen(false)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please check if the backend is running.')
    }
  }

  const currentProject = projects.find(p => p.id === selectedProjectId)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
      >
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <span className="hidden sm:block">{currentProject?.name || 'Select Project'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Projects</h3>
          </div>
          
          <div className="py-2">
            {isLoading ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading projects...</div>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors duration-200 ${
                    selectedProjectId === project.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <div className="font-medium">{project.name}</div>
                  {project.description && (
                    <div className="text-xs text-gray-500 truncate">{project.description}</div>
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500">No projects found</div>
            )}
          </div>
          
          <div className="px-4 py-2 border-t border-gray-200">
            <button
              onClick={handleAddProject}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Create New Project</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 