import { request } from './apiClient'
import type { Notification } from '~/models/notification'

export interface NotificationCreatePayload {
  trip_id: number
  user_id: number
  type: Notification['type']
  message: string
  is_read?: boolean
  created_at?: string
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined)
  if (!entries.length) return ''
  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`
}

export const fetchNotifications = () => request<Notification[]>('/notifications/')

export const fetchNotificationsByUserId = (userId: number) =>
  request<Notification[]>(`/notifications/users/${userId}`)

export const fetchNotificationsByTripId = (tripId: number) =>
  request<Notification[]>(`/notifications/trips/${tripId}`)

export const fetchUnreadNotifications = (userId?: number) =>
  request<Notification[]>(`/notifications/unread${buildQueryString({ user_id: userId })}`)

export const createNotification = async (payload: NotificationCreatePayload) => {
  const id = await request<number>('/notifications/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  // backend doesn't expose GET /notifications/{id}; reload user notifications instead if needed
  return id
}

export const markNotificationRead = (notificationId: number) =>
  request<Notification>(`/notifications/${notificationId}/read`, { method: 'PATCH' })

export const markAllNotificationsRead = (userId: number) =>
  request<{ status: string }>(`/notifications/users/${userId}/read-all`, { method: 'PATCH' })

export const deleteNotification = (notificationId: number) =>
  request<Notification>(`/notifications/${notificationId}`, { method: 'DELETE' })

