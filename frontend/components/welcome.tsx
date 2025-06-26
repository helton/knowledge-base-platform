'use client'

import { useState, useEffect } from 'react'
import { apiClient, Project } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, FolderOpen } from 'lucide-react'

interface WelcomeProps {
  onProjectSelect: (projectId: string) => void
}

export function Welcome({ onProjectSelect }: WelcomeProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const projectsData = await apiClient.getProjects()
      setProjects(projectsData)
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id)
      }
    } catch (err) {
      setError('Failed to load projects. Please check if the backend is running.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProjectSelect = () => {
    if (selectedProjectId) {
      onProjectSelect(selectedProjectId)
    }
  }

  const handleAddProject = async () => {
    const name = prompt('Enter new project name:')
    if (!name) return
    try {
      const newProject = await apiClient.createProject({ name, description: '' })
      setProjects([...projects, newProject])
      setSelectedProjectId(newProject.id)
      onProjectSelect(newProject.id)
    } catch (err) {
      alert('Failed to create project. Please check if the backend is running.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Knowledge Base
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
          Select a project or create a new one to get started.
        </p>

        {error ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadProjects} variant="outline" className="mt-2">
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : projects.length > 0 ? (
          <Card className="w-full max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Select Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="project-select">Project</Label>
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  onClick={handleProjectSelect}
                  className="w-full"
                >
                  Continue
                </Button>
                <Button
                  onClick={handleAddProject}
                  variant="outline"
                  className="w-full"
                >
                  New Project
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="mb-6">
                <div className="mx-auto h-12 w-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                <p className="text-muted-foreground">
                  Create your first project to get started.
                </p>
              </div>
              <Button
                onClick={handleAddProject}
                className="w-full"
              >
                Create Project
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 