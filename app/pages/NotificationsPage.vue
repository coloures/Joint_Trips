<template>
  <Page>
    <ActionBar title="Уведомления" backgroundColor="#3b82f6" color="white">
      <NavigationButton text="Назад" android.systemIcon="ic_menu_back" @tap="$navigateBack" />
    </ActionBar>

    <ScrollView>
      <StackLayout class="page">
        <StackLayout class="summary-card">
          <Label text="Все уведомления" class="summary-label" />
          <Label :text="summaryText" class="summary-amount" />
          <Label :text="statusText" class="summary-caption" />
        </StackLayout>

        <StackLayout v-if="notificationItems.length">
          <StackLayout v-for="item in notificationItems" :key="item.id" class="notification-card">
            <GridLayout columns="*, auto">
              <StackLayout col="0" class="notification-content">
                <Label :text="item.title" class="notification-title" />
                <Label :text="item.message" class="notification-message" textWrap="true" />
                <Label :text="item.meta" class="notification-meta" />
              </StackLayout>

              <StackLayout col="1" class="status-wrap">
                <StackLayout
                  class="status-dot"
                  :class="item.isRead ? 'status-dot-read' : 'status-dot-unread'"
                />
              </StackLayout>
            </GridLayout>

            <GridLayout
              v-if="item.canRespond"
              columns="*, *"
              class="invite-actions"
            >
              <Button
                col="0"
                text="Отклонить"
                class="btn-outline"
                :isEnabled="!isProcessingInvite"
                @tap="respondToInvite(item, 'decline')"
              />
              <Button
                col="1"
                text="Подтвердить"
                class="btn-primary"
                :isEnabled="!isProcessingInvite"
                @tap="respondToInvite(item, 'accept')"
              />
            </GridLayout>
          </StackLayout>
        </StackLayout>

        <StackLayout v-else class="empty-card">
          <Label text="🔔" class="empty-icon" />
          <Label text="Уведомлений пока нет" class="empty-title" />
          <Label
            text="Когда в поездках появятся новые события, они будут собраны здесь."
            class="empty-subtitle"
            textWrap="true"
          />
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'nativescript-vue'
import * as dialogs from '@nativescript/core/ui/dialogs'
import { useNotificationStore } from '~/stores/notificationStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useTripStore } from '~/stores/tripStore'
import { useUserStore } from '~/stores/userStore'

interface NotificationListItem {
  id: number
  tripId: number
  title: string
  message: string
  meta: string
  isRead: boolean
  type: string
  canRespond: boolean
  createdAtTimestamp: number
}

const notificationStore = useNotificationStore()
const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const userStore = useUserStore()
const isProcessingInvite = ref(false)

const props = defineProps<{
  userId: number
}>()

const getNotificationTitle = (type: string) => {
  const titles: Record<string, string> = {
    expense_added: 'Новый расход',
    budget_changed: 'Изменение бюджета',
    reminder: 'Напоминание',
    status_changed: 'Изменение статуса',
    trip_invite: 'Приглашение в поездку'
  }

  return titles[type] || 'Уведомление'
}

