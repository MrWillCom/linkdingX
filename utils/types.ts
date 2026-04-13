export interface Bookmark {
  id: number
  url: string
  title: string
  description: string
  notes: string
  web_archive_snapshot_url: string
  favicon_url: string | null
  preview_image_url: string | null
  is_archived: boolean
  unread: boolean
  shared: boolean
  tag_names: string[]
  date_added: string
  date_modified: string
  _sync_status?: 'synced' | 'pending' | 'pending_delete' | 'error'
  _local_modified_at?: string
}

export type UpdatePayload = Partial<
  Pick<
    Bookmark,
    | 'url'
    | 'title'
    | 'description'
    | 'notes'
    | 'is_archived'
    | 'unread'
    | 'tag_names'
    | '_sync_status'
    | '_local_modified_at'
  >
>
