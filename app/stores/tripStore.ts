import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { Trip } from '~/models/trip'
import Trips from '../seeders/trips.json'

export const useTripStore = defineStore('trip', () => {
  const trips = ref<Trip[]>([])

  function init() {
    trips.value = JSON.parse(JSON.stringify(Trips))
    console.log(`[TripStore] Загружено ${trips.value.length} поездок из тестовых данных`)
  }
  init()

  const getAllTrips = () => trips.value

  const getTripById = (id: number): Trip | null => {
    return trips.value.find(t => t.id === id) || null
  }

  function addTrip(trip: Omit<Trip, 'id'>) {
    const newTrip: Trip = {
      ...trip,
      id: Math.max(0, ...trips.value.map(t => t.id)) + 1
    }
    trips.value.push(newTrip)
  }

  function saveTrips(newTrips: Trip[]) {
    trips.value = newTrips
  }

  function deleteTrip(id: number) {
    trips.value = trips.value.filter(t => t.id !== id)
  }

  function updateTrip(id: number, updates: Partial<Trip>) {
    const index = trips.value.findIndex(t => t.id === id)
    if (index !== -1) {
      trips.value[index] = { ...trips.value[index], ...updates }
    }
  }

  return {
    trips,
    getAllTrips,
    getTripById,
    addTrip,
    saveTrips,
    deleteTrip,
    updateTrip
  }
})