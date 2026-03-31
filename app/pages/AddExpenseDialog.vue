<template>
  <Page backgroundColor="white">
    <ActionBar title="Добавить расход" backgroundColor="#3b82f6" color="white">
      <NavigationButton text="Назад" android.systemIcon="ic_menu_back" @tap="close" />
    </ActionBar>
    <ScrollView>
      <StackLayout class="dialog-container">
        <StackLayout class="dialog-content">
          <Label text="➕ Добавить расход" class="dialog-title" />
          
          <TextField 
            v-model="expenseDescription"
            hint="Описание расхода *" 
            class="input"
          />
          
          <TextField 
            v-model="expenseAmount"
            hint="Сумма *" 
            keyboard-type="number"
            class="input"
          />
          
          <Label text="Категория" class="label" />
          <DropDown
            :items="categoryNames"
            :selectedIndex="selectedCategoryIndex"
            @selectedIndexChanged="onCategoryChange"
            class="dropdown"
          />
          
          <Label 
            v-if="categoryBudgetWarning" 
            :text="categoryBudgetWarning" 
            class="warning"
          />
          
          <Label text="Кто оплатил" class="label" />
          <DropDown
            :items="payerNames"
            :selectedIndex="selectedPayerIndex"
            @selectedIndexChanged="onPayerChange"
            class="dropdown"
          />
          
          <TextField 
            v-model="expenseDate"
            hint="Дата (ГГГГ-ММ-ДД)" 
            class="input"
          />
          
          <Label text="За кого:" class="label" />
          <ScrollView height="200" class="participants-wrapper">
            <StackLayout>
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
                <Label 
                  col="1"
                  :text="getUserName(participant.member_id)"
                  class="participant-name"
                />
              </GridLayout>
            </StackLayout>
          </ScrollView>
          
          <Label v-if="error" :text="error" class="error" />
          
          <GridLayout columns="*, *" class="dialog-buttons">
            <Button text="Отмена" class="btn-outline" @tap="close" />
            <Button text="Добавить" class="btn-primary" @tap="addExpense" />
          </GridLayout>
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, watch, $navigateBack } from 'nativescript-vue'
import { useExpenseStore } from '~/stores/expenseStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useTripBudgetCategoryStore } from '~/stores/tripBudgetCategoryStore'
import { useUserStore } from '~/stores/userStore'
import type { SelectedIndexChangedEventData } from 'nativescript-drop-down'

const props = defineProps<{
  tripId: number
}>()

const expenseStore = useExpenseStore()
const tripMemberStore = useTripMemberStore()
const expenseTypeStore = useExpenseTypeStore()
const userStore = useUserStore()
const budgetCategoryStore = useTripBudgetCategoryStore()

const expenseDescription = ref('')
const expenseAmount = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedPayerId = ref<number | null>(null)
const expenseDate = ref(new Date().toISOString().split('T')[0])
const selectedParticipants = ref<Record<number, boolean>>({})
const error = ref('')
const categoryBudgetWarning = ref('')

const participants = computed(() => tripMemberStore.getTripMembersByTripId(props.tripId))
const categories = computed(() => expenseTypeStore.getAllExpenseTypes())

watch(
  categories,
  (value) => {
    if (!selectedCategoryId.value && value.length) {
      selectedCategoryId.value = value[0].id
    }
  },
  { immediate: true }
)

watch(
  participants,
  (value) => {
    if (!selectedPayerId.value && value.length) {
      selectedPayerId.value = value[0].member_id
    }
  },
  { immediate: true }
)

const categoryNames = computed(() => categories.value.map(c => c.name))
const payerNames = computed(() => participants.value.map(p => getUserName(p.member_id)))

const selectedCategoryIndex = computed(() => {
  if (!selectedCategoryId.value) return 0
  const index = categories.value.findIndex(c => c.id === selectedCategoryId.value)
  return index >= 0 ? index : 0
})

const selectedPayerIndex = computed(() => {
  if (!selectedPayerId.value) return 0
  const index = participants.value.findIndex(p => p.member_id === selectedPayerId.value)
  return index >= 0 ? index : 0
})

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId)
  return user?.first_name || user?.first_name || `Пользователь ${userId}`
}

const getCategoryBudget = (categoryId: number): number => {
  const budget = budgetCategoryStore.getBudgetCategory(props.tripId, categoryId)
  return budget?.planned_amount || 0
}

const getCategorySpent = (categoryId: number): number => {
  return expenseStore.getTotalByCategory(props.tripId, categoryId)
}

