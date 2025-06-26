'use client'

import { useState, useEffect, useRef } from 'react'
import { apiClient, Project } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User, ChevronDown, Plus } from 'lucide-react'

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
      const newProject = await apiClient.createProject({
        name,
        description: description || ''
      })
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
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        className="flex items-center space-x-2"
      >
        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="hidden sm:block">{currentProject?.name || 'Select Project'}</span>
        <ChevronDown className="w-4 h-4" />
      </Button>

      {isOpen && (
        <Card className="absolute right-0 mt-2 w-64 z-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Projects</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-2">
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Loading projects...</div>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <Button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  variant={selectedProjectId === project.id ? "default" : "ghost"}
                  className="w-full justify-start h-auto p-3"
                >
                  <div className="text-left">
                    <div className="font-medium">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-muted-foreground truncate">{project.description}</div>
                    )}
                  </div>
                </Button>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No projects found</div>
            )}
          </CardContent>
          
          <div className="border-t p-3">
            <Button
              onClick={handleAddProject}
              variant="ghost"
              className="w-full justify-start h-auto p-3"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Project</span>
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
} 