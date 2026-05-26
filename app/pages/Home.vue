<template>
  <Page>
    <ActionBar class="hidden"/>
    <GridLayout rows="*, auto">

      <ScrollView row="0">
        <StackLayout class="p-4">

          <StackLayout class="header" orientation="horizontal" @tap="onHeaderTap">
            <Image class="avatar" :src="currentUserAvatar" stretch="aspectFill" />
            <Label class="name" :text="currentUserName" marginLeft="16"/>
          </StackLayout>

          <GridLayout class="nav" columns="auto, *">
            <StackLayout col="0" class="summary-card" @tap="onCardDept">
              <Label text="Долг" class="trip-title" />
              <Label :text="`${formatMoney(debtAmount)} ₽`" class="summary-value" marginTop="8"/>
            </StackLayout>
            <StackLayout col="1" class="summary-card ml-2" @tap="onCardNotification" marginLeft="24">
              <Label text="Уведомления" class="trip-title" />
              <Label :text="notificationText" class="summary-value" marginTop="8"/>
            </StackLayout>
          </GridLayout>

          <StackLayout
            class="trip-card"
            v-for="item in items"
            :key="item.id"
            @tap="() => onCardTrip(item)"
          >
            <GridLayout columns="auto, *">
              <Label col="0" :text="item.emoji" class="trip-emoji" />

              <StackLayout col="1" marginLeft="24">
                <Label :text="item.title" class="trip-title" />
                <Label :text="participantsText(item.id)" class="trip-subtitle" />
                <Label :text="tripDateText(item.startDate, item.endDate)" class="trip-date" />
              </StackLayout>
            </GridLayout>
          </StackLayout>

        </StackLayout>
      </ScrollView>

      <GridLayout class="belly" row="1" height="140">
        <StackLayout class="btn-trip-create" marginTop="40" marginBottom="40" verticalAlignment="middle" @tap="onCardAddingTrip">
          <label class="title" text="Создать поездку" horizontalAlignment="center" color="#313132"/>
        </StackLayout>
      </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup>
import { computed, $navigateTo, onMounted, ref, watch } from 'nativescript-vue'
import * as dialogs from '@nativescript/core/ui/dialogs'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useNotificationStore } from '~/stores/notificationStore'
import { useUserStore } from '~/stores/userStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import CardTrip from '../components/UI/CardTrip.vue'
import CardDebt from '../components/UI/CardDebt.vue'
import CardNotification from '~/components/UI/CardNotification.vue'
import CardAddingTrip from '~/components/UI/CardAddingTrip.vue'
import DebtsPage from './DebtsPage.vue'
import NotificationsPage from './NotificationsPage.vue'
import TripDetails from './TripDetails.vue'
import AddTrip from './AddTrip.vue'
import UserProfilePage from './UserProfilePage.vue'
import { GridLayout, Image, Label, StackLayout } from '@nativescript/core'

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const notificationStore = useNotificationStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

const memberId = computed(() => userStore.currentUserId)
const currentUser = computed(() => userStore.currentUser)

const currentUserName = computed(() => {
  if (!currentUser.value) return 'Гость'
  return `${currentUser.value.first_name} ${currentUser.value.last_name}`
})

const currentUserAvatar = computed(() => {
  if (!memberId.value) return ''
  return currentUser.value?.avatar || `https://i.pravatar.cc/150?u=member-${memberId.value}`
})

onMounted(async () => {
  await loadDebtAmount()
})

watch(memberId, async () => {
  await loadDebtAmount()
})

watch(
  () => tripMemberStore.trip_members,
  async () => {
    await loadDebtAmount()
  },
  { deep: true }
)

const notificationCount = computed(() => {
  if (!memberId.value) return 0
  return notificationStore.getUnreadCountByUserId(memberId.value)
})

const debtAmount = ref(0)

const notificationText = computed(() => {
  if (notificationCount.value === 0) return 'Нет новых'
  if (notificationCount.value === 1) return '1 новое'
  return `${notificationCount.value} новых`
})

const loadDebtAmount = async () => {
  if (!memberId.value) return

  const memberTrips = tripMemberStore
    .getTripMembersByMemberId(memberId.value)
    .filter(member => member.status === 'confirmed')

  let totalDebt = 0

  for (const memberTrip of memberTrips) {
    const debts = await expenseStore.loadDebts(memberTrip.trip_id)

    debts.forEach(debt => {
      if (debt.fromUserId === memberId.value) {
        totalDebt += debt.amount
      }
    })
  }

  debtAmount.value = totalDebt
}

