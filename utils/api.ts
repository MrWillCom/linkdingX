import { serverStorage, apiTokenStorage } from '@/utils/storage'

export interface ApiResponse {
  ok: boolean
  status?: number
  data?: unknown
  error?: string
}

interface ApiOptions {
  headers?: Record<string, string>
}

async function resolveCredentials() {
  const [server, apiToken] = await Promise.all([
    serverStorage.getValue(),
    apiTokenStorage.getValue(),
  ])
  return { server, apiToken }
}

function buildUrl(url: string, server: string): string | null {
  if (url.startsWith('http')) return url
  if (!server) return null
  return `${server}${url}`
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
  options?: ApiOptions,
): Promise<ApiResponse> {
  const { server, apiToken } = await resolveCredentials()

  const fullUrl = buildUrl(url, server)
  if (!fullUrl) {
    return { ok: false, error: 'No server URL configured and relative path provided' }
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: {
        Authorization: `Token ${apiToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })

    let responseData: unknown
    try {
      responseData = await response.json()
    } catch {
      responseData = {}
    }
    return { ok: response.ok, status: response.status, data: responseData }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}
