'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings } from 'lucide-react'

export function UserAccountMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="relative" ref={menuRef}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-full"
      >
        <User className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-background rounded-md shadow-lg border z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium">Helton Souza</p>
            <p className="text-sm text-muted-foreground">heltoncarlossouza@gmail.com</p>
          </div>
          <div className="py-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-sm h-auto"
            >
              <Settings className="mr-2 h-4 w-4" />
              Your profile
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start px-4 py-2 text-sm h-auto"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 