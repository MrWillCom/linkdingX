import { useState, useEffect } from 'react'
import { Card, Link, Chip, Spinner, Button } from '@heroui/react'

interface Bookmark {
  id: number
  url: string
  title: string
  description: string
  notes: string
  web_archive_snapshot_url: string
  favicon_url: string
  preview_image_url: string
  is_archived: boolean
  unread: boolean
  shared: boolean
  tag_names: string[]
  date_added: string
  date_modified: string
}

interface BookmarksResponse {
  count: number
  next: string | null
  previous: string | null
  results: Bookmark[]
}

const serverStorage = storage.defineItem<string>('local:server', {
  fallback: '',
})

const apiTokenStorage = storage.defineItem<string>('local:apiToken', {
  fallback: '',
})

async function fetchBookmarks(): Promise<Bookmark[]> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) {
    return []
  }

  const url = `${server}/api/bookmarks/`
  const options: RequestInit = {
    headers: {
      Authorization: `Token ${apiToken}`,
    },
  }

  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url,
    options,
  })

  if (!response.ok) {
    throw new Error(response.data?.detail || 'Failed to fetch bookmarks')
  }

  return response.data.results as Bookmark[]
}

export default function BookmarksList() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBookmarks()
      .then(data => {
        setBookmarks(data)
        setIsLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setIsLoading(false)
      })
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return <div className="p-4 text-danger">Error: {error}</div>
  }

  if (bookmarks.length === 0) {
    return (
      <div className="p-4">
        <p>No bookmarks yet.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {bookmarks.map(bookmark => (
        <Card key={bookmark.id} className="p-4">
          <div className="flex flex-col gap-2">
            <Link href={bookmark.url} target="_blank" className="font-semibold">
              {bookmark.title || bookmark.url}
            </Link>
            {bookmark.description && (
              <p className="text-sm text-default-600 line-clamp-2">
                {bookmark.description}
              </p>
            )}
            {bookmark.tag_names.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {bookmark.tag_names.map(tag => (
                  <Chip key={tag} size="sm" variant="soft">
                    {tag}
                  </Chip>
                ))}
              </div>
            )}
            <p className="text-xs text-default-400">
              {new Date(bookmark.date_added).toLocaleDateString()}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
