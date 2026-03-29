<template>
  <Page modal="true" backgroundColor="rgba(0,0,0,0.5)">
    <StackLayout class="dialog-container">
      <StackLayout class="dialog-content">
        <Label text="✏️ Редактировать расход" class="dialog-title" />
        
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
        
        <!-- Заменяем DropDown на ListPicker -->
        <Label text="Категория" class="label" />
        <ListPicker 
          :items="categoryNames"
          :selectedIndex="selectedCategoryIndex"
          @selectedIndexChange="onCategoryChange"
          class="list-picker"
        />
        
        <!-- Заменяем DropDown на ListPicker для плательщика -->
        <Label text="Кто оплатил" class="label" />
        <ListPicker 
          :items="payerNames"
          :selectedIndex="selectedPayerIndex"
          @selectedIndexChange="onPayerChange"
          class="list-picker"
        />
        
        <!-- Заменяем DatePickerField на обычный TextField с подсказкой -->
        <TextField 
          v-model="expenseDate"
          hint="Дата (ГГГГ-ММ-ДД)" 
          class="input"
        />
        
        <Label text="За кого:" class="label" />
        <ScrollView height="200">
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
          <Button text="Сохранить" class="btn-primary" @tap="updateExpense" />
        </GridLayout>
      </StackLayout>
    </StackLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'nativescript-vue'
import { useExpenseStore } from '~/stores/expenseStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useUserStore } from '~/stores/userStore'
import type { Expense } from '~/models/expense'

const props = defineProps<{
  expense: Expense | null
  tripId: number
}>()

const emit = defineEmits(['close', 'updated'])

const expenseStore = useExpenseStore()
const tripMemberStore = useTripMemberStore()
const expenseTypeStore = useExpenseTypeStore()
const userStore = useUserStore()

const expenseDescription = ref('')
const expenseAmount = ref('')
const selectedCategoryId = ref<number | null>(null)
const selectedPayerId = ref<number | null>(null)
const expenseDate = ref('')
const selectedParticipants = ref<Record<number, boolean>>({})
const error = ref('')

const participants = computed(() => tripMemberStore.getTripMembersByTripId(props.tripId))
const categories = computed(() => expenseTypeStore.getAllExpenseTypes())

// Для ListPicker нужны массивы строк
const categoryNames = computed(() => categories.value.map(c => c.name))
const payerNames = computed(() => participants.value.map(p => getUserName(p.member_id)))

// Вычисляем индексы для ListPicker
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

const onCategoryChange = (args: any) => {
  const index = args.value
  if (categories.value[index]) {
    selectedCategoryId.value = categories.value[index].id
  }
}

const onPayerChange = (args: any) => {
  const index = args.value
  if (participants.value[index]) {
    selectedPayerId.value = participants.value[index].member_id
  }
}

const toggleParticipant = (userId: number) => {
  selectedParticipants.value[userId] = !selectedParticipants.value[userId]
}

onMounted(() => {
  if (props.expense) {
    expenseDescription.value = props.expense.description || ''
    expenseAmount.value = String(props.expense.amount)
    selectedCategoryId.value = props.expense.type_of_expense
    selectedPayerId.value = props.expense.user_id_pay
    expenseDate.value = props.expense.date
    
    const allocations = expenseStore.getAllocationsByExpenseId(props.expense.id)
    allocations.forEach(allocation => {
      selectedParticipants.value[allocation.user_id] = true
    })
  }
})

const updateExpense = () => {
  if (!expenseDescription.value || !expenseAmount.value || !selectedCategoryId.value || !selectedPayerId.value) {
    error.value = 'Заполните обязательные поля'
    return
  }
  
  const amount = parseFloat(expenseAmount.value)
  if (isNaN(amount) || amount <= 0) {
    error.value = 'Введите корректную сумму'
    return
  }
  
  const selectedUserIds = Object.entries(selectedParticipants.value)
    .filter(([, selected]) => selected)
    .map(([id]) => parseInt(id))
  
  if (selectedUserIds.length === 0) {
    error.value = 'Выберите хотя бы одного участника'
    return
  }
  
  if (props.expense) {
    // Обновляем расход
    expenseStore.updateExpense(props.expense.id, {
      description: expenseDescription.value,
      amount: amount,
      type_of_expense: selectedCategoryId.value,
      user_id_pay: selectedPayerId.value,
      date: expenseDate.value
    })
    
    // Удаляем старые распределения
    const oldAllocations = expenseStore.getAllocationsByExpenseId(props.expense.id)
    oldAllocations.forEach(allocation => {
      expenseStore.deleteExpenseAllocation(allocation.id)
    })
    
    // Добавляем новые распределения
    const amountPerPerson = amount / selectedUserIds.length
    selectedUserIds.forEach(userId => {
      expenseStore.addExpenseAllocation({
        expense_id: props.expense!.id,
        user_id: userId,
        amount: amountPerPerson
      })
    })
  }
  
  emit('updated')
  close()
}

const close = () => {
  emit('close')
}
</script>

<style scoped>
.dialog-container {
  background-color: rgba(0, 0, 0, 0.5);
  height: 100%;
  justify-content: center;
  align-items: center;
}

.dialog-content {
  background-color: white;
  border-radius: 16;
  padding: 20;
  width: 90%;
  max-height: 90%;
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

.list-picker {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  padding: 8;
  margin-bottom: 8;
  height: 40;
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