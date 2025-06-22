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
      const newProject = await apiClient.createProject(name, '') // Ensure description is not null
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Welcome to Knowledge Base
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12">
          Select a project or create a new one to get started.
        </p>

        {error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg p-4 max-w-md mx-auto">
            <p>{error}</p>
            <button onClick={loadProjects} className="mt-2 font-semibold hover:underline">
              Retry
            </button>
          </div>
        ) : projects.length > 0 ? (
          <div className="bg-white dark:bg-openai-dark-light rounded-xl shadow-lg p-8 w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Select Project</h2>
            <div className="space-y-6">
              <div>
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 dark:text-gray-400 mb-2 text-left">
                  Project
                </label>
                <select
                  id="project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleProjectSelect}
                  className="w-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Continue
                </button>
                <button
                  onClick={handleAddProject}
                  className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  New Project
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-openai-dark-light rounded-xl shadow-lg p-8 w-full max-w-md mx-auto">
            <div className="mb-6">
              <div className="mx-auto h-12 w-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No projects yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Create your first project to get started.
              </p>
            </div>
            <button
              onClick={handleAddProject}
              className="w-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 