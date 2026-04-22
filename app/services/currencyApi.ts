import { request } from './apiClient'
import type { Currency } from '~/models/currency'

export interface CurrencyCreatePayload {
  code: string
  name: string
  symbol: string
}

export interface CurrencyUpdatePayload {
  code?: string
  name?: string
  symbol?: string
}

export const fetchCurrencies = () => request<Currency[]>('/currencies')

export const fetchCurrencyById = (id: number) => request<Currency>(`/currencies/${id}`)

export const fetchCurrencyByCode = (code: string) => request<Currency>(`/currencies/by-code/${code}`)

export const createCurrency = (payload: CurrencyCreatePayload) =>
  request<number>('/currencies', {
    method: 'POST',
    body: JSON.stringify(payload)
  })

export const updateCurrency = (id: number, payload: CurrencyUpdatePayload) =>
  request<Currency>(`/currencies/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })

export const deleteCurrency = (id: number) =>
  request<Currency>(`/currencies/${id}`, {
    method: 'DELETE'
  })
