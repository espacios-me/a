import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'

interface Repository {
  id: number
  name: string
  fullName: string
  description: string | null
  htmlUrl: string
  private: boolean
  updatedAt: string
}

interface GitHubReposBrowserProps {
  accessToken: string
}

export const GitHubReposBrowser: React.FC<GitHubReposBrowserProps> = ({ accessToken }) => {
  const [repos, setRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'name'>('updated')

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/trpc/github.getRepos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch repositories')
        }

        const data = await response.json()
        setRepos(data.result.data || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setRepos([])
      } finally {
        setLoading(false)
      }
    }

    if (accessToken) {
      fetchRepos()
    }
  }, [accessToken])

  const filteredRepos = repos
    .filter((repo) =>
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white mb-3"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading repositories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card variant="flat">
        <CardContent>
          <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">GitHub Repositories</h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">{filteredRepos.length} repositories</span>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-black dark:focus:border-white transition-smooth"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
          className="px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-smooth"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Repository Grid */}
      {filteredRepos.length === 0 ? (
        <Card variant="flat">
          <CardContent className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No repositories found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <a
              key={repo.id}
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group card-ios hover:shadow-lg p-4"
            >
              {/* Repository Name */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-black dark:text-white group-hover:opacity-80 transition truncate">
                  {repo.name}
                </h3>
              </div>

              {/* Full Name */}
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 truncate">{repo.fullName}</p>

              {/* Description */}
              {repo.description && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">{repo.description}</p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-800">
                <span>{repo.private ? '🔒 Private' : '🌐 Public'}</span>
                <span>📅 {formatDate(repo.updatedAt)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default GitHubReposBrowser
