import React from 'react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'

export default function NotFound() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-2xl font-semibold text-black dark:text-white mb-2">Page Not Found</p>
        <p className="text-gray-600 dark:text-gray-400 mb-8">The page you're looking for doesn't exist.</p>
        <Button
          onClick={() => setLocation('/')}
          variant="primary"
        >
          Back to Home
        </Button>
      </div>
    </div>
  )
}
