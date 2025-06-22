'use client'

import { useState, useEffect } from 'react'
import { apiClient, Project } from '@/lib/api-client'

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
      console.log('Loading projects...')
      const projectsData = await apiClient.getProjects()
      console.log('Projects loaded:', projectsData)
      setProjects(projectsData)
      if (projectsData.length > 0) {
        setSelectedProjectId(projectsData[0].id)
      }
    } catch (error) {
      console.error('Failed to load projects:', error)
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
    const name = prompt('Enter project name:')
    if (!name) return

    const description = prompt('Enter project description (optional):')
    
    try {
      const newProject = await apiClient.createProject(name, description || undefined)
      setProjects([...projects, newProject])
      setSelectedProjectId(newProject.id)
      onProjectSelect(newProject.id)
    } catch (error) {
      console.error('Failed to create project:', error)
      alert('Failed to create project. Please check if the backend is running.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Knowledge Base
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select a project to get started with your knowledge base management.
          </p>
        </div>

        <div className="card max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connection Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={loadProjects}
              className="btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Knowledge Base
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select a project to get started with your knowledge base management.
        </p>
      </div>

      {projects.length > 0 ? (
        <div className="card max-w-2xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Select Project</h2>
          
          <div className="space-y-6">
            <div>
              <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <select
                id="project-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="input"
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleProjectSelect}
                className="btn-primary flex-1"
              >
                Continue
              </button>
              <button
                onClick={handleAddProject}
                className="btn-secondary flex-1"
              >
                New Project
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
            <p className="text-gray-600">
              Create your first project to get started with knowledge base management.
            </p>
          </div>
          <button
            onClick={handleAddProject}
            className="btn-primary"
          >
            Create Project
          </button>
        </div>
      )}
    </div>
  )
} 