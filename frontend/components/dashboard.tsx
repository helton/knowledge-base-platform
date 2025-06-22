'use client'

interface DashboardProps {
  projectId: string
  kbId?: string
}

export function Dashboard({ projectId, kbId }: DashboardProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">📊 Dashboard</h2>
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          Dashboard component coming soon! Project ID: {projectId}
          {kbId && `, KB ID: ${kbId}`}
        </p>
      </div>
    </div>
  )
} 