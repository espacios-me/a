import React from 'react'
import { Button } from '@/components/ui/button'
import { useLocation } from 'wouter'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  const [, setLocation] = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">404</h1>
        <p className="text-2xl text-slate-300 mb-2">Page Not Found</p>
        <p className="text-slate-400 mb-8">The page you're looking for doesn't exist.</p>
        <Button
          onClick={() => setLocation('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
    </div>
  )
}
