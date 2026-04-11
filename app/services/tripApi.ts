import { request } from './apiClient'
import type { Trip } from '~/models/trip'

export interface TripDto {
  id: number
  emoji: string
  creator_id: number
  title: string
  country: string
  start_date: string
  end_date: string
  currency_id: number
  budget: number
  description?: string
}

export interface TripCreatePayload {
  emoji: string
  creatorId: number
  title: string
  country: string
  startDate: string
  endDate: string
  currencyId: number
  budget: number
  description?: string
}

export interface TripCreateDto {
  emoji: string
  creator_id: number
  title: string
  country: string
  start_date: string
  end_date: string
  currency_id: number
  budget: number
  description?: string
}

export const toTripCreateDto = (input: TripCreatePayload): TripCreateDto => ({
  emoji: input.emoji,
  creator_id: input.creatorId,
  title: input.title,
  country: input.country,
  start_date: input.startDate,
  end_date: input.endDate,
  currency_id: input.currencyId,
  budget: input.budget,
  description: input.description
})

export interface TripUpdatePayload {
  emoji?: string
  title?: string
  country?: string
  startDate?: string
  endDate?: string
  currencyId?: number
  budget?: number
  description?: string
}

export interface TripUpdateDto {
  emoji?: string
  title?: string
  country?: string
  start_date?: string
  end_date?: string
  currency_id?: number
  budget?: number
  description?: string
}

export const toTripUpdateDto = (input: TripUpdatePayload): TripUpdateDto => ({
  emoji: input.emoji,
  title: input.title,
  country: input.country,
  start_date: input.startDate,
  end_date: input.endDate,
  currency_id: input.currencyId,
  budget: input.budget,
  description: input.description
})

export const normalizeTrip = (dto: TripDto): Trip => ({
  ...dto,
  startDate: dto.start_date,
  endDate: dto.end_date
})

export const fetchTrips = () =>
  request<TripDto[]>('/trips').then(list => list.map(normalizeTrip))

export const fetchTripById = (id: number) =>
  request<TripDto>(`/trips/${id}`).then(normalizeTrip)

export const createTrip = (payload: TripCreatePayload) =>
  request<TripDto>('/trips', {
    method: 'POST',
    body: JSON.stringify(toTripCreateDto(payload))
  }).then(normalizeTrip)

export const updateTrip = (id: number, payload: TripUpdatePayload) =>
  request<TripDto>(`/trips/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toTripUpdateDto(payload))
  }).then(normalizeTrip)

export const deleteTrip = (id: number) =>
  request<TripDto>(`/trips/${id}`, {
    method: 'DELETE'
  }).then(normalizeTrip)
