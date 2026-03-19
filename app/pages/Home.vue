<template>
  <Page>
    <ScrollView>
      <StackLayout class="w-full p-4">
        <GridLayout columns="*, *" class="w-full mb-4">
          <CardDebt col="0" :amount="debtAmount" class="mr-2" @tap="onCardDept"/>
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
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup>
import { ref, computed, $navigateTo } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import CardTrip from '../components/UI/CardTrip.vue'
import CardDebt from '../components/UI/CardDebt.vue'
import CardNotification from '~/components/UI/CardNotification.vue'
import TripDetails from './TripDetails.vue'

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()

const debtAmount = ref(12000)
const notificationCount = ref(3)
const member_id = ref(2)

const items = computed(() => {
  const memberTrips = tripMemberStore.getTripMembersByMemberId(member_id.value)
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

const onCardDept = () => {
  console.log('У вас долг:', debtAmount.value, 'рублей.')
}

const onCardNotification = () => {
  console.log('Количество уведомлений:', notificationCount.value)
}
</script>