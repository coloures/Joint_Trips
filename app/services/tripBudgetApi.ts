import { request } from "./apiClient";
import type { TripBudgetCategory } from '~/models/tripbudgetcategory'

export interface TripBudgetCategoryCreatePayload {
    trip_id: number, 
    expense_type_id: number,
    planned_amount: number
}

export interface TripBudgetCategoryUpdatePayload {
    trip_id: number, 
    expense_type_id: number,
    planned_amount: number
}

export const fetchTripBudgetCategoriesByTripId = (tripId: number) =>
    request<TripBudgetCategory[]>(`/trip-budget-categories/trips/${tripId}`)

export const fetchTripBudgetCategoryByTripId = (id: number) =>
    request<TripBudgetCategory[]>(`/trip-budget-categories/trips/${id}`)

export const fetchTripBudgetCategoryByTripIdAndExpenseType = (id: number, id_of_type: number) =>
    request<TripBudgetCategory>(`/trip-budget-categories/trips/${id}/${id_of_type}`)

export const updateTripBudgetCategory = (payload: TripBudgetCategoryUpdatePayload) =>
    request<TripBudgetCategory>(`/trip-budget-categories/trips/${payload.trip_id}/${payload.expense_type_id}`, {
        method: 'PUT',
        body: JSON.stringify({ planned_amount: payload.planned_amount })
    })

export const createTripBudgetCategory = (payload: TripBudgetCategoryCreatePayload) =>
    request<number>(`/trip-budget-categories`, {method: 'POST', body: JSON.stringify(payload)})

export const patchTripBudgetCategory = (categoryId: number, payload: Partial<TripBudgetCategoryCreatePayload>) =>
    request<TripBudgetCategory>(`/trip-budget-categories/${categoryId}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteTripBudgetCategory = (categoryId: number) =>
    request<TripBudgetCategory>(`/trip-budget-categories/${categoryId}`, { method: 'DELETE' })


