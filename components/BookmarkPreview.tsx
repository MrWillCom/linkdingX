import { useState } from 'react'

interface BookmarkPreviewProps {
  url: string | null | undefined
  alt: string
  className?: string
}

function hasMediaUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function BookmarkPreview({ url, alt, className = '' }: BookmarkPreviewProps) {
  const [hasError, setHasError] = useState(false)

  if (!hasMediaUrl(url) || hasError) {
    return null
  }

  return (
    <img
      src={url}
      alt={alt}
      width={64}
      height={48}
      loading="lazy"
      className={`rounded-md border border-kumo-fill object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  )
}
