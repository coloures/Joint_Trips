import { request } from './apiClient'
import type { Expense } from '~/models/expense'

export interface ExpenseDto {
  id: number
  trip_id: number
  user_id_pay: number
  amount: number
  date: string
  type_of_expense: number
  currency_id: number
  description?: string
}

export interface ExpenseCreatePayload {
  trip_id: number
  user_id_pay: number
  amount: number
  date: string
  type_of_expense: number
  currency_id: number
  description?: string
}

export interface ExpenseUpdatePayload {
  trip_id?: number
  user_id_pay?: number
  amount?: number
  date?: string
  type_of_expense?: number
  currency_id?: number
  description?: string
}

export const normalizeExpense = (dto: ExpenseDto): Expense => ({
  ...dto,
  description: dto.description ?? ''
})

export const fetchExpenses = () =>
  request<ExpenseDto[]>('/expenses/').then(list => list.map(normalizeExpense))

export const fetchExpenseById = (id: number) =>
  request<ExpenseDto>(`/expenses/${id}`).then(normalizeExpense)

export const fetchExpensesByTripId = (tripId: number) =>
  request<ExpenseDto[]>(`/expenses/trips/${tripId}`).then(list => list.map(normalizeExpense))

export const createExpense = (payload: ExpenseCreatePayload) =>
  request<number>('/expenses/', { method: 'POST', body: JSON.stringify(payload) }).then(fetchExpenseById)

export const updateExpense = (id: number, payload: ExpenseUpdatePayload) =>
  request<ExpenseDto>(`/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }).then(normalizeExpense)

export const deleteExpense = (id: number) =>
  request<ExpenseDto>(`/expenses/${id}`, { method: 'DELETE' }).then(normalizeExpense)
