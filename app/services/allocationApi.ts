import { request } from './apiClient'
import type { ExpenseAllocation } from '~/models/expense_allocation'

export interface ExpenseAllocationDto {
  id: number
  expense_id: number
  user_id: number
  amount: number
  is_paid?: boolean
}

export interface ExpenseAllocationCreatePayload {
    expense_id: number,
    user_id: number,
    amount: number,
    isPaid?: boolean
}

export interface ExpenseAllocationUpdatePayload {
    expense_id?: number,
    user_id?: number,
    amount?: number,
    isPaid?: boolean
}

export const normalizeExpenseAllocation = (dto: ExpenseAllocationDto): ExpenseAllocation => ({
  ...dto,
  isPaid: dto.is_paid
})

const toExpenseAllocationCreateDto = (payload: ExpenseAllocationCreatePayload) => ({
  expense_id: payload.expense_id,
  user_id: payload.user_id,
  amount: payload.amount,
  is_paid: payload.isPaid
})

const toExpenseAllocationUpdateDto = (payload: ExpenseAllocationUpdatePayload) => {
  const dto: Partial<ExpenseAllocationDto> = {}
  if (payload.expense_id !== undefined) dto.expense_id = payload.expense_id
  if (payload.user_id !== undefined) dto.user_id = payload.user_id
  if (payload.amount !== undefined) dto.amount = payload.amount
  if (payload.isPaid !== undefined) dto.is_paid = payload.isPaid
  return dto
}

export const fetchExpenseAllocations = () =>
  request<ExpenseAllocationDto[]>(`/allocations/`).then(list => list.map(normalizeExpenseAllocation))

export const fetchExpenseAllocationById = (id: number) =>
  request<ExpenseAllocationDto>(`/allocations/${id}`).then(normalizeExpenseAllocation)

export const fetchExpenseAllocationsByExpenseId = (expenseId: number) =>
  request<ExpenseAllocationDto[]>(`/allocations/expenses/${expenseId}`).then(list =>
    list.map(normalizeExpenseAllocation)
  )

export const fetchExpenseAllocationsByUserId = (userId: number) =>
  request<ExpenseAllocationDto[]>(`/allocations/users/${userId}`).then(list => list.map(normalizeExpenseAllocation))

export const createAllocation = (payload: ExpenseAllocationCreatePayload) =>
  request<number>(`/allocations/`, { method: 'POST', body: JSON.stringify(toExpenseAllocationCreateDto(payload)) })
    .then(fetchExpenseAllocationById)

export const updateAllocation = (id: number, payload: ExpenseAllocationUpdatePayload) =>
  request<ExpenseAllocationDto>(`/allocations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toExpenseAllocationUpdateDto(payload))
  }).then(normalizeExpenseAllocation)

export const deleteAllocation = (id: number) =>
  request<ExpenseAllocationDto>(`/allocations/${id}`, { method: 'DELETE' }).then(normalizeExpenseAllocation)


