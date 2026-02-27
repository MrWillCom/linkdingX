import { useCallback, useEffect, useRef } from 'react'
import useSWRInfinite from 'swr/infinite'
import { Card, Link, Chip, Spinner } from '@heroui/react'

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

async function fetcher(key: string): Promise<BookmarksResponse> {
  const server = await serverStorage.getValue()
  const apiToken = await apiTokenStorage.getValue()

  if (!server || !apiToken) {
    throw new Error('Setup not complete')
  }

  const fullUrl = `${server}${key}`
  const options: RequestInit = {
    headers: {
      Authorization: `Token ${apiToken}`,
    },
  }

  const response = await browser.runtime.sendMessage({
    type: 'api-request',
    url: fullUrl,
    options,
  })

  if (!response.ok) {
    throw new Error(response.data?.detail || 'Failed to fetch bookmarks')
  }

  return response.data as BookmarksResponse
}

const PAGE_SIZE = 15

export default function BookmarksList() {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: BookmarksResponse | null) => {
      if (previousPageData && !previousPageData.next) return null
      const offset = pageIndex * PAGE_SIZE
      return `/api/bookmarks/?limit=${PAGE_SIZE}&offset=${offset}`
    },
    [],
  )

  const { data, error, size, setSize, isLoading, isValidating, mutate } =
    useSWRInfinite<BookmarksResponse>(getKey, fetcher, {
      revalidateFirstPage: false,
    })

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !isLoadingMore && !isValidating) {
          const hasMore = !data || data[data.length - 1]?.next !== null
          if (hasMore) {
            setSize(size + 1)
          }
        }
      },
      { threshold: 0.1 },
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [isLoadingMore, isValidating, data, setSize, size])

  const bookmarks = data ? data.flatMap(page => page.results) : []

  if (error) {
    return (
      <div className="p-4 flex flex-col items-center gap-4">
        <p className="text-danger">Error: {error.message}</p>
        <Spinner onClick={() => mutate()} className="cursor-pointer" />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner />
      </div>
    )
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
      <div ref={loadMoreRef} className="py-4 flex justify-center">
        {isLoadingMore && <Spinner />}
        {!isLoadingMore && data && !data[data.length - 1]?.next && (
          <p className="text-default-400 text-sm">No more bookmarks</p>
        )}
      </div>
    </div>
  )
}
