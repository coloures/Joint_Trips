import { request } from './apiClient'

export interface DebtDto {
  fromUserId: number
  toUserId: number
  amount: number
}

export const fetchDebtsByTripId = (tripId: number): Promise<DebtDto[]> =>
  request<DebtDto[]>(`/debts/trips/${tripId}`)