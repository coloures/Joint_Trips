import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { TripMember } from '~/models/trip_member'
import TripMembers from '../seeders/trip_members.json'

export const useTripMemberStore = defineStore('tripMember', () => {
  const trip_members = ref<TripMember[]>([])

  function init() {
    trip_members.value = JSON.parse(JSON.stringify(TripMembers))
    console.log(`[TripMemberStore] Загружено ${trip_members.value.length} поездок из тестовых данных`)
  }
  init()

  const getAllTripMembers = () => trip_members.value

  const getTripMemberById = (id: number): TripMember | null => {
    return trip_members.value.find(t => t.id === id) || null
  }

  const getTripMembersByTripId = (trip_id: number): TripMember[] => {
    return trip_members.value.filter(t => t.trip_id === trip_id)
  }

  const getTripMembersByMemberId = (member_id: number): TripMember[] => {
    return trip_members.value.filter(t => t.member_id === member_id)
  }

  function addTripMember(trip: Omit<TripMember, 'id'>) {
    const newTrip: TripMember = {
      ...trip,
      id: Math.max(0, ...trip_members.value.map(t => t.id)) + 1
    }
    trip_members.value.push(newTrip)
  }

  function saveTripMembers(newTripMembers: TripMember[]) {
    trip_members.value = newTripMembers
  }

  function deleteTripMember(id: number) {
    trip_members.value = trip_members.value.filter(t => t.id !== id)
  }

  function updateTripMember(id: number, updates: Partial<TripMember>) {
    const index = trip_members.value.findIndex(t => t.id === id)
    if (index !== -1) {
      trip_members.value[index] = { ...trip_members.value[index], ...updates }
    }
  }

  return {
    trip_members,
    getAllTripMembers,
    getTripMemberById,
    getTripMembersByTripId,
    getTripMembersByMemberId,
    addTripMember,
    saveTripMembers,
    deleteTripMember,
    updateTripMember
  }
})