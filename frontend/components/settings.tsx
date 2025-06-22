'use client'

interface SettingsProps {
  kbId: string | null;
}

export function Settings({ kbId }: SettingsProps) {
  if (!kbId) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">⚙️ Settings</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Please select a Knowledge Base from the sidebar to view its settings.</p>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⚙️ Settings</h2>
      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          Settings component coming soon! KB ID: {kbId}
        </p>
      </div>
    </div>
  )
} 