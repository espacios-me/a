import React, { useState, useEffect } from 'react'
import { Github, ExternalLink, Lock, Globe, Calendar } from 'lucide-react'

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
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-slate-300">Loading repositories...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4 backdrop-blur-sm">
        <p className="text-red-300">Error: {error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Github className="w-6 h-6 text-blue-400" />
        <h2 className="text-2xl font-bold text-white">GitHub Repositories</h2>
        <span className="ml-auto text-sm text-slate-400">{filteredRepos.length} repositories</span>
      </div>

      {/* Search and Sort Controls */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 backdrop-blur-sm transition"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'updated' | 'name')}
          className="px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 backdrop-blur-sm transition"
        >
          <option value="updated">Recently Updated</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      {/* Repository Grid */}
      {filteredRepos.length === 0 ? (
        <div className="text-center py-12 bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-lg border border-slate-700/50 backdrop-blur-sm">
          <Github className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No repositories found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRepos.map((repo) => (
            <a
              key={repo.id}
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-gradient-to-br from-slate-900/50 to-slate-800/50 border border-slate-700/50 rounded-lg p-4 backdrop-blur-sm hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300"
            >
              {/* Repository Name */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition truncate">
                  {repo.name}
                </h3>
                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition flex-shrink-0 ml-2" />
              </div>

              {/* Full Name */}
              <p className="text-sm text-slate-400 mb-3 truncate">{repo.fullName}</p>

              {/* Description */}
              {repo.description && (
                <p className="text-sm text-slate-300 mb-4 line-clamp-2">{repo.description}</p>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  {repo.private ? (
                    <>
                      <Lock className="w-3 h-3" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3" />
                      <span>Public</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(repo.updatedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export default GitHubReposBrowser
