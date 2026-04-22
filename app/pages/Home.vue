<template>
  <Page>
    <ScrollView>
      <StackLayout class="w-full p-4">
        <GridLayout columns="*, *" class="w-full mb-4">
          <CardDebt col="0" :amount="debtAmount" :currencySymbol="defaultCurrencySymbol" class="mr-2" @tap="onCardDept"/>
          <CardNotification col="1" :count="notificationCount" class="ml-2" @tap="onCardNotification"/>
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
        <CardAddingTrip @addNewTrip="() => onCardAddingTrip()"/>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup>
import { computed, $navigateTo, onMounted } from 'nativescript-vue'
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
import TripDetails from './TripDetails.vue'
import AddTrip from './AddTrip.vue'

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const notificationStore = useNotificationStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

onMounted(() => {
  void tripStore.loadTrips()
})

const memberId = computed(() => userStore.currentUserId)

const notificationCount = computed(() => {
  if (!memberId.value) return 0
  return notificationStore.getUnreadCountByUserId(memberId.value)
})

const debtAmount = computed(() => {
  if (!memberId.value) return 0
  if (!memberId.value) return 0
  const memberTrips = tripMemberStore.getTripMembersByMemberId(memberId.value)
  let totalDebt = 0;

  memberTrips.forEach(memberTrip => {
    const debts = expenseStore.calculateDebts(memberTrip.trip_id);
    debts.forEach(debt => {
      if (debt.fromUserId === memberId.value) {
        totalDebt += debt.amount;
      }
    });
  });

  return totalDebt;
})

const defaultCurrencySymbol = computed(() => {
  return currencyStore.currencies.find(c => c.id === 1)?.symbol || '₽'
})

const items = computed(() => {
  if (!memberId.value) return []
  const memberTrips = tripMemberStore.getTripMembersByMemberId(memberId.value)
  return memberTrips
    .map(member => tripStore.getTripById(member.trip_id))
    .filter(trip => trip !== null)
})

const getParticipantsCount = (tripId) => {
  const members = tripMemberStore.getTripMembersByTripId(tripId)
  return Array.isArray(members) ? members.length-1 : 0
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
  console.log('У вас долг:', debtAmount.value, 'рублей.')
}

const onCardNotification = () => {
  console.log('Количество уведомлений:', notificationCount.value)
}
</script>