const formatDate = (value: string) => {
  const date = new Date(value)
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const notificationItems = computed<NotificationListItem[]>(() => {
  return notificationStore
    .getNotificationsByUserId(props.userId)
    .map(notification => {
      const trip = tripStore.getTripById(notification.trip_id)
      const tripTitle = trip?.title || `Поездка #${notification.trip_id}`
      const membership = tripMemberStore.getTripMemberByTripAndMemberId(notification.trip_id, props.userId)
      const canRespond = notification.type === 'trip_invite' && membership?.status === 'pending'

      return {
        id: notification.id,
        tripId: notification.trip_id,
        title: getNotificationTitle(notification.type),
        message: notification.message,
        meta: `${tripTitle} • ${formatDate(notification.created_at)} в ${formatTime(notification.created_at)}`,
        isRead: notification.is_read,
        type: notification.type,
        canRespond,
        createdAtTimestamp: new Date(notification.created_at).getTime()
      }
    })
    .sort((left, right) => right.createdAtTimestamp - left.createdAtTimestamp)
})

const unreadCount = computed(() => notificationStore.getUnreadCountByUserId(props.userId))

const summaryText = computed(() => {
  const count = notificationItems.value.length
  if (count === 0) return 'Пусто'
  if (count === 1) return '1 уведомление'
  if (count < 5) return `${count} уведомления`
  return `${count} уведомлений`
})

const statusText = computed(() => {
  if (!notificationItems.value.length) return 'Новых событий пока не было'
  const pendingInvites = notificationItems.value.filter(item => item.canRespond).length
  if (pendingInvites > 0) {
    if (pendingInvites === 1) return 'У вас есть 1 приглашение, которое ждёт ответа'
    if (pendingInvites < 5) return `У вас есть ${pendingInvites} приглашения, которые ждут ответа`
    return `У вас есть ${pendingInvites} приглашений, которые ждут ответа`
  }
  if (unreadCount.value === 0) return 'Все уведомления прочитаны'
  if (unreadCount.value === 1) return '1 уведомление ещё не прочитано'
  if (unreadCount.value < 5) return `${unreadCount.value} уведомления ещё не прочитаны`
  return `${unreadCount.value} уведомлений ещё не прочитаны`
})

const respondToInvite = async (item: NotificationListItem, action: 'accept' | 'decline') => {
  const membership = tripMemberStore.getTripMemberByTripAndMemberId(item.tripId, props.userId)
  if (!membership) return

  isProcessingInvite.value = true
  try {
    if (action === 'accept') {
      await tripMemberStore.updateTripMember(membership.id, { status: 'confirmed' })
    } else {
      await tripMemberStore.updateTripMember(membership.id, { status: 'declined' })
    }

    await notificationStore.markAsRead(item.id)

    const trip = tripStore.getTripById(item.tripId)
    const tripTitle = trip?.title || `Поездка #${item.tripId}`
    const currentUser = userStore.getUserById(props.userId)
    const currentUserName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}`.trim() : 'Участник'

    if (trip?.creator_id) {
      await notificationStore.addNotification({
        trip_id: item.tripId,
        user_id: trip.creator_id,
        type: 'status_changed',
        message: action === 'accept'
          ? `${currentUserName} подтвердил участие в поездке "${tripTitle}".`
          : `${currentUserName} отказался от участия в поездке "${tripTitle}".`,
        is_read: false,
        created_at: new Date().toISOString()
      })
    }

    await dialogs.alert({
      title: action === 'accept' ? 'Участие подтверждено' : 'Приглашение отклонено',
      message: action === 'accept'
        ? 'Теперь поездка появится у вас на главной странице.'
        : 'Приглашение больше не требует вашего ответа.',
      okButtonText: 'OK'
    })
  } finally {
    isProcessingInvite.value = false
  }
}

onMounted(async () => {
  await notificationStore.loadNotificationsByUserId(props.userId)
  await notificationStore.markAllAsRead(props.userId)
})
</script>

<style scoped>
.page {
  padding: 16;
}

.summary-card,
.notification-card,
.empty-card {
  background-color: white;
  border-radius: 16;
  padding: 16;
  margin-bottom: 14;
  border-width: 1;
  border-color: #e5e7eb;
}

.summary-card {
  background-color: #eff6ff;
  border-color: #bfdbfe;
}

.summary-label {
  font-size: 14;
  color: #2563eb;
}

.summary-amount {
  font-size: 28;
  font-weight: 700;
  color: #1d4ed8;
  margin-top: 4;
}

.summary-caption {
  font-size: 13;
  color: #6b7280;
  margin-top: 6;
}

.notification-content {
  padding-right: 12;
}

.notification-title {
  font-size: 16;
  font-weight: 600;
  color: #1f2937;
}

.notification-message {
  font-size: 14;
  color: #374151;
  margin-top: 6;
}

.notification-meta {
  font-size: 12;
  color: #9ca3af;
  margin-top: 8;
}

.status-wrap {
  vertical-align: center;
  horizontal-align: center;
  width: 20;
}

.status-dot {
  width: 12;
  height: 12;
  border-radius: 9999;
}

.status-dot-read {
  background-color: #9ca3af;
}

.status-dot-unread {
  background-color: #ef4444;
}

.invite-actions {
  margin-top: 12;
  gap: 12;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 12;
  border-radius: 8;
}

.btn-outline {
  background-color: transparent;
  border-width: 1;
  border-color: #d1d5db;
  color: #6b7280;
  padding: 12;
  border-radius: 8;
}

.empty-card {
  align-items: center;
  padding: 28 20;
}

.empty-icon {
  font-size: 40;
  margin-bottom: 8;
}

.empty-title {
  font-size: 18;
  font-weight: 600;
  color: #1f2937;
}

.empty-subtitle {
  font-size: 14;
  color: #6b7280;
  text-align: center;
  margin-top: 8;
}
</style>
