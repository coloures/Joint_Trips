<template>
  <Page>
    <ActionBar title="Совместные поездки" backgroundColor="#3b82f6" color="white">
      <ActionItem text="Выйти" android:position="actionBar" @tap="onLogout" />
    </ActionBar>
    <ScrollView>
      <StackLayout class="w-full p-4">
        <GridLayout columns="*, *" class="w-full mb-4">
          <CardDebt
            col="0"
            :amount="debtAmount"
            :currencySymbol="defaultCurrencySymbol"
            class="mr-2"
            @tap="onCardDept"
          />
          <CardNotification col="1" :count="notificationCount" class="ml-2" @tap="onCardNotification" />
        </GridLayout>

        <CardTrip
          v-for="item in items"
          :key="item.id"
          :icon="item.emoji"
          :title="item.title"
          :participants="getParticipantsCount(item.id)"
          :startDate="item.startDate"
          :endDate="item.endDate"
          @tap="() => onCardTrip(item)"
        />
        <CardAddingTrip @addNewTrip="() => onCardAddingTrip()" />
      </StackLayout>
    </ScrollView>
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

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const notificationStore = useNotificationStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

const memberId = computed(() => userStore.currentUserId)

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

const onCardTrip = (item) => {
  $navigateTo(TripDetails, {
    props: {
      tripId: item.id
    }
  })
}

const onCardAddingTrip = () => {
  $navigateTo(AddTrip, {
    transition: 'slide',
    curve: 'easeInOut',
    duration: 300
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
