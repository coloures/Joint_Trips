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
        <StackLayout v-if="isScreenLoading" class="screen-state">
          <ActivityIndicator busy="true" />
          <Label text="Загружаем данные поездки..." class="screen-state-text" />
        </StackLayout>

        <StackLayout v-else-if="screenError" class="screen-state">
          <Label :text="screenError" class="screen-state-error" textWrap="true" />
          <Button text="Повторить" class="btn-primary" @tap="retryTripLoad" />
        </StackLayout>

        <StackLayout v-else class="p-4">

          --Наименование и дата
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

    <GridLayout v-if="showAddExpenseModal" class="modal-root" row="0" rowSpan="2">
      <GridLayout rows="auto, *" class="history-modal" @tap="onHistoryModalTap">
        <GridLayout columns="*, auto" class="history-header">
          <Label col="0" text="Добавить расход" class="history-title" />
          <Label col="1" text="✕" class="history-close" @tap="closeAddExpenseModal" />
        </GridLayout>

        <ScrollView row="1">
          <StackLayout class="history-list">
            <TextField v-model="newExpenseDescription" hint="Описание расхода" class="input" />
            <TextField v-model="newExpenseAmount" hint="Сумма" keyboardType="number" class="input" />

            <Label text="Категория" class="history-alloc-title" />
            <DropDown
              :items="categoryNames"
              :selectedIndex="selectedCategoryIndex"
              @selectedIndexChanged="onCategoryChange"
              class="dropdown"
            />

            <Label text="Кто оплатил" class="history-alloc-title" />
            <DropDown
              :items="payerNames"
              :selectedIndex="selectedPayerIndex"
              @selectedIndexChanged="onPayerChange"
              class="dropdown"
            />

            <Label text="За кого (необязательно)" class="history-alloc-title" />
            <StackLayout class="participants-wrapper">
              <GridLayout
                v-for="participant in participants"
                :key="participant.member_id"
                columns="auto, *"
                class="participant-row"
                @tap="toggleParticipant(participant.member_id)"
              >
                <Label
                  col="0"
                  :text="selectedParticipants[participant.member_id] ? '☑️' : '⬜'"
                  class="checkbox"
                />
                <Label col="1" :text="getUserName(participant.member_id)" class="participant-name" />
              </GridLayout>
            </StackLayout>

            <Label v-if="addExpenseError" :text="addExpenseError" class="error" />

            <StackLayout class="btn-primary" marginTop="40" marginBottom="40" verticalAlignment="middle" @tap="submitNewExpense">
              <label class="title" text="Добавить расход" horizontalAlignment="center" color="#313132"/>
            </StackLayout>
          </StackLayout>
        </ScrollView>
      </GridLayout>
    </GridLayout>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack, $navigateTo } from 'nativescript-vue'
import { useMachine } from '@xstate/vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useUserStore } from '~/stores/userStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import type { Trip } from '~/models/trip'
import type { ExpenseType } from '~/models/type_of_expense'
import ExpenseCard from '~/components/UI/ExpenseCard.vue'
import AddExpenseDialog from './AddExpenseDialog.vue'
import EditCategoryBudgetDialog from '~/components/EditCategoryBudgetDialog.vue'
import ExpenseDetails from './ExpenseDetails.vue'
import DebtsWidget from '~/components/DebtsWidget.vue'
import { createScreenLoadMachine, modalMachine } from '~/machines/uiMachines'
import { GridLayout, Label, StackLayout, confirm } from '@nativescript/core'
import type { SelectedIndexChangedEventData } from 'nativescript-drop-down'

const props = defineProps<{
  tripId: number
}>()

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const expenseTypeStore = useExpenseTypeStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()

const { snapshot: screenSnapshot, send: sendScreenEvent } = useMachine(createScreenLoadMachine<Trip>())
const { snapshot: budgetModalSnapshot, send: sendBudgetModalEvent } = useMachine(modalMachine)

const trip = computed(() => screenSnapshot.value.context.data)
const isScreenLoading = computed(() => screenSnapshot.value.matches('loading'))
const screenError = computed(() => screenSnapshot.value.context.error)
const showBudgetDialog = computed(() => budgetModalSnapshot.value.matches('opened'))
const selectedCategory = ref<ExpenseType | null>(null)
const selectedCategoryBudget = ref(0)
const currentUserId = computed(() => userStore.currentUserId)
const showHistoryModal = ref(false)
const showAddExpenseModal = ref(false)
const newExpenseDescription = ref('')
const newExpenseAmount = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedPayerId = ref<number | null>(null)
const selectedParticipants = ref<Record<number, boolean>>({})
const addExpenseError = ref('')

onMounted(() => {
  loadTrip()
})

