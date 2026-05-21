import { request } from './apiClient'
import type { ExpenseType } from '~/models/type_of_expense'

export interface ExpenseTypeCreatePayload {
  name: string
  icon?: string
  color?: string
}

export interface ExpenseTypeUpdatePayload {
  name?: string
  icon?: string
  color?: string
}

export const fetchExpenseTypes = () => request<ExpenseType[]>('/expense-types/')

export const fetchExpenseTypeById = (id: number) => request<ExpenseType>(`/expense-types/${id}`)

export const createExpenseType = async (payload: ExpenseTypeCreatePayload) => {
  const id = await request<number>('/expense-types/', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return fetchExpenseTypeById(id)
}

export const updateExpenseType = (id: number, payload: ExpenseTypeUpdatePayload) =>
  request<ExpenseType>(`/expense-types/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })

export const deleteExpenseType = (id: number) =>
  request<ExpenseType>(`/expense-types/${id}`, { method: 'DELETE' })

