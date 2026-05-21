import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { ExpenseType } from '~/models/type_of_expense'
import ExpenseTypes from '../seeders/expense_types.json'
import {
  fetchExpenseTypes,
  createExpenseType as createExpenseTypeApi,
  updateExpenseType as updateExpenseTypeApi,
  deleteExpenseType as deleteExpenseTypeApi
} from '~/services/expenseTypeApi'

export const useExpenseTypeStore = defineStore('expenseType', () => {
  const expenseTypes = ref<ExpenseType[]>([])
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  async function loadExpenseTypes() {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      expenseTypes.value = await fetchExpenseTypes()
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load expense types'
      console.warn('[ExpenseTypeStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  function init() {
    expenseTypes.value = JSON.parse(JSON.stringify(ExpenseTypes))
  }
  init()

  const getAllExpenseTypes = () => expenseTypes.value

  const getExpenseTypeById = (id: number): ExpenseType | null => {
    return expenseTypes.value.find(et => et.id === id) || null
  }

  const getExpenseTypeByName = (name: string): ExpenseType | null => {
    return expenseTypes.value.find(et => et.name.toLowerCase() === name.toLowerCase()) || null
  }

  async function addExpenseType(expenseType: Omit<ExpenseType, 'id'>) {
    const created = await createExpenseTypeApi(expenseType)
    expenseTypes.value.push(created)
    return created
  }

  async function updateExpenseType(id: number, updates: Partial<ExpenseType>) {
    const updated = await updateExpenseTypeApi(id, updates)
    const index = expenseTypes.value.findIndex(et => et.id === id)
    if (index !== -1) expenseTypes.value[index] = updated
    return updated
  }

  async function deleteExpenseType(id: number) {
    await deleteExpenseTypeApi(id)
    expenseTypes.value = expenseTypes.value.filter(et => et.id !== id)
  }

  return {
    expenseTypes,
    isSyncing,
    syncError,
    loadExpenseTypes,
    getAllExpenseTypes,
    getExpenseTypeById,
    getExpenseTypeByName,
    addExpenseType,
    updateExpenseType,
    deleteExpenseType
  }
})
