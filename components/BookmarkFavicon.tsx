import { useState } from 'react'

interface BookmarkFaviconProps {
  url: string | null | undefined
  className?: string
}

function hasMediaUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function BookmarkFavicon({ url, className = '' }: BookmarkFaviconProps) {
  const [hasError, setHasError] = useState(false)

  if (!hasMediaUrl(url) || hasError) {
    return null
  }

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`h-4 w-4 rounded-sm object-cover shrink-0 ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
