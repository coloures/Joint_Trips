const API_BASE = 'http://10.0.2.2:8001'

const isFormDataBody = (body: RequestInit['body']) =>
  typeof FormData !== 'undefined' && body instanceof FormData

export const request = async <T>(path: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers)

  if (!headers.has('Content-Type') && !isFormDataBody(init.body)) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers })
  if (!res.ok) throw new Error(await res.text())

  if (res.status === 204) return undefined as T

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return (await res.json()) as T
  }

  const text = await res.text()
  if (!text) return undefined as T
  return text as unknown as T
}
