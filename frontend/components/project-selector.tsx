'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient, Project } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Check, ChevronDown, Loader2 } from 'lucide-react'

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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center gap-2 px-2 py-1.5 h-auto"
      >
        <span className="font-medium">
          {currentProject?.name || 'Select Project'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </Button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-60 bg-background rounded-lg shadow-lg border z-50 overflow-hidden">
          <div className="p-2">
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              PROJECTS
            </div>
            <div className="mt-1">
              {isLoading ? (
                <div className="px-2 py-1.5 text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </div>
              ) : (
                projects.map(project => (
                  <Button
                    key={project.id}
                    onClick={() => handleSelect(project.id)}
                    variant="ghost"
                    className={`w-full justify-start px-2 py-1.5 text-sm h-auto ${
                      project.id === selectedProjectId
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <Check
                      className={`w-4 h-4 mr-2 ${
                        project.id === selectedProjectId ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span>{project.name}</span>
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 