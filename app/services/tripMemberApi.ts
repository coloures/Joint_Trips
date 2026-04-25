import { request } from './apiClient'
import type { TripMember } from '~/models/trip_member'

export interface TripMemberCreatePayload {
  trip_id: number
  member_id: number
  status: string
  role: string
}

export interface TripMemberUpdatePayload {
  trip_id?: number
  member_id?: number
  status?: string
  role?: string
}

export const fetchTripMembers = () => request<TripMember[]>('/trip-members/')

export const fetchTripMemberById = (id: number) => request<TripMember>(`/trip-members/${id}`)

export const fetchTripMembersByTripId = (tripId: number) =>
  request<TripMember[]>(`/trip-members/trips/${tripId}`)

export const createTripMember = async (payload: TripMemberCreatePayload) => {
  const id = await request<number>(`/trip-members/trips/${payload.trip_id}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
  return fetchTripMemberById(id)
}

export const updateTripMember = (id: number, payload: TripMemberUpdatePayload) =>
  request<TripMember>(`/trip-members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  })

export const deleteTripMember = (id: number) =>
  request<TripMember>(`/trip-members/${id}`, { method: 'DELETE' })

