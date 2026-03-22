<template>
  <Page>
    <ActionBar :title="trip?.title || 'Поездка'" backgroundColor="#3b82f6" color="white">
       <ActionItem 
            android:position="actionBar" 
            text="❮ Назад"
            @tap="$navigateBack"
        /> 
    </ActionBar>

    <ScrollView>
      <StackLayout class="p-4">
        <Label :text="`${trip?.emoji} ${trip?.title}`" class="title" />
        
        <Label :text="trip?.country" class="subtitle" />

        <GridLayout columns="auto, *" class="info-row">
          <Label text="📅" col="0" class="icon" />
          <Label :text="formattedDates" col="1" />
        </GridLayout>

        <GridLayout columns="auto, *" class="info-row">
          <Label text="💰" col="0" class="icon" />
          <Label :text="formattedBudget" col="1" />
        </GridLayout>

        <GridLayout columns="auto, *" class="info-row">
          <Label text="👥" col="0" class="icon" />
          <Label :text="`${participantsCount} участников`" col="1" />
        </GridLayout>

        <Label 
          v-if="trip?.description" 
          :text="trip.description" 
          class="description"
          textWrap="true"
        />

        <StackLayout class="actions" orientation="horizontal">
          <Button text="Редактировать" class="btn-primary" @tap="onEdit" />
          <Button text="Удалить" class="btn-outline" @tap="onDelete" />
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import type { Trip } from '~/models/trip'

const props = defineProps<{
  tripId: number
}>()

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const trip = ref<Trip | null>(null)

onMounted(() => {
  trip.value = tripStore.getTripById(props.tripId)
})

const formattedDates = computed(() => {
  if (!trip.value) return ''
  const start = new Date(trip.value.startDate).toLocaleDateString('ru-RU')
  const end = new Date(trip.value.endDate).toLocaleDateString('ru-RU')
  return `${start} — ${end}`
})

const formattedBudget = computed(() => {
  if (!trip.value) return ''
  return `${trip.value.budget.toLocaleString('ru-RU')} ₽`
})

const participantsCount = computed(() => {
  if (!trip.value) return 0
  return tripMemberStore.getTripMembersByTripId(trip.value.id).length
})

const onEdit = () => {
  console.log('Редактировать:', trip.value?.id)
  // Пример: $navigateTo(EditTripPage, { props: { tripId: trip.value?.id } })
}

const onDelete = () => {
  if (trip.value && confirm('Удалить эту поездку?')) {
    tripStore.deleteTrip(trip.value.id)
    $navigateBack()
  }
}
</script>

<style scoped>
.title {
  font-size: 24;
  font-weight: bold;
  margin-bottom: 4;
}
.subtitle {
  font-size: 18;
  color: #6b7280;
  margin-bottom: 16;
}
.info-row {
  margin-bottom: 8;
}
.icon {
  font-size: 18;
  margin-right: 8;
}
.description {
  font-size: 16;
  color: #374151;
  margin-top: 16;
  margin-bottom: 24;
}
.actions {
  margin-top: 24;
}
.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 10 20;
  border-radius: 8;
}
.btn-outline {
  background-color: transparent;
  border: 2 solid #3b82f6;
  color: #3b82f6;
  padding: 10 20;
  border-radius: 8;
  margin-left: 12;
}
</style>