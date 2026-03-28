<template>
  <Page modal="true" backgroundColor="rgba(0,0,0,0.5)">
    <StackLayout class="dialog-container">
      <StackLayout class="dialog-content">
        <Label text="Добавить расход" class="dialog-title" />
        
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
        
        <DropDown 
          v-model="selectedCategoryId"
          :items="categoryOptions"
          hint="Категория *"
          class="input"
        />
        
        <DropDown 
          v-model="selectedPayerId"
          :items="payerOptions"
          hint="Кто оплатил *"
          class="input"
        />
        
        <DatePickerField 
          v-model="expenseDate"
          hint="Дата"
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
            >
              <CheckBox 
                col="0"
                v-model="selectedParticipants[participant.member_id]"
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
  </Page>
</template>

<script setup lang="ts">
import { ref, computed } from 'nativescript-vue';
import { useExpenseStore } from '~/stores/expenseStore';
import { useTripMemberStore } from '~/stores/tripMemberStore';
import { useExpenseTypeStore } from '~/stores/expenseTypeStore';
import { useUserStore } from '~/stores/userStore';
import { useTripBudgetCategoryStore } from '~/stores/tripBudgetCategoryStore';

const props = defineProps<{
  tripId: number;
}>();

const emit = defineEmits(['close', 'added']);

const expenseStore = useExpenseStore();
const tripMemberStore = useTripMemberStore();
const expenseTypeStore = useExpenseTypeStore();
const userStore = useUserStore();
const budgetStore = useTripBudgetCategoryStore();

const expenseDescription = ref('');
const expenseAmount = ref('');
const selectedCategoryId = ref<number | null>(null);
const selectedPayerId = ref<number | null>(null);
const expenseDate = ref(new Date().toISOString().split('T')[0]);
const selectedParticipants = ref<Record<number, boolean>>({});
const error = ref('');

const participants = computed(() => tripMemberStore.getTripMembersByTripId(props.tripId));

const categoryOptions = computed(() => 
  expenseTypeStore.getAllExpenseTypes().map(cat => ({
    label: cat.name,
    value: cat.id
  }))
);

const payerOptions = computed(() => 
  participants.value.map(p => ({
    label: getUserName(p.member_id),
    value: p.member_id
  }))
);

const getUserName = (userId: number) => {
  const user = userStore.getUserById(userId);
  return user?.first_name || user?.first_name || `Пользователь ${userId}`;
};

const checkBudgetLimit = () => {
  if (!selectedCategoryId.value) return true;
  
  const amount = parseFloat(expenseAmount.value);
  if (isNaN(amount)) return true;
  
  const budget = budgetStore.getBudgetCategory(props.tripId, selectedCategoryId.value);
  if (!budget) return true;
  
  const spent = expenseStore.getTotalByCategory(props.tripId, selectedCategoryId.value);
  return (spent + amount) <= budget.planned_amount;
};

const addExpense = () => {
  // Валидация
  if (!expenseDescription.value || !expenseAmount.value || !selectedCategoryId.value || !selectedPayerId.value) {
    error.value = 'Заполните обязательные поля';
    return;
  }
  
  const amount = parseFloat(expenseAmount.value);
  if (isNaN(amount) || amount <= 0) {
    error.value = 'Введите корректную сумму';
    return;
  }
  
  // Проверка бюджета
  if (!checkBudgetLimit()) {
    error.value = 'Превышение бюджета категории';
    return;
  }
  
  const selectedUserIds = Object.entries(selectedParticipants.value)
    .filter(([, selected]) => selected)
    .map(([id]) => parseInt(id));
  
  if (selectedUserIds.length === 0) {
    error.value = 'Выберите хотя бы одного участника';
    return;
  }
  
  // Добавляем расход (используем description как название)
  const newExpense = expenseStore.addExpense({
    trip_id: props.tripId,
    description: expenseDescription.value,  // ← description вместо name
    amount: amount,
    type_of_expense: selectedCategoryId.value,  // ← type_of_expense
    user_id_pay: selectedPayerId.value,
    date: expenseDate.value,
    currency_id: 1  // ← добавили currency_id
  });
  
  // Распределяем сумму
  const amountPerPerson = amount / selectedUserIds.length;
  selectedUserIds.forEach(userId => {
    expenseStore.addExpenseAllocation({
      expense_id: newExpense,
      user_id: userId,
      amount: amountPerPerson
    });
  });
  
  emit('added');
  close();
};

const close = () => {
  emit('close');
};
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
  margin-bottom: 8;
  color: #374151;
}

.participant-row {
  padding: 8;
  border-bottom-width: 1;
  border-bottom-color: #f3f4f6;
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