import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { TripBudgetCategory } from '~/models/tripbudgetcategory';
import TripBudgetCategories from '../seeders/trip_budget_categories.json';

export const useTripBudgetCategoryStore = defineStore('tripBudgetCategory', () => {
  // Состояние
  const tripBudgetCategories = ref<TripBudgetCategory[]>([]);

  // Инициализация из сидов
  function init() {
    tripBudgetCategories.value = JSON.parse(JSON.stringify(TripBudgetCategories));
    console.log(`[TripBudgetCategoryStore] Загружено ${tripBudgetCategories.value.length} записей бюджета`);
  }
  init();

  // Геттеры
  const getAllTripBudgetCategories = () => tripBudgetCategories.value;

  const getBudgetCategoriesByTripId = (tripId: number): TripBudgetCategory[] => {
    return tripBudgetCategories.value.filter(bc => bc.trip_id === tripId);
  };

  const getBudgetCategory = (tripId: number, expenseTypeId: number): TripBudgetCategory | null => {
    return tripBudgetCategories.value.find(
      bc => bc.trip_id === tripId && bc.expense_type_id === expenseTypeId
    ) || null;
  };

  // Сумма запланированного бюджета по поездке
  const getPlannedBudgetByTripId = (tripId: number): number => {
    return getBudgetCategoriesByTripId(tripId)
      .reduce((sum, bc) => sum + bc.planned_amount, 0);
  };

  // Методы для изменения данных
  function addTripBudgetCategory(category: Omit<TripBudgetCategory, 'id'>) {
    const newCategory: TripBudgetCategory = {
      ...category,
      id: Math.max(0, ...tripBudgetCategories.value.map(bc => bc.id)) + 1
    };
    tripBudgetCategories.value.push(newCategory);
  }

  function updateTripBudgetCategory(id: number, updates: Partial<TripBudgetCategory>) {
    const index = tripBudgetCategories.value.findIndex(bc => bc.id === id);
    if (index !== -1) {
      tripBudgetCategories.value[index] = { ...tripBudgetCategories.value[index], ...updates };
    }
  }

  function deleteTripBudgetCategory(id: number) {
    tripBudgetCategories.value = tripBudgetCategories.value.filter(bc => bc.id !== id);
  }

  // Удобный метод: установить/обновить бюджет для категории
  function setBudgetForCategory(tripId: number, expenseTypeId: number, amount: number) {
    const existing = getBudgetCategory(tripId, expenseTypeId);
    if (existing) {
      updateTripBudgetCategory(existing.id, { planned_amount: amount });
    } else {
      addTripBudgetCategory({
        trip_id: tripId,
        expense_type_id: expenseTypeId,
        planned_amount: amount
      });
    }
  }

  // Возвращаем публичный API
  return {
    tripBudgetCategories,
    getAllTripBudgetCategories,
    getBudgetCategoriesByTripId,
    getBudgetCategory,
    getPlannedBudgetByTripId,
    addTripBudgetCategory,
    updateTripBudgetCategory,
    deleteTripBudgetCategory,
    setBudgetForCategory
  };
});