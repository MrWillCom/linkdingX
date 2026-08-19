import { memo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Badge, Link } from '@cloudflare/kumo'
import { BookmarkFavicon } from './BookmarkFavicon'
import { BookmarkPreview } from './BookmarkPreview'

interface BookmarkContentProps {
  bookmark: {
    url: string
    title: string | null
    description: string | null
    favicon_url: string | null
    preview_image_url: string | null
    tag_names: string[]
    date_added: string
  }
  titleHref?: string
  titleClassName?: string
  descriptionClassName?: string
  dateClassName?: string
  tagClassName?: string
  previewClassName?: string
  showDate?: boolean
}

export const BookmarkContent = memo(function BookmarkContent({
  bookmark,
  titleHref,
  titleClassName = '',
  descriptionClassName = '',
  dateClassName = '',
  tagClassName = '',
  previewClassName = '',
  showDate = true,
}: BookmarkContentProps) {
  const titleText = bookmark.title || bookmark.url

  return (
    <>
      <div className="flex-1 min-w-0 relative">
        <div
          className={`flex min-w-0 items-start gap-1.5 mb-2 text-sm font-medium text-kumo-default! ${titleClassName}`}
        >
          <BookmarkFavicon url={bookmark.favicon_url} />
          {titleHref ? (
            <Link
              href={titleHref}
              target="_blank"
              variant="plain"
              className="relative z-10 line-clamp-1"
            >
              {titleText}
            </Link>
          ) : (
            <span className="line-clamp-1">{titleText}</span>
          )}
        </div>
        {bookmark.description && (
          <p className={`text-xs text-kumo-strong mt-0.5 line-clamp-4 ${descriptionClassName}`}>
            {bookmark.description}
          </p>
        )}
        <div className={`flex flex-col gap-1.5 mt-1.5`}>
          {bookmark.tag_names.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {bookmark.tag_names.map(tag => (
                <Badge key={tag} variant="secondary" className={`text-2xs ${tagClassName}`}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {showDate && (
            <span className={`text-2xs text-kumo-strong ${dateClassName}`}>
              {formatDistanceToNow(new Date(bookmark.date_added), {
                addSuffix: true,
              })}
            </span>
          )}
        </div>
      </div>
      <BookmarkPreview
        url={bookmark.preview_image_url}
        alt={bookmark.title || bookmark.url}
        className={`h-12 w-16 shrink-0 mt-0.5 ${previewClassName}`}
      />
    </>
  )
})