const defaultCurrencySymbol = computed(() => {
  return currencyStore.currencies.find(c => c.id === 1)?.symbol || '₽'
})

const formatMoney = (value) => {
  const safe = Number.isFinite(value) ? value : 0
  return Math.round(safe).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const items = computed(() => {
  console.log('1')
  if (!memberId.value) return []
  console.log('2')
  if (!tripStore.trips.length) return []
  console.log('3')
  console.log(`${tripMemberStore.trip_members.length}`)
  if (!tripMemberStore.trip_members.length) return []
  console.log('4')

  const memberTrips = tripMemberStore.getTripMembersByMemberId(memberId.value)
    .filter(member => member.status === 'confirmed')
  return memberTrips
    .map(member => tripStore.getTripById(member.trip_id))
    .filter(Boolean)
})

const getParticipantsCount = (tripId) => {
  const members = tripMemberStore
    .getTripMembersByTripId(tripId)
    .filter(m => m.status === 'confirmed')

  return members.length > 0 ? members.length - 1 : 0
}

const participantsText = (tripId) => {
  const participants = getParticipantsCount(tripId)
  if (participants === 0) return 'Вы один'
  if (participants === 1) return 'Ещё 1 человек участвует'
  if (participants < 5) return `Ещё ${participants} человека участвуют`
  return `Ещё ${participants} человек участвуют`
}

const tripDateText = (startDate, endDate) => {
  const start = new Date(startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  const end = new Date(endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  return `${start} — ${end}`
}

const onCardTrip = (item) => {
  $navigateTo(TripDetails, {
    props: {
      tripId: item.id
    },
    transition: 'slide',
    curve: 'easeInOut',
    duration: 500
  })
}

const onCardAddingTrip = () => {
  $navigateTo(AddTrip, {
    transition: 'slide',
    curve: 'easeInOut',
    duration: 500
  })
}

const onCardDept = () => {
  if (!memberId.value) return
  $navigateTo(DebtsPage, {
    props: {
      tripIds: tripMemberStore
        .getTripMembersByMemberId(memberId.value)
        .filter(member => member.status === 'confirmed')
        .map(t => t.trip_id),
      memberId: memberId.value
    }
  })
}

const onCardNotification = () => {
  if (!memberId.value) return
  $navigateTo(NotificationsPage, {
    props: {
      userId: memberId.value
    }
  })
}

const onHeaderTap = () => {
  $navigateTo(UserProfilePage, {
    props: {
      debtAmount: debtAmount.value
    },
    transition: 'slideLeft',
    curve: 'easeInOut',
    duration: 300
  })
}

const onLogout = async () => {
  const confirmed = await dialogs.confirm({
    title: 'Выход',
    message: 'Выйти из аккаунта?',
    okButtonText: 'Да',
    cancelButtonText: 'Нет'
  })

  if (!confirmed) return
  userStore.logout()
}
</script>


<style scoped>

.p-4 {
  margin: 0;
}

.hidden {
  height: 0;
  visibility: collapse;
}

.title {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 20;
  font-weight: bold;
  color: #313132;
}

.header {
  margin-top: 60;
  width: 354;
}

.avatar {
  width: 60;
  height: 60;
  border-radius: 50;
}

.name {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 32;
  font-weight: bold;
  color: #313132;
}

.nav {
  width: 354;
  margin-top: 32;
  margin-bottom: 16;
}

.trip-card {
  background-color: #ffffff;
  width: 354;
  border-radius: 24;
  padding: 24;
  margin-top: 16;
}

.trip-emoji {
  font-size: 30;
}

.trip-title {
  font-size: 20;
  font-weight: bold;
  color: #313132;
}

.trip-subtitle {
  font-size: 16;
  color: #6F7071;
  margin-top: 8;
}

.trip-date {
  font-size: 16;
  color: #6F7071;
  margin-top: 8;
}

.summary-card {
  background-color: #ffffff;
  border-radius: 24;
  padding: 24;
}

.summary-label {
  font-size: 20;
  color: #6F7071;
}

.summary-value {
  font-size: 20;
  color: #6F7071;
}

/* пузо */

.belly {
  border-top-width: 1;
  border-top-color: #D3D3D3;
}

.btn-trip-create {
  width: 354;
  height: 60;
  border-radius: 14;
  background-color: #FFDD2D;
}

</style>
