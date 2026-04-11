import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { Trip } from '~/models/trip'
import {
  fetchTrips,
  fetchTripById,
  createTrip as createTripApi,
  updateTrip as updateTripApi,
  deleteTrip as deleteTripApi,
  type TripCreatePayload,
  type TripUpdatePayload
} from '~/services/tripApi'

export const useTripStore = defineStore('trip', () => {
  const trips = ref<Trip[]>([])

  const getAllTrips = () => trips.value

  const getTripById = (id: number): Trip | null => {
    return trips.value.find(t => t.id === id) || null
  }

  const loadTrips = async () => {
    console.log('loadTrips called')
    const data = await fetchTrips()
    console.log('trips loaded', data)
    trips.value = data
    return data
  }

  const loadTripById = async (id: number) => {
    const trip = await fetchTripById(id)
    const index = trips.value.findIndex(t => t.id === trip.id)
    if (index === -1) {
      trips.value.push(trip)
    } else {
      trips.value[index] = trip
    }
    return trip
  }

  const createTrip = async (payload: TripCreatePayload) => {
    const trip = await createTripApi(payload)
    trips.value.push(trip)
    return trip
  }

  const updateTrip = async (id: number, payload: TripUpdatePayload) => {
    const trip = await updateTripApi(id, payload)
    const index = trips.value.findIndex(t => t.id === id)
    if (index === -1) {
      trips.value.push(trip)
    } else {
      trips.value[index] = trip
    }
    return trip
  }

  const deleteTrip = async (id: number) => {
    const trip = await deleteTripApi(id)
    trips.value = trips.value.filter(t => t.id !== id)
    return trip
  }

  return {
    trips,
    getAllTrips,
    getTripById,
    loadTrips,
    loadTripById,
    createTrip,
    updateTrip,
    deleteTrip
  }
})
