import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { Currency } from '~/models/currency'
import Currencies from '../seeders/currencies.json'

export const useCurrencyStore = defineStore('currency', () => {
  const currencies = ref<Currency[]>([])

  function init() {
    currencies.value = JSON.parse(JSON.stringify(Currencies))
    console.log(`[TripStore] Загружено ${currencies.value.length} поездок из тестовых данных`)
  }
  init()

  const getAllCurrencies = () => currencies.value

  const getCurrencyById = (id: number): Currency | null => {
    return currencies.value.find(t => t.id === id) || null
  }

  const getCurrencyByName = (name: string): Currency | null => {
    return currencies.value.find(t => t.name === name) || null
  }

  const getCurrencyByCode = (code: string): Currency | null => {
    return currencies.value.find(t => t.code === code) || null
  }

  const getCurrencyBySymbol = (symbol: string): Currency | null => {
    return currencies.value.find(t => t.symbol === symbol) || null
  }

  function addCurrency(currency: Omit<Currency, 'id'>) {
    const newCurrency: Currency = {
      ...currency,
      id: Math.max(0, ...currencies.value.map(t => t.id)) + 1
    }
    currencies.value.push(newCurrency)
  }

  function saveCurrencies(newCurrencies: Currency[]) {
    currencies.value = newCurrencies
  }

  function deleteCurrency(id: number) {
    currencies.value = currencies.value.filter(t => t.id !== id)
  }

  function updateCurrency(id: number, updates: Partial<Currency>) {
    const index = currencies.value.findIndex(t => t.id === id)
    if (index !== -1) {
      currencies.value[index] = { ...currencies.value[index], ...updates }
    }
  }

  return {
    currencies,
    getAllCurrencies,
    getCurrencyById,
    getCurrencyByName,
    getCurrencyByCode,
    getCurrencyBySymbol,
    addCurrency,
    saveCurrencies,
    deleteCurrency,
    updateCurrency
  }
})