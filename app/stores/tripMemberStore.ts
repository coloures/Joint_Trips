import { defineStore } from 'pinia'
import { ref } from 'nativescript-vue'
import type { TripMember } from '~/models/trip_member'
import TripMembers from '../seeders/trip_members.json'
import {
  fetchTripMembers,
  fetchTripMembersByTripId,
  createTripMember as createTripMemberApi,
  updateTripMember as updateTripMemberApi,
  deleteTripMember as deleteTripMemberApi
} from '~/services/tripMemberApi'

export const useTripMemberStore = defineStore('tripMember', () => {
  const trip_members = ref<TripMember[]>([])
  const isSyncing = ref(false)
  const syncError = ref<string | null>(null)

  const loadedTrips = new Set<number>()

  async function loadTripMembers({ force = false }: { force?: boolean } = {}) {
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      trip_members.value = await fetchTripMembers()
      console.log("trip members")
      console.log(trip_members.value)
      if (force) loadedTrips.clear()
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load trip members'
      console.warn('[TripMemberStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  async function loadTripMembersByTripId(tripId: number, { force = false }: { force?: boolean } = {}) {
    if (!force && loadedTrips.has(tripId)) return
    if (isSyncing.value) return
    isSyncing.value = true
    syncError.value = null
    try {
      const list = await fetchTripMembersByTripId(tripId)
      trip_members.value = [...trip_members.value.filter(m => m.trip_id !== tripId), ...list]
      loadedTrips.add(tripId)
    } catch (error) {
      syncError.value = error instanceof Error ? error.message : 'Failed to load trip members'
      console.warn('[TripMemberStore] Failed to load from API', error)
    } finally {
      isSyncing.value = false
    }
  }

  function init() {
    trip_members.value = JSON.parse(JSON.stringify(TripMembers))
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

  async function addTripMember(member: Omit<TripMember, 'id'>) {
    const created = await createTripMemberApi(member)
    trip_members.value.push(created)
    loadedTrips.add(created.trip_id)
    return created
  }

  function saveTripMembers(newTripMembers: TripMember[]) {
    trip_members.value = newTripMembers
  }

  async function deleteTripMember(id: number) {
    await deleteTripMemberApi(id)
    trip_members.value = trip_members.value.filter(t => t.id !== id)
  }

  async function updateTripMember(id: number, updates: Partial<TripMember>) {
    const updated = await updateTripMemberApi(id, updates)
    const index = trip_members.value.findIndex(t => t.id === id)
    if (index !== -1) trip_members.value[index] = updated
    loadedTrips.add(updated.trip_id)
    return updated
  }

  return {
    trip_members,
    isSyncing,
    syncError,
    loadTripMembers,
    loadTripMembersByTripId,
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
