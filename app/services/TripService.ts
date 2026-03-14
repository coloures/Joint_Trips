import type { Trip } from '~/models/trip'
import type { Expense } from '~/models/expense'
import Trips from '../seeders/trips.json'

let trips: Trip[] = []

function init() {
  trips = JSON.parse(JSON.stringify(Trips))
  console.log(`[TripService] Загружено ${trips.length} поездок из сидов`)
}

init()

export const tripService = {
  
  getAllTrips(): Trip[] {
    return trips
  },

  saveTrips(newTrips: Trip[]): void {
    trips = newTrips
  },

  addTrip(trip: Omit<Trip, 'id'>): void {
    const newTrip: Trip = {
      ...trip,
      id: trips.length + 1
    }
    trips.push(newTrip)
  },

  getTripById(id: number): Trip | null {
    return trips.find(t => t.id === id) || null
  },

  deleteTrip(id: number): void {
    trips = trips.filter(t => t.id !== id)
  }
}