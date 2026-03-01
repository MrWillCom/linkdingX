import { useState, useEffect } from 'react'

interface BookmarkFaviconProps {
  url: string | null | undefined
  className?: string
}

function hasMediaUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function BookmarkFavicon({ url, className = '' }: BookmarkFaviconProps) {
  const [isHidden, setIsHidden] = useState(!hasMediaUrl(url))

  useEffect(() => {
    setIsHidden(!hasMediaUrl(url))
  }, [url])

  if (isHidden || !hasMediaUrl(url)) {
    return null
  }

  return (
    <img
      src={url}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={`h-4 w-4 rounded-sm border border-default-200 object-cover flex-shrink-0 ${className}`}
      onError={() => setIsHidden(true)}
    />
  )
}
