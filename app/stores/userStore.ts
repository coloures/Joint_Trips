import { defineStore } from 'pinia'
import { computed, ref } from 'nativescript-vue'
import { Messaging } from '@nativescript/firebase-messaging'
import { useNotificationStore } from '~/stores/notificationStore'

import type { User } from '~/models/user'
import type { UserCreatePayload, UserUpdatePayload } from '~/services/userApi'

import {
  fetchUsers,
  loginUser,
  createUser as createUserApi,
  updateUser as updateUserApi
} from '~/services/userApi'

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const currentUserId = ref<number | null>(null)
  const isSyncingUsers = ref(false)

  let messagingInstance: Messaging | null = null

  async function loadUsers() {
    if (isSyncingUsers.value) return

    isSyncingUsers.value = true
    try {
      users.value = await fetchUsers()
    } catch (error) {
      console.warn('[UserStore] не удалось загрузить пользователей', error)
    } finally {
      isSyncingUsers.value = false
    }
  }

  function init() {
    void loadUsers()
  }
  init()

  function initFirebaseMessaging() {
    if (messagingInstance) return

    messagingInstance = new Messaging()
    const notificationStore = useNotificationStore()

    // Разрешение
    messagingInstance.requestPermission()
      .then(() => console.log('🔔 Разрешение на уведомления получено'))
      .catch(() => console.log('❌ Разрешение отклонено'))

    // FCM TOKEN
    messagingInstance.onToken(async (token) => {
      console.log('🔥 FCM TOKEN:', token)

      if (!currentUserId.value) return

      try {
        await updateUser(currentUserId.value, {
          push_token: token
        } as any)

        console.log('✅ Токен отправлен на сервер')
      } catch (e) {
        console.error('❌ Ошибка отправки токена', e)
      }
    })

    // PUSH ПРИШЕЛ (foreground)
    messagingInstance.onMessage((message) => {
      console.log('📩 PUSH:', message)

      try {
        const data = message?.data || {}

        const allowedTypes = [
          'expense_added',
          'budget_changed',
          'reminder',
          'status_changed',
          'trip_invite'
        ] as const

        const type = allowedTypes.includes(data.type as any)
          ? (data.type as typeof allowedTypes[number])
          : 'reminder'

        const notification = {
          id: Date.now(),
          trip_id: Number(data.trip_id) || 0,
          user_id: Number(data.user_id) || 0,
          type,
          message:
            data.body ||
            message.notification?.body ||
            'Новое уведомление',
          is_read: false,
          created_at: new Date().toISOString()
        }

        notificationStore.addLocalNotification(notification)

        // 🔄 синхронизация с сервером
        if (currentUserId.value) {
          notificationStore.loadNotificationsByUserId(currentUserId.value)
        }

      } catch (e) {
        console.error('❌ Ошибка обработки push', e)
      }
    })

    // 👉 КЛИК ПО PUSH
    messagingInstance.onNotificationTap((message) => {
      console.log('👆 Нажали push:', message)

      // тут потом можно открыть TripDetails
    })
  }

  const getAllUsers = () => users.value

  const getUserById = (id: number): User | null => {
    return users.value.find(user => user.id === id) || null
  }

  const getUserByPhoneNumber = (phone: string): User | null => {
    return users.value.find(user => user.phone_number === phone) || null
  }

  const getUsersByIds = (ids: number[]): User[] => {
    return users.value.filter(user => ids.includes(user.id))
  }

  const isAuthenticated = computed(() => currentUserId.value !== null)

  const currentUser = computed(() => {
    if (!currentUserId.value) return null
    return getUserById(currentUserId.value)
  })

  const setCurrentUser = (userId: number | null) => {
    currentUserId.value = userId
  }

  const loginWithCredentials = async (payload: {
    first_name: string
    last_name: string
    phone_number: string
  }) => {
    const firstName = payload.first_name.trim()
    const lastName = payload.last_name.trim()
    const phone = payload.phone_number.replace(/\s+/g, '')

    const user = await loginUser(phone, firstName, lastName)
    currentUserId.value = user.id

    if (!users.value.some(u => u.id === user.id)) {
      users.value.push(user)
    }

    // 🚀 включаем push
    initFirebaseMessaging()

    return user
  }

  const logout = () => {
    currentUserId.value = null
  }

  async function addUser(user: UserCreatePayload) {
    const created = await createUserApi(user)
    users.value.push(created)
    return created
  }

  async function updateUser(id: number, updates: UserUpdatePayload) {
    const updated = await updateUserApi(id, updates)

    const index = users.value.findIndex(u => u.id === id)
    if (index !== -1) {
      users.value[index] = updated
    } else {
      users.value.push(updated)
    }

    return updated
  }

  return {
    users,
    currentUserId,
    currentUser,
    isAuthenticated,

    getAllUsers,
    getUserById,
    getUserByPhoneNumber,
    getUsersByIds,

    addUser,
    updateUser,

    loginWithCredentials,
    logout,
    setCurrentUser
  }
})