'use client'

import { useState } from 'react'
import { apiClient, KnowledgeBase } from '@/lib/api-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
        {
          name: newKbName.trim(),
          description: newKbDescription.trim()
        }
      )
      onKbCreated(newKb)
    } catch (error) {
      console.error('Failed to create knowledge base:', error)
      alert('Failed to create knowledge base. Please try again.')
      setIsCreating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Knowledge Base</CardTitle>
        <CardDescription>
          Create a new knowledge base to organize your documents and versions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="kb-name">Name *</Label>
          <Input
            id="kb-name"
            type="text"
            value={newKbName}
            onChange={(e) => setNewKbName(e.target.value)}
            placeholder="e.g., 'Product Documentation'"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kb-description">Description</Label>
          <textarea
            id="kb-description"
            value={newKbDescription}
            onChange={(e) => setNewKbDescription(e.target.value)}
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="A brief description of what this knowledge base contains."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="kb-access">Access Level</Label>
          <select
            id="kb-access"
            value={newKbAccessLevel}
            onChange={(e) => setNewKbAccessLevel(e.target.value as 'private' | 'protected' | 'public')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="private">Private</option>
            <option value="protected">Protected</option>
            <option value="public">Public</option>
          </select>
        </div>
        <div className="flex items-center space-x-3 pt-4">
          <Button
            onClick={handleCreateKnowledgeBase}
            disabled={!newKbName.trim() || isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Knowledge Base'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 