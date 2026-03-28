import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { ExpenseType } from '~/models/type_of_expense';
import ExpenseTypes from '../seeders/expense_types.json';

export const useExpenseTypeStore = defineStore('expenseType', () => {
  // Состояние
  const expenseTypes = ref<ExpenseType[]>([]);

  // Инициализация из сидов
  function init() {
    expenseTypes.value = JSON.parse(JSON.stringify(ExpenseTypes));
    console.log(`[ExpenseTypeStore] Загружено ${expenseTypes.value.length} категорий расходов`);
  }
  init();

  // Геттеры
  const getAllExpenseTypes = () => expenseTypes.value;

  const getExpenseTypeById = (id: number): ExpenseType | null => {
    return expenseTypes.value.find(et => et.id === id) || null;
  };

  const getExpenseTypeByName = (name: string): ExpenseType | null => {
    return expenseTypes.value.find(et => et.name.toLowerCase() === name.toLowerCase()) || null;
  };

  // Методы для изменения данных
  function addExpenseType(expenseType: Omit<ExpenseType, 'id'>) {
    const newExpenseType: ExpenseType = {
      ...expenseType,
      id: Math.max(0, ...expenseTypes.value.map(et => et.id)) + 1
    };
    expenseTypes.value.push(newExpenseType);
  }

  function updateExpenseType(id: number, updates: Partial<ExpenseType>) {
    const index = expenseTypes.value.findIndex(et => et.id === id);
    if (index !== -1) {
      expenseTypes.value[index] = { ...expenseTypes.value[index], ...updates };
    }
  }

  function deleteExpenseType(id: number) {
    expenseTypes.value = expenseTypes.value.filter(et => et.id !== id);
  }

  // Возвращаем публичный API
  return {
    expenseTypes,
    getAllExpenseTypes,
    getExpenseTypeById,
    getExpenseTypeByName,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType
  };
});