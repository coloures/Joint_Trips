import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { Notification } from '~/models/notification'
import Notifications from '../seeders/notifications.json'
import {
  fetchNotifications,
  fetchNotificationsByUserId,
  fetchNotificationsByTripId,
  fetchUnreadNotifications,
  createNotification as createNotificationApi,
  markNotificationRead as markNotificationReadApi,
  markAllNotificationsRead as markAllNotificationsReadApi,
  deleteNotification as deleteNotificationApi
} from '~/services/notificationApi'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<Notification[]>([])
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  async function loadAllNotifications() {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      notifications.value = await fetchNotifications()
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load notifications'
      console.warn('[NotificationStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  async function loadNotificationsByUserId(userId: number) {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      notifications.value = await fetchNotificationsByUserId(userId)
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load notifications'
      console.warn('[NotificationStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  async function loadNotificationsByTripId(tripId: number) {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      notifications.value = await fetchNotificationsByTripId(tripId)
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load notifications'
      console.warn('[NotificationStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  async function loadUnreadNotifications(userId?: number) {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      notifications.value = await fetchUnreadNotifications(userId)
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load notifications'
      console.warn('[NotificationStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  function init() {
    notifications.value = JSON.parse(JSON.stringify(Notifications))
  }
  init()

  const getAllNotifications = () => notifications.value

  const getNotificationsByUserId = (userId: number): Notification[] => {
    return notifications.value.filter(n => n.user_id === userId)
  }

  const getUnreadNotificationsByUserId = (userId: number): Notification[] => {
    return getNotificationsByUserId(userId).filter(n => !n.is_read)
  }

  const getUnreadCountByUserId = (userId: number): number => {
    return getUnreadNotificationsByUserId(userId).length
  }

  const getNotificationsByTripId = (tripId: number): Notification[] => {
    return notifications.value.filter(n => n.trip_id === tripId)
  }

  async function markAsRead(notificationId: number) {
    const updated = await markNotificationReadApi(notificationId)
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) notifications.value[index] = updated
    return updated
  }

  async function markAllAsRead(userId: number) {
    await markAllNotificationsReadApi(userId)
    notifications.value = notifications.value.map(n =>
      n.user_id === userId ? { ...n, is_read: true } : n
    )
  }

  async function addNotification(notification: Omit<Notification, 'id'>) {
    const id = await createNotificationApi(notification)
    const created: Notification = { ...notification, id }
    notifications.value.unshift(created)
    return created
  }

  async function deleteNotification(notificationId: number) {
    await deleteNotificationApi(notificationId)
    notifications.value = notifications.value.filter(n => n.id !== notificationId)
  }

  return {
    notifications,
    isSyncing,
    syncError,
    loadAllNotifications,
    loadNotificationsByUserId,
    loadNotificationsByTripId,
    loadUnreadNotifications,
    getAllNotifications,
    getNotificationsByUserId,
    getUnreadNotificationsByUserId,
    getUnreadCountByUserId,
    getNotificationsByTripId,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotification
  }
})
