import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { Expense } from '~/models/expense';
import type { ExpenseAllocation } from '~/models/expense_allocation';
import type { TripMember } from '~/models/trip_member';

import Expenses from '../seeders/expenses.json';
import ExpenseAllocations from '../seeders/expensesallocation.json';

import { useTripMemberStore } from '~/stores/tripMemberStore';

export interface Debt {
  fromUserId: number; // Кто должен
  toUserId: number;  // Кому должен
  amount: number;     // Сумма долга
}

export const useExpenseStore = defineStore('expense', () => {
  // Состояние
  const expenses = ref<Expense[]>([]);
  const expenseAllocations = ref<ExpenseAllocation[]>([]);

  function init() {
    expenses.value = JSON.parse(JSON.stringify(Expenses));
    expenseAllocations.value = JSON.parse(JSON.stringify(ExpenseAllocations));
    console.log(`[ExpenseStore] Загружено ${expenses.value.length} расходов и ${expenseAllocations.value.length} распределений`);
  }
  init();

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
  function addExpense(expense: Omit<Expense, 'id'>) {
    const newExpense: Expense = {
      ...expense,
      id: Math.max(0, ...expenses.value.map(e => e.id)) + 1
    };
    expenses.value.push(newExpense);
  }

  function addExpenseAllocation(allocation: Omit<ExpenseAllocation, 'id'>) {
    const newAllocation: ExpenseAllocation = {
      ...allocation,
      id: Math.max(0, ...expenseAllocations.value.map(e => e.id)) + 1
    };
    expenseAllocations.value.push(newAllocation);
  }

  return {
    // Состояние
    expenses,
    expenseAllocations,
    
    // Геттеры
    getAllExpenses,
    getExpensesByTripId,
    getAllExpenseAllocations,
    getAllocationsByExpenseId,
    getAllocationsByTripId,
    
    // Метод
    calculateDebts,
    
    // Методы для изменения
    addExpense,
    addExpenseAllocation
  };
});