const checkCategoryLimit = (categoryId: number, amount: number): { allowed: boolean; remaining: number; message: string } => {
  const budget = getCategoryBudget(categoryId)
  if (budget === 0) {
    return { allowed: true, remaining: Infinity, message: '' }
  }
  
  const spent = getCategorySpent(categoryId)
  const remaining = budget - spent
  
  if (amount > remaining) {
    return { 
      allowed: false, 
      remaining, 
      message: `Превышение бюджета категории! Остаток: ${remaining.toLocaleString('ru-RU')} ₽` 
    }
  }
  
  return { allowed: true, remaining, message: '' }
}

watch([expenseAmount, selectedCategoryId], ([amount, categoryId]) => {
  if (!amount || !categoryId) {
    categoryBudgetWarning.value = ''
    return
  }
  
  const numAmount = parseFloat(amount)
  if (isNaN(numAmount) || numAmount <= 0) {
    categoryBudgetWarning.value = ''
    return
  }
  
  const check = checkCategoryLimit(categoryId, numAmount)
  if (!check.allowed) {
    categoryBudgetWarning.value = check.message
  } else if (check.remaining !== Infinity && check.remaining < 10000) {
    categoryBudgetWarning.value = `⚠️ Остаток бюджета: ${check.remaining.toLocaleString('ru-RU')} ₽`
  } else {
    categoryBudgetWarning.value = ''
  }
})

const onCategoryChange = (args: SelectedIndexChangedEventData) => {
  const index = args.newIndex
  if (index >= 0 && categories.value[index]) {
    selectedCategoryId.value = categories.value[index].id
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

const addExpense = () => {
  if (!expenseDescription.value || !expenseAmount.value || !selectedCategoryId.value || !selectedPayerId.value) {
    error.value = 'Заполните обязательные поля'
    return
  }
  
  const amount = parseFloat(expenseAmount.value)
  if (isNaN(amount) || amount <= 0) {
    error.value = 'Введите корректную сумму'
    return
  }
  
  const budgetCheck = checkCategoryLimit(selectedCategoryId.value, amount)
  if (!budgetCheck.allowed) {
    error.value = budgetCheck.message
    return
  }
  
  const selectedUserIds = Object.entries(selectedParticipants.value)
    .filter(([, selected]) => selected)
    .map(([id]) => parseInt(id))
  
  if (selectedUserIds.length === 0) {
    error.value = 'Выберите хотя бы одного участника'
    return
  }
  
  const newExpense = expenseStore.addExpense({
    trip_id: props.tripId,
    description: expenseDescription.value,
    amount: amount,
    type_of_expense: selectedCategoryId.value,
    user_id_pay: selectedPayerId.value,
    date: expenseDate.value,
    currency_id: 1
  })
  
  const amountPerPerson = amount / selectedUserIds.length
  selectedUserIds.forEach(userId => {
    expenseStore.addExpenseAllocation({
      expense_id: newExpense,
      user_id: userId,
      amount: amountPerPerson
    })
  })
  close()
}

const close = () => {
  $navigateBack()
}
</script>

<style scoped>
.dialog-container {
  padding: 16;
}

.dialog-content {
  background-color: white;
  border-radius: 16;
  padding: 20;
  width: 100%;
  elevation: 2;
  shadow-color: #000;
  shadow-offset: 0 2;
  shadow-opacity: 0.08;
  shadow-radius: 6;
  margin-bottom: 16;
}

.dialog-title {
  font-size: 20;
  font-weight: bold;
  margin-bottom: 16;
  text-align: center;
}

.input {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  padding: 12;
  margin-bottom: 12;
  font-size: 14;
}

.label {
  font-size: 14;
  font-weight: 500;
  margin-bottom: 4;
  margin-top: 8;
  color: #374151;
}

.dropdown {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  margin-bottom: 8;
  height: 44;
  padding: 4 8;
  background-color: white;
}

.participants-wrapper {
  max-height: 200;
  margin-top: 4;
  border-width: 1;
  border-color: #f3f4f6;
  border-radius: 8;
  padding: 4;
}

.participant-row {
  padding: 12;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
}

.checkbox {
  font-size: 18;
  margin-right: 12;
  width: 32;
}

.participant-name {
  margin-left: 8;
  font-size: 14;
}

.warning {
  color: #f59e0b;
  font-size: 12;
  margin-top: -4;
  margin-bottom: 8;
  text-align: center;
}

.error {
  color: #ef4444;
  font-size: 12;
  margin-top: 8;
  text-align: center;
}

.dialog-buttons {
  margin-top: 20;
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
  border-color: #9ca3af;
  color: #6b7280;
  padding: 12;
  border-radius: 8;
}
</style>
