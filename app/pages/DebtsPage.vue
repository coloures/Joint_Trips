<template>
  <Page>
    <ActionBar title="Мои долги" backgroundColor="#3b82f6" color="white">
      <NavigationButton text="Назад" android.systemIcon="ic_menu_back" @tap="$navigateBack" />
    </ActionBar>

    <ScrollView>
      <StackLayout class="page">
        <StackLayout class="summary-card">
          <Label text="К оплате" class="summary-label" />
          <Label :text="formattedTotalDebt" class="summary-amount" />
          <Label
            :text="debtItems.length ? `Найдено долгов: ${debtItems.length}` : 'Сейчас у вас нет долгов'"
            class="summary-caption"
          />
        </StackLayout>

        <StackLayout v-if="debtItems.length">
          <StackLayout
            v-for="item in debtItems"
            :key="`${item.tripId}-${item.expenseId}-${item.creditorId}`"
            class="debt-card"
          >
            <GridLayout columns="auto, *, auto" class="debt-card-header">
              <Label col="0" :text="item.tripEmoji" class="trip-emoji" />
              <StackLayout col="1">
                <Label :text="item.tripTitle" class="trip-title" />
                <Label :text="item.formattedDate" class="trip-date" />
              </StackLayout>
              <Label col="2" :text="item.formattedAmount" class="debt-amount" />
            </GridLayout>

            <StackLayout class="info-block">
              <Label :text="`Кому: ${item.creditorName}`" class="info-text" />
              <Label :text="`За что: ${item.reason}`" class="info-text" textWrap="true" />
              <Label :text="`Категория: ${item.categoryName}`" class="info-subtext" />
            </StackLayout>
          </StackLayout>
        </StackLayout>

        <StackLayout v-else class="empty-card">
          <Label text="🎉" class="empty-icon" />
          <Label text="Долгов нет" class="empty-title" />
          <Label
            text="Когда появятся расходы, где вы должны другому участнику, они будут показаны здесь."
            class="empty-subtitle"
            textWrap="true"
          />
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useTripStore } from '~/stores/tripStore'
import { useUserStore } from '~/stores/userStore'

interface DebtCardItem {
  tripId: number
  tripEmoji: string
  tripTitle: string
  expenseId: number
  creditorId: number
  creditorName: string
  amount: number
  formattedAmount: string
  reason: string
  categoryName: string
  formattedDate: string
}

const expenseStore = useExpenseStore()
const tripStore = useTripStore()
const userStore = useUserStore()
const currencyStore = useCurrencyStore()
const expenseTypeStore = useExpenseTypeStore()

const props = defineProps<{
  tripIds: number[]
  memberId: number
}>()

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId)
  if (!user) return `Пользователь ${userId}`
  return `${user.first_name} ${user.last_name}`.trim()
}

const getCurrencySymbol = (currencyId?: number) => {
  if (!currencyId) return '₽'
  return currencyStore.currencies.find(currency => currency.id === currencyId)?.symbol || '₽'
}

const getCategoryName = (categoryId: number) => {
  return expenseTypeStore.getExpenseTypeById(categoryId)?.name || 'Другое'
}

const debtItems = computed<DebtCardItem[]>(() => {
  return props.tripIds
    .flatMap(tripId => {
      const trip = tripStore.getTripById(tripId)
      const expenses = expenseStore.getExpensesByTripId(tripId)

      return expenses.flatMap(expense => {
        if (expense.user_id_pay === props.memberId) return []

        const allocations = expenseStore.getAllocationsByExpenseId(expense.id)
        const myAllocation = allocations.find(allocation => allocation.user_id === props.memberId)
        if (!myAllocation || myAllocation.amount <= 0) return []

        const currencySymbol = getCurrencySymbol(expense.currency_id || trip?.currency_id)
        const reason = expense.description?.trim() || getCategoryName(expense.type_of_expense)

        return [{
          tripId,
          tripEmoji: trip?.emoji || '✈️',
          tripTitle: trip?.title || `Поездка #${tripId}`,
          expenseId: expense.id,
          creditorId: expense.user_id_pay,
          creditorName: getUserName(expense.user_id_pay),
          amount: myAllocation.amount,
          formattedAmount: `${myAllocation.amount.toLocaleString('ru-RU')} ${currencySymbol}`,
          reason,
          categoryName: getCategoryName(expense.type_of_expense),
          formattedDate: new Date(expense.date).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        }]
      })
    })
    .sort((left, right) => right.amount - left.amount)
})

const totalDebt = computed(() => debtItems.value.reduce((sum, item) => sum + item.amount, 0))

const formattedTotalDebt = computed(() => {
  const defaultSymbol = currencyStore.currencies.find(currency => currency.id === 1)?.symbol || '₽'
  return `${totalDebt.value.toLocaleString('ru-RU')} ${defaultSymbol}`
})
</script>

<style scoped>
.page {
  padding: 16;
}

.summary-card,
.debt-card,
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
  font-size: 30;
  font-weight: 700;
  color: #1d4ed8;
  margin-top: 4;
}

.summary-caption {
  font-size: 13;
  color: #6b7280;
  margin-top: 6;
}

.debt-card-header {
  margin-bottom: 12;
  vertical-align: center;
}

.trip-emoji {
  font-size: 28;
  margin-right: 12;
}

.trip-title {
  font-size: 17;
  font-weight: 600;
  color: #1f2937;
}

.trip-date {
  font-size: 13;
  color: #9ca3af;
  margin-top: 2;
}

.debt-amount {
  font-size: 18;
  font-weight: 700;
  color: #ef4444;
  text-align: right;
}

.info-block {
  padding-top: 10;
  border-top-width: 1;
  border-top-color: #f3f4f6;
}

.info-text {
  font-size: 15;
  color: #374151;
  margin-bottom: 6;
}

.info-subtext {
  font-size: 13;
  color: #6b7280;
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
