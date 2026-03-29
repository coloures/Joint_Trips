<template>
  <Page modal="true" backgroundColor="rgba(0,0,0,0.5)">
    <StackLayout class="dialog-container">
      <StackLayout class="dialog-content">
        <Label :text="dialogTitle" class="dialog-title" />
        
        <TextField 
          v-model="budgetAmount"
          hint="Бюджет на категорию" 
          keyboard-type="number"
          class="input"
        />
        
        <Label text="₽" class="currency-hint" />
        
        <Label v-if="error" :text="error" class="error" />
        
        <GridLayout columns="*, *" class="dialog-buttons">
          <Button text="Отмена" class="btn-outline" @tap="close" />
          <Button text="Сохранить" class="btn-primary" @tap="saveBudget" />
        </GridLayout>
      </StackLayout>
    </StackLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed } from 'nativescript-vue'
import { useTripBudgetCategoryStore } from '~/stores/tripBudgetCategoryStore'
import type { ExpenseType } from '~/models/type_of_expense'

const props = defineProps<{
  tripId: number
  category: ExpenseType | null
  currentBudget: number
}>()

const emit = defineEmits(['close', 'saved'])

const budgetCategoryStore = useTripBudgetCategoryStore()
const budgetAmount = ref(String(props.currentBudget || ''))
const error = ref('')

// 🔹 Исправляем - используем computed с проверкой на null
const dialogTitle = computed(() => {
  if (!props.category) return 'Редактировать бюджет'
  const emoji = getCategoryEmoji(props.category.name)
  return `${emoji} ${props.category.name}`
})

const getCategoryEmoji = (categoryName: string): string => {
  const emojis: Record<string, string> = {
    'Билеты': '✈️',
    'Отели': '🏨',
    'Питание': '🍜',
    'Развлечения': '🎉',
    'Страховка': '🛡️',
    'Другое': '📝'
  }
  return emojis[categoryName] || '💰'
}

const saveBudget = () => {
  const amount = parseInt(budgetAmount.value)
  
  if (isNaN(amount) || amount < 0) {
    error.value = 'Введите корректную сумму'
    return
  }
  
  if (props.category) {
    budgetCategoryStore.setBudgetForCategory(props.tripId, props.category.id, amount)
  }
  
  emit('saved')
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
  width: 85%;
}

.dialog-title {
  font-size: 20;
  font-weight: bold;
  margin-bottom: 20;
  text-align: center;
}

.input {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  padding: 12;
  font-size: 18;
  text-align: center;
}

.currency-hint {
  text-align: center;
  color: #6b7280;
  font-size: 12;
  margin-top: 4;
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