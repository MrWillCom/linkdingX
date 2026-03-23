import { useState, useEffect } from 'react'

interface BookmarkPreviewProps {
  url: string | null | undefined
  alt: string
  className?: string
}

function hasMediaUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function BookmarkPreview({ url, alt, className = '' }: BookmarkPreviewProps) {
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
      alt={alt}
      loading="lazy"
      className={`rounded-md border border-kumo-fill object-cover ${className}`}
      onError={() => setIsHidden(true)}
    />
  )
}
