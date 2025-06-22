'use client'

interface SettingsProps {
  kbId: string
}

export function Settings({ kbId }: SettingsProps) {
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