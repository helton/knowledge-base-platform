'use client'

import { useState } from 'react'
import { apiClient, KnowledgeBase } from '@/lib/api-client'
import { useRouter } from 'next/navigation'

interface CreateKnowledgeBaseProps {
  projectId: string
  onKbCreated: (kb: KnowledgeBase) => void
}

export function CreateKnowledgeBase({ projectId, onKbCreated }: CreateKnowledgeBaseProps) {
  const [newKbName, setNewKbName] = useState('')
  const [newKbDescription, setNewKbDescription] = useState('')
  const [newKbAccessLevel, setNewKbAccessLevel] = useState<'private' | 'protected' | 'public'>('private')
  const [isCreating, setIsCreating] = useState(false)
  
  const handleCreateKnowledgeBase = async () => {
    if (!newKbName.trim()) return
    setIsCreating(true)
    try {
      const newKb = await apiClient.createKnowledgeBase(
        projectId,
        newKbName.trim(),
        newKbDescription.trim(),
        newKbAccessLevel
      )
      onKbCreated(newKb)
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      alert('Failed to create knowledge base. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Create New Knowledge Base</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="kb-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name *
          </label>
          <input
            id="kb-name"
            type="text"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            className="input-field w-full"
            placeholder="e.g., 'Product Documentation'"
          />
        </div>
        <div>
          <label htmlFor="kb-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="kb-description"
            value={newKbDescription}
            onChange={(e) => setNewKbDescription(e.target.value)}
            rows={3}
            className="input-field w-full"
            placeholder="A brief description of what this knowledge base contains."
          />
        </div>
        <div>
          <label htmlFor="kb-access" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Access Level
          </label>
          <select
            id="kb-access"
            value={newKbAccessLevel}
            onChange={(e) => setNewKbAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
            className="input-field w-full"
          >
            <option value="private">Private</option>
            <option value="protected">Protected</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div className="flex items-center space-x-3 pt-4">
          <button
            onClick={handleCreateKnowledgeBase}
            disabled={!newKbName.trim() || isCreating}
            className="btn btn-primary"
          >
            {isCreating ? 'Creating...' : 'Create Knowledge Base'}
          </button>
        </div>
      </div>
    </div>
  )
} 