const loadTrip = async () => {
  sendScreenEvent({ type: 'START' })
  try {
    const loadedTrip = await tripStore.loadTripById(props.tripId)
    if (!loadedTrip) {
      sendScreenEvent({ type: 'REJECT', error: 'Поездка не найдена' })
      return
    }
    void Promise.all([
      tripMemberStore.loadTripMembersByTripId(props.tripId),
      expenseStore.loadAll(),
      expenseTypeStore.loadExpenseTypes()
    ])
    sendScreenEvent({ type: 'RESOLVE', data: loadedTrip })
  } catch (error) {
    sendScreenEvent({
      type: 'REJECT',
      error: error instanceof Error ? error.message : 'Не удалось загрузить поездку'
    })
  }
}

const retryTripLoad = () => {
  loadTrip()
}

// Основная информация
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

const participants = computed(() => tripMemberStore.getTripMembersByTripId(props.tripId))
const categoryNames = computed(() => allCategories.value.map(c => c.name))
const payerNames = computed(() => participants.value.map(p => getUserName(p.member_id)))

const selectedCategoryIndex = computed(() => {
  if (!selectedCategoryId.value) return 0
  const index = allCategories.value.findIndex(c => c.id === selectedCategoryId.value)
  return index >= 0 ? index : 0
})

const selectedPayerIndex = computed(() => {
  if (!selectedPayerId.value) return 0
  const index = participants.value.findIndex(p => p.member_id === selectedPayerId.value)
  return index >= 0 ? index : 0
})

const getUserDisplayName = (userId: number) => {
  const user = userStore.getUserById(userId)
  if (!user) return `Пользователь ${userId}`
  return `${user.first_name} ${user.last_name}`
}

const getUserName = (userId: number) => {
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
  if (!selectedCategoryId.value && allCategories.value.length > 0) {
    selectedCategoryId.value = allCategories.value[0].id
  }
  if (!selectedPayerId.value && participants.value.length > 0) {
    selectedPayerId.value = participants.value[0].member_id
  }
  addExpenseError.value = ''
  showAddExpenseModal.value = true
}

const closeAddExpenseModal = () => {
  showAddExpenseModal.value = false
}

const onCategoryChange = (args: SelectedIndexChangedEventData) => {
  const index = args.newIndex
  if (index >= 0 && allCategories.value[index]) {
    selectedCategoryId.value = allCategories.value[index].id
  }
}

const onPayerChange = (args: SelectedIndexChangedEventData) => {
  const index = args.newIndex
  if (index >= 0 && participants.value[index]) {
    selectedPayerId.value = participants.value[index].member_id
  }
}

const toggleParticipant = (userId: number) => {
  selectedParticipants.value[userId] = !selectedParticipants.value[userId]
}

const submitNewExpense = async () => {
  addExpenseError.value = ''

  if (!newExpenseDescription.value.trim() || !newExpenseAmount.value.trim() || !selectedCategoryId.value || !selectedPayerId.value) {
    addExpenseError.value = 'Заполните описание, сумму, категорию и плательщика'
    return
  }

  const amount = Number(newExpenseAmount.value)
  if (!Number.isFinite(amount) || amount <= 0) {
    addExpenseError.value = 'Сумма должна быть больше 0'
    return
  }

  if (amount > unallocatedFunds.value) {
    addExpenseError.value = `Сумма не должна превышать остаток ${formatMoney(unallocatedFunds.value)} ₽`
    return
  }

  const expenseId = await expenseStore.addExpense({
    trip_id: props.tripId,
    description: newExpenseDescription.value.trim(),
    amount,
    type_of_expense: selectedCategoryId.value,
    user_id_pay: selectedPayerId.value,
    date: new Date().toISOString().split('T')[0],
    currency_id: 1
  })

  const selectedUserIds = Object.entries(selectedParticipants.value)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id))

  if (selectedUserIds.length > 0) {
    const amountPerPerson = amount / selectedUserIds.length
    for (const userId of selectedUserIds) {
      await expenseStore.addExpenseAllocation({
        expense_id: expenseId,
        user_id: userId,
        amount: amountPerPerson
      })
    }
  }

  newExpenseDescription.value = ''
  newExpenseAmount.value = ''
  selectedParticipants.value = {}
  closeAddExpenseModal()
}

</script>

<style scoped>

/* Прочее */

.p-4 {
  margin: 0;
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

.input {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  padding: 12;
  margin-bottom: 12;
  font-size: 14;
}

.dropdown {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  margin-bottom: 12;
  height: 44;
  padding: 8 8 0 8;
  background-color: white;
}

.participants-wrapper {
  margin-top: 4;
  border-width: 1;
  border-color: #f3f4f6;
  border-radius: 8;
  padding: 4;
  margin-bottom: 12;
}

.participant-row {
  padding: 10;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
}

.checkbox {
  font-size: 18;
  margin-right: 10;
  width: 28;
}

.participant-name {
  font-size: 14;
  color: #374151;
}

.error {
  color: #ef4444;
  font-size: 12;
  margin-bottom: 10;
}

.btn-primary {
  width: 296;
  height: 60;
  border-radius: 14;
  background-color: #FFDD2D;
}

</style>
