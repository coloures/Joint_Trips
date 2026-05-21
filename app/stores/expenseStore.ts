import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { Expense } from '~/models/expense';
import type { ExpenseAllocation } from '~/models/expense_allocation';
import type { TripMember } from '~/models/trip_member';

import { useTripMemberStore } from '~/stores/tripMemberStore';
import {
  fetchExpenses,
  createExpense as createExpenseApi,
  updateExpense as updateExpenseApi,
  deleteExpense as deleteExpenseApi
} from '~/services/expenseApi';
import {
  fetchExpenseAllocations,
  createAllocation as createAllocationApi,
  deleteAllocation as deleteAllocationApi
} from '~/services/allocationApi';

export interface Debt {
  fromUserId: number; // Кто должен
  toUserId: number;  // Кому должен
  amount: number;     // Сумма долга
}

export const useExpenseStore = defineStore('expense', () => {
  // Состояние
  const expenses = ref<Expense[]>([]);
  const expenseAllocations = ref<ExpenseAllocation[]>([]);
  const isSyncing = ref(false);
  const syncError = ref<string | null>(null);

  async function loadAll() {
    if (isSyncing.value) return;
    isSyncing.value = true;
    syncError.value = null;
    try {
      const loadedExpenses = await fetchExpenses()
      console.log('loadedExpenses сделан');
      const loadedAllocations = await fetchExpenseAllocations()
      console.log('loadedAllocations сделан');
      expenses.value = loadedExpenses;
      expenseAllocations.value = loadedAllocations;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to sync expenses';
      syncError.value = message;
      console.warn('[ExpenseStore] Failed to sync with API', error);
    } finally {
      console.log('[ExpenseStore] сделал свое дело');
      isSyncing.value = false;
    }
  }

  async function init() {
    void await loadAll();
    console.log(`[ExpenseStore] Загружено ${expenses.value.length} расходов и ${expenseAllocations.value.length} распределений`);
  }
  // init();

  // Получить все расходы
  const getAllExpenses = () => expenses.value;

  // Получить расходы поездки
  const getExpensesByTripId = (tripId: number): Expense[] => {
    return expenses.value.filter(expense => expense.trip_id === tripId);
  };

  // Получить все распределения
  const getAllExpenseAllocations = () => expenseAllocations.value;

  // Получить распределения по id расхода
  const getAllocationsByExpenseId = (expenseId: number): ExpenseAllocation[] => {
    return expenseAllocations.value.filter(allocation => allocation.expense_id === expenseId);
  };

  const getTotalExpensesByTripId = (tripId: number): number => {
    return getExpensesByTripId(tripId).reduce((sum, e) => sum + e.amount, 0);
  };

  const getExpensesByCategory = (tripId: number, categoryId: number): Expense[] => {
    return getExpensesByTripId(tripId).filter(e => e.type_of_expense === categoryId);
  };

  const getTotalByCategory = (tripId: number, categoryId: number): number => {
    return getExpensesByCategory(tripId, categoryId).reduce((sum, e) => sum + e.amount, 0);
  };

  // Получить распределения поездки
  const getAllocationsByTripId = (tripId: number): ExpenseAllocation[] => {
    const tripExpenseIds = getExpensesByTripId(tripId).map(exp => exp.id);
    return expenseAllocations.value.filter(allocation => tripExpenseIds.includes(allocation.expense_id));
  };

  // Упрощённый расчёт долгов: кто сколько должен каждому, без оптимизации цепочек
  function calculateDebts(tripId: number): Debt[] {
    const tripMemberStore = useTripMemberStore();
    const tripMembers = tripMemberStore.getTripMembersByTripId(tripId);
    const participantIds = tripMembers.map(member => member.member_id);

    // Карта: userId -> сумма, которую он должен каждому другому участнику
    // debtsMap[2][1] = 1500 означает, что пользователь 2 должен пользователю 1 сумму 1500
    const debtsMap = new Map<number, Map<number, number>>();
    
    // Инициализируем карту
    participantIds.forEach(payerId => {
      const innerMap = new Map<number, number>();
      participantIds.forEach(payeeId => {
        if (payerId !== payeeId) {
          innerMap.set(payeeId, 0);
        }
      });
      debtsMap.set(payerId, innerMap);
    });

    // Проходим по всем расходам поездки
    getExpensesByTripId(tripId).forEach(expense => {
      const payerId = expense.user_id_pay;
      const allocationForThisExpense = getAllocationsByExpenseId(expense.id);
      
      // Проходим по каждому распределению этого расхода
      allocationForThisExpense.forEach(allocation => {
        const payeeId = allocation.user_id;
        const amountOwed = allocation.amount;
        
        // Если плательщик не должен сам себе
        if (payerId !== payeeId) {
          // Прибавляем долг участника плательщику
          const currentDebt = debtsMap.get(payeeId)?.get(payerId) || 0;
          debtsMap.get(payeeId)?.set(payerId, currentDebt + amountOwed);
        }
      });
    });

    // Преобразуем карту долгов в плоский массив Debt[]
    const debts: Debt[] = [];
    debtsMap.forEach((innerMap, debtorId) => {
      innerMap.forEach((amount, creditorId) => {
        if (amount > 0) {
          debts.push({
            fromUserId: debtorId,
            toUserId: creditorId,
            amount
          });
        }
      });
    });

    return debts;
  }

  // Методы для добавления данных
  async function addExpense(expense: Omit<Expense, 'id'>) {
    const created = await createExpenseApi(expense);
    expenses.value.push(created);
    return created.id;
  }

  async function addExpenseAllocation(allocation: Omit<ExpenseAllocation, 'id'>) {
    const created = await createAllocationApi({
      expense_id: allocation.expense_id,
      user_id: allocation.user_id,
      amount: allocation.amount,
      isPaid: allocation.isPaid
    });
    expenseAllocations.value.push(created);
    return created.id;
  }

  async function updateExpense(id: number, updates: Partial<Omit<Expense, 'id'>>) {
    const updated = await updateExpenseApi(id, updates);
    const index = expenses.value.findIndex(e => e.id === id);
    if (index !== -1) {
      expenses.value[index] = updated;
    } else {
      expenses.value.push(updated);
    }
    return updated;
  }

  async function deleteExpense(id: number) {
    await deleteExpenseApi(id);
    expenses.value = expenses.value.filter(e => e.id !== id)
    // Удаляем также распределения этого расхода
    expenseAllocations.value = expenseAllocations.value.filter(a => a.expense_id !== id)
  }

  async function deleteExpenseAllocation(id: number) {
    await deleteAllocationApi(id);
    expenseAllocations.value = expenseAllocations.value.filter(a => a.id !== id)
  }


  return {
    // Состояние
    expenses,
    expenseAllocations,
    isSyncing,
    syncError,
    
    // Геттеры
    getAllExpenses,
    getExpensesByTripId,
    getAllExpenseAllocations,
    getAllocationsByExpenseId,
    getAllocationsByTripId,
    getTotalExpensesByTripId,
    getExpensesByCategory,
    getTotalByCategory,
    
    // Метод
    calculateDebts,
    loadAll,
    
    // Методы для изменения
    addExpense,
    addExpenseAllocation,
    updateExpense,
    deleteExpense,
    deleteExpenseAllocation
  };
});
