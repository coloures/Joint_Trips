<template>
  <Page>
    <ActionBar class="hidden"/>
    <GridLayout rows="auto, *">
      
      <GridLayout
      columns="auto, *"
      height="30"
      marginTop="24"
      paddingLeft="24"
      paddingRight="24"
      row="0"
      >
        <GridLayout
          col="0"
          width="30"
          height="30"
          @tap="$navigateBack"
        >
        <Image
          src="~/assets/icons/Arrow_left.png"
          width="30"
          height="30"
          stretch="aspectFit"
        />
        </GridLayout>
      </GridLayout>

      <ScrollView row="1">
        <StackLayout class="p-4">

          <StackLayout>
            <Label class="title" text="Поездка в" horizontalAlignment="center"/>
            <Label class="title2" :text="`${trip?.title} ${trip?.emoji}`" horizontalAlignment="center"/>
            <Label class="title3" :text="formattedDates" horizontalAlignment="center" marginTop="16"/>
          </StackLayout>

          <GridLayout class="participants_section" columns="auto, auto" rows="auto">
            <StackLayout col="0" marginTop="4" marginRight="24">
               <Label class="title" text="Участники"/>
               <Label class="title3" :text="`${participantsCount} человек`" marginTop="8" />
            </StackLayout>

            <StackLayout orientation="horizontal" col="1">
              <Image
                v-for="participant in particapantsAvatar"
                :key="participant.memberId"
                :src="participant.avatar"
                class="particapants-image"
                stretch="aspectFill"
              />
            </StackLayout>
          </GridLayout>

          <StackLayout class="expenses_section">
            <Label class="title" text="Расходы"/>
            <Label class="title3" text="Общие расходы на поездку" marginTop="16"/>
            <StackLayout orientation="horizontal" marginTop="8">
              <Label class="title3" :text="`${formatMoney(totalExpenses)} ₽`" color="#313132"/>
              <Label class="title3" :text="` / ${formatMoney(totalBudget)} ₽`"/>
            </StackLayout>

            <StackLayout marginTop="32">
              <GridLayout
                class="category-row"
                v-for="item in categorySpendList"
                :key="item.id"
                columns="auto, *, auto"
                height="45"
              >
                <Label col="0" :text="item.emoji" marginRight="8" />
                <Label col="1" class="title4" :text="item.name" />
                <Label col="2" class="title4" :text="`${formatMoney(item.spent)} ₽`" />
              </GridLayout>
              <GridLayout
                class="category-row"
                columns="auto, *, auto"
                height="45"
                borderBottomWidth="0"
              >
                <Label col="0" text="💼" marginRight="8" />
                <Label col="1" class="title4" text="Не распределено" />
                <Label col="2" class="title4" :text="`${formatMoney(unallocatedFunds)} ₽`" />
              </GridLayout>
            </StackLayout>
          </StackLayout>

          <StackLayout class="btn-hist" marginTop="18" verticalAlignment="middle" @tap="openHistoryModal">
            <label class="title" text="История расходов" horizontalAlignment="center" color="#FFDD2D"/>
          </StackLayout>

          <StackLayout class="btn-exp" marginTop="24" marginBottom="36" verticalAlignment="middle" @tap="showAddExpense">
            <label class="title" text="Добавить расход" horizontalAlignment="center" color="#313132"/>
          </StackLayout>

        </StackLayout>
      </ScrollView>

      <GridLayout v-if="showHistoryModal" class="modal-root" row="0" rowSpan="2">
      <GridLayout rows="auto, *" class="history-modal" @tap="onHistoryModalTap">
        <GridLayout columns="*, auto" class="history-header">
          <Label col="0" text="История расходов" class="history-title" />
          <Label col="1" text="✕" class="history-close" @tap="closeHistoryModal" />
        </GridLayout>

        <ScrollView row="1">
          <StackLayout class="history-list">
            <StackLayout
              v-for="item in expenseHistoryItems"
              :key="item.id"
              class="history-item"
            >
              <GridLayout columns="*, auto">
                <Label col="0" :text="item.description" class="history-item-title" />
                <Label col="1" :text="`${formatMoney(item.amount)} ₽`" class="history-item-amount" />
              </GridLayout>

              <Label :text="item.date" class="history-item-date" />
              <Label :text="`Плательщик: ${item.payerName}`" class="history-item-payer" />

              <StackLayout v-if="item.allocations.length > 0" class="history-allocations">
                <Label text="Оплачено за:" class="history-alloc-title" />
                <GridLayout
                  v-for="alloc in item.allocations"
                  :key="`${item.id}-${alloc.userId}`"
                  columns="*, auto"
                  class="history-alloc-row"
                >
                  <Label col="0" :text="alloc.userName" class="history-alloc-user" />
                  <Label col="1" :text="`${formatMoney(alloc.amount)} ₽`" class="history-alloc-amount" />
                </GridLayout>
              </StackLayout>
            </StackLayout>

            <Label
              v-if="expenseHistoryItems.length === 0"
              text="Расходов пока нет"
              class="history-empty"
            />
          </StackLayout>
        </ScrollView>
      </GridLayout>
    </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack, $navigateTo } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useUserStore } from '~/stores/userStore'
import type { Trip } from '~/models/trip'
import AddExpenseDialog from './AddExpenseDialog.vue'

const props = defineProps<{
  tripId: number
}>()

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const expenseTypeStore = useExpenseTypeStore()
const userStore = useUserStore()

const trip = ref<Trip | null>(null)
const showHistoryModal = ref(false)

onMounted(() => {
  trip.value = tripStore.getTripById(props.tripId)
})

const formatMoney = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0
  return Math.round(safe).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Заголовок
const formattedDates = computed(() => {
  if (!trip.value) return ''
  const start = new Date(trip.value.startDate).toLocaleDateString('ru-RU')
  const end = new Date(trip.value.endDate).toLocaleDateString('ru-RU')
  return `${start} — ${end}`
})

// Участники
const participantsCount = computed(() => {
  if (!trip.value) return 0
  return tripMemberStore.getTripMembersByTripId(trip.value.id).length
})

const particapantsIDs = computed(() => {
  if (!trip.value) return []
  return tripMemberStore.getTripMembersByTripId(trip.value.id)
})

const particapantsAvatar = computed(() => {
  return particapantsIDs.value.map(participant => {
    const user = userStore.getUserById(participant.member_id)
    return {
      memberId: participant.member_id,
      avatar: user?.avatar || `https://i.pravatar.cc/150?u=member-${participant.member_id}`
    }
  })
})

// Расходы
const totalBudget = computed(() => trip.value?.budget || 0)
const totalExpenses = computed(() => expenseStore.getTotalExpensesByTripId(props.tripId))
const allCategories = computed(() => expenseTypeStore.getAllExpenseTypes())

const categorySpendList = computed(() => {
  return allCategories.value.map(category => ({
    id: category.id,
    name: category.name,
    emoji: category.icon,
    spent: expenseStore.getTotalByCategory(props.tripId, category.id)
  }))
})

const unallocatedFunds = computed(() => {
  const remaining = Number(totalBudget.value) - totalExpenses.value
  return remaining > 0 ? remaining : 0
})

const getUserDisplayName = (userId: number) => {
  const user = userStore.getUserById(userId)
  if (!user) return `Пользователь ${userId}`
  return `${user.first_name} ${user.last_name}`
}

const formatExpenseDate = (value: string) =>
  new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

const expenseHistoryItems = computed(() => {
  return expenseStore
    .getExpensesByTripId(props.tripId)
    .slice()
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(expense => {
      const allocations = expenseStore
        .getAllocationsByExpenseId(expense.id)
        .filter(allocation => allocation.user_id !== expense.user_id_pay && allocation.amount > 0)
        .map(allocation => ({
          userId: allocation.user_id,
          userName: getUserDisplayName(allocation.user_id),
          amount: allocation.amount
        }))

      return {
        id: expense.id,
        date: formatExpenseDate(expense.date),
        payerName: getUserDisplayName(expense.user_id_pay),
        description: expense.description?.trim() || 'Без описания',
        amount: expense.amount,
        allocations
      }
    })
})

const openHistoryModal = () => {
  showHistoryModal.value = true
}

const closeHistoryModal = () => {
  showHistoryModal.value = false
}

const onHistoryModalTap = () => {
}

const showAddExpense = () => {
  $navigateTo(AddExpenseDialog, {
    props: {
      tripId: props.tripId
    }
  })
}

</script>

<style scoped>

/* Прочее */

.p-4 {
  padding: 0;
}

.hidden {
  height: 0;
  visibility: collapse;
}

/* Текст */

.title {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 20;
  font-weight: bold;
  color: #313132;
}

.title2 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 36;
  font-weight: bold;
  color: #313132;
}

.title3 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold", "Inter-Light";
  font-size: 20;
  color: #6F7071;
}

.title4 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold", "Inter-Light";
  font-size: 16;
  color: #313132;
}

/* Секция участники */

.participants_section {
  margin-top: 32;
  padding-bottom: 20;
  padding-top: 20;
  padding-left: 24;
  background-color: white;
  border-radius: 24;
  width: 354;
  height: 130;
}

.particapants-image {
  margin-right: 12;
  width: 90;
  height: 90;
  border-radius: 24;
}

/* Секция расходы */

.expenses_section {
  margin-top: 32;
  padding: 24;
  padding-bottom: 24;
  background-color: white;
  border-radius: 24;
  width: 354;
  height: auto;
}

.category-row {
  padding-left: 12;
  padding-right: 12;
  border-bottom-width: 1;
  border-bottom-color: #D3D3D3;
}

/* Кнопки */

.btn-hist {
  width: 354;
  height: 60;
  border-radius: 14;
  background-color: #FFF7CF;
}

.btn-exp {
  width: 354;
  height: 60;
  border-radius: 14;
  background-color: #FFDD2D;
}

.modal-root {
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  
}

.history-modal {
  vertical-align: middle;
  horizontal-align: center;
  width: 354;
  margin-top: 70;
  margin-bottom: 24;
  background-color: #FFFFFF;
  border-radius: 16;
  padding: 16;
}

.history-header {
  padding-bottom: 10;
  border-bottom-width: 1;
  border-bottom-color: #E5E7EB;
}

.history-title {
  font-size: 20;
  font-weight: 700;
  color: #111827;
}

.history-close {
  font-size: 24;
  color: #6B7280;
  padding-left: 12;
}

.history-list {
  padding-top: 8;
}

.history-item {
  border-width: 1;
  border-color: #E5E7EB;
  border-radius: 12;
  padding: 12;
  margin-bottom: 10;
}

.history-item-title {
  font-size: 16;
  font-weight: 600;
  color: #111827;
}

.history-item-amount {
  font-size: 16;
  font-weight: 700;
  color: #111827;
}

.history-item-date {
  margin-top: 6;
  font-size: 13;
  color: #6B7280;
}

.history-item-payer {
  margin-top: 2;
  font-size: 13;
  color: #374151;
}

.history-allocations {
  margin-top: 8;
  padding-top: 8;
  border-top-width: 1;
  border-top-color: #F3F4F6;
}

.history-alloc-title {
  font-size: 12;
  color: #6B7280;
  margin-bottom: 4;
}

.history-alloc-row {
  padding-top: 3;
  padding-bottom: 3;
}

.history-alloc-user {
  font-size: 13;
  color: #374151;
}

.history-alloc-amount {
  font-size: 13;
  color: #111827;
}

.history-empty {
  text-align: center;
  color: #9CA3AF;
  margin-top: 20;
}

</style>
