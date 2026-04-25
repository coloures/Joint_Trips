import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { TripBudgetCategory } from '~/models/tripbudgetcategory'
import {
  fetchTripBudgetCategoriesByTripId,
  createTripBudgetCategory as createTripBudgetCategoryApi,
  updateTripBudgetCategory as updateTripBudgetCategoryApi,
  deleteTripBudgetCategory as deleteTripBudgetCategoryApi
} from '~/services/tripBudgetApi'

export const useTripBudgetCategoryStore = defineStore('tripBudgetCategory', () => {
  const tripBudgetCategories = ref<TripBudgetCategory[]>([])
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  const loadedTrips = new Set<number>()

  const getAllTripBudgetCategories = () => tripBudgetCategories.value

  const getBudgetCategoriesByTripId = (tripId: number): TripBudgetCategory[] => {
    return tripBudgetCategories.value.filter(bc => bc.trip_id === tripId)
  }

  const getBudgetCategory = (tripId: number, expenseTypeId: number): TripBudgetCategory | null => {
    return (
      tripBudgetCategories.value.find(
        bc => bc.trip_id === tripId && bc.expense_type_id === expenseTypeId
      ) || null
    )
  }

  const getPlannedBudgetByTripId = (tripId: number): number => {
    return getBudgetCategoriesByTripId(tripId).reduce((sum, bc) => sum + bc.planned_amount, 0)
  }

  async function loadTripBudgetCategories(tripId: number, { force = false }: { force?: boolean } = {}) {
    if (!force && loadedTrips.has(tripId)) return
    if (isSyncing.value) return

    isSyncing.value = true
    syncError.value = null
    try {
      const list = await fetchTripBudgetCategoriesByTripId(tripId)
      tripBudgetCategories.value = [
        ...tripBudgetCategories.value.filter(bc => bc.trip_id !== tripId),
        ...list
      ]
      loadedTrips.add(tripId)
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to sync trip budgets'
      console.warn('[TripBudgetCategoryStore] Failed to load budgets', error)
    } finally {
      isSyncing.value = false
    }
  }

  async function addTripBudgetCategory(category: Omit<TripBudgetCategory, 'id'>) {
    const id = await createTripBudgetCategoryApi(category)
    const created: TripBudgetCategory = { ...category, id }
    tripBudgetCategories.value.push(created)
    loadedTrips.add(created.trip_id)
    return created
  }

  async function updateTripBudgetCategory(id: number, updates: Partial<TripBudgetCategory>) {
    const existing = tripBudgetCategories.value.find(bc => bc.id === id)
    if (!existing) return null

    const next = { ...existing, ...updates }
    const updated = await updateTripBudgetCategoryApi({
      trip_id: next.trip_id,
      expense_type_id: next.expense_type_id,
      planned_amount: next.planned_amount
    })

    const index = tripBudgetCategories.value.findIndex(bc => bc.id === id)
    if (index !== -1) tripBudgetCategories.value[index] = updated
    loadedTrips.add(updated.trip_id)
    return updated
  }

  async function deleteTripBudgetCategory(id: number) {
    await deleteTripBudgetCategoryApi(id)
    tripBudgetCategories.value = tripBudgetCategories.value.filter(bc => bc.id !== id)
  }

  async function setBudgetForCategory(tripId: number, expenseTypeId: number, amount: number) {
    const existing = getBudgetCategory(tripId, expenseTypeId)
    if (existing) {
      return updateTripBudgetCategory(existing.id, { planned_amount: amount })
    }

    return addTripBudgetCategory({
      trip_id: tripId,
      expense_type_id: expenseTypeId,
      planned_amount: amount
    })
  }

  return {
    tripBudgetCategories,
    isSyncing,
    syncError,
    getAllTripBudgetCategories,
    getBudgetCategoriesByTripId,
    getBudgetCategory,
    getPlannedBudgetByTripId,
    loadTripBudgetCategories,
    addTripBudgetCategory,
    updateTripBudgetCategory,
    deleteTripBudgetCategory,
    setBudgetForCategory
  }
})
