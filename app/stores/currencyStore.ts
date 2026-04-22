import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { Currency } from '~/models/currency'
import {
  fetchCurrencies,
  fetchCurrencyById,
  fetchCurrencyByCode,
  createCurrency as createCurrencyApi,
  updateCurrency as updateCurrencyApi,
  deleteCurrency as deleteCurrencyApi,
  type CurrencyCreatePayload,
  type CurrencyUpdatePayload
} from '~/services/currencyApi'

export const useCurrencyStore = defineStore('currency', () => {
  const currencies = ref<Currency[]>([])

  const getAllCurrencies = () => currencies.value

  const getCurrencyById = async (id: number) => {
    return await fetchCurrencyById(id) || null
  }

  const getCurrencyByCode = async (code: string) => {
    return await fetchCurrencyByCode(code) || null
  }


  async function loadCurrencies() {
    console.log('loadCurrencies called')
    const data = await fetchCurrencies()
    console.log('currencies loaded', data)
    currencies.value = data
    return data
  }

  async function createCurrency(payload: CurrencyCreatePayload) {
    const currency = await createCurrencyApi(payload)
    const newCurrency: Currency = {
      ...payload,
      id: currency
    }
    currencies.value.push(newCurrency)
    return currency
  }

  async function updateCurrency(id: number, payload: CurrencyUpdatePayload) {
    const currency = await updateCurrencyApi(id, payload)
    const index = currencies.value.findIndex(t => t.id === id)
    if (index !== -1) {
      currencies.value[index] = currency
    }
    return currency
  }

  async function deleteCurrency(id: number) {
    const currency = await deleteCurrencyApi(id)
    currencies.value = currencies.value.filter(t => t.id !== id)
    return currency
  }

  return {
    currencies,
    loadCurrencies,
    getAllCurrencies,
    getCurrencyById,
    getCurrencyByCode,
    createCurrency,
    deleteCurrency,
    updateCurrency
  }
})