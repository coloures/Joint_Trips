<template>
  <GridLayout columns="auto, *, auto" class="expense-card" @tap="onTap">
    <Label :text="getEmojiByType(expense.type_of_expense)" col="0" class="expense-emoji" />
    
    <StackLayout col="1" class="expense-info">
      <!-- Используем description как название -->
      <Label :text="expense.description || getCategoryName(expense.type_of_expense)" class="expense-name" />
      <Label :text="formattedDate" class="expense-date" />
      <Label :text="`Оплатил: ${getUserName(expense.user_id_pay)}`" class="expense-payer" />
    </StackLayout>
    
    <StackLayout col="2" class="expense-amount-wrapper">
      <Label :text="`${expense.amount.toLocaleString('ru-RU')} ₽`" class="expense-amount" />
      <Label v-if="myShare" :text="`Ваша доля: ${myShare.toLocaleString('ru-RU')} ₽`" class="my-share" />
    </StackLayout>
  </GridLayout>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue';
import type { Expense } from '~/models/expense';
import { useExpenseStore } from '~/stores/expenseStore';
import { useUserStore } from '~/stores/userStore';
import { useExpenseTypeStore } from '~/stores/expenseTypeStore';

const props = defineProps<{
  expense: Expense;
  currentUserId?: number;
}>();

const emit = defineEmits(['tap']);

const expenseStore = useExpenseStore();
const userStore = useUserStore();
const expenseTypeStore = useExpenseTypeStore();

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId);
  return user?.first_name || user?.first_name || `Пользователь ${userId}`;
};

const getCategoryName = (typeId: number) => {
  const type = expenseTypeStore.getExpenseTypeById(typeId);
  return type?.name || 'Другое';
};

const getEmojiByType = (typeId: number) => {
  const type = expenseTypeStore.getExpenseTypeById(typeId);
  const emojis: Record<string, string> = {
    'Билеты': '✈️',
    'Отели': '🏨',
    'Питание': '🍜',
    'Развлечения': '🎉',
    'Страховка': '🛡️',
    'Другое': '📝'
  };
  return emojis[type?.name || 'Другое'] || '💰';
};

const formattedDate = computed(() => {
  const date = new Date(props.expense.date);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
});

const myShare = computed(() => {
  if (!props.currentUserId) return null;
  const allocations = expenseStore.getAllocationsByExpenseId(props.expense.id);
  const myAllocation = allocations.find(a => a.user_id === props.currentUserId);
  return myAllocation?.amount || 0;
});

const onTap = () => {
  emit('tap', props.expense.id);
};
</script>

<style scoped>
.expense-card {
  background-color: white;
  border-radius: 12;
  padding: 12;
  margin-bottom: 8;
  border-width: 1;
  border-color: #e5e7eb;
}

.expense-emoji {
  font-size: 32;
  margin-right: 12;
}

.expense-info {
  margin-right: 12;
}

.expense-name {
  font-size: 16;
  font-weight: 600;
  color: #1f2937;
}

.expense-date {
  font-size: 12;
  color: #6b7280;
  margin-top: 2;
}

.expense-payer {
  font-size: 11;
  color: #9ca3af;
  margin-top: 2;
}

.expense-amount-wrapper {
  align-items: flex-end;
}

.expense-amount {
  font-size: 16;
  font-weight: bold;
  color: #3b82f6;
}

.my-share {
  font-size: 10;
  color: #10b981;
  margin-top: 4;
}
</style>