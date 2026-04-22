import { request } from './apiClient'
import type { User } from '~/models/user'

export interface UserDto {
  id: number
  first_name: string
  last_name: string
  phone_number: string
  avatar?: string
}

export type AvatarDto = string | null

export interface UserCreatePayload {
  firstName: string
  lastName: string
  phoneNumber: string
  avatar?: string
}

export interface UserUpdatePayload {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  avatar?: string
}

interface UserCreateDto {
  first_name: string
  last_name: string
  phone_number: string
  avatar?: string
}

interface UserUpdateDto {
  first_name?: string
  last_name?: string
  phone_number?: string
  avatar?: string
}

export const normalizeUser = (dto: UserDto): User => ({
  ...dto
})

const toUserCreateDto = (payload: UserCreatePayload): UserCreateDto => ({
  first_name: payload.firstName,
  last_name: payload.lastName,
  phone_number: payload.phoneNumber,
  avatar: payload.avatar
})

const toUserUpdateDto = (payload: UserUpdatePayload): UserUpdateDto => {
  const dto: UserUpdateDto = {}
  if (payload.firstName !== undefined) dto.first_name = payload.firstName
  if (payload.lastName !== undefined) dto.last_name = payload.lastName
  if (payload.phoneNumber !== undefined) dto.phone_number = payload.phoneNumber
  if (payload.avatar !== undefined) dto.avatar = payload.avatar
  return dto
}

const buildQueryString = (params: Record<string, string | number | undefined>) => {
  const entries = Object.entries(params).filter(([, value]) => value !== undefined)
  if (!entries.length) return ''
  return `?${entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')}`
}

export const fetchUsers = () =>
  request<UserDto[]>('/users').then(list => list.map(normalizeUser))

export const fetchUserById = (id: number) =>
  request<UserDto>(`/users/${id}`).then(normalizeUser)

export const fetchUserbyPhoneNumber = (phoneNumber: string) =>
  request<UserDto>(`/users/phone/${phoneNumber}`).then(normalizeUser)

export const fetchUsersByIds = (ids: number[]) =>
  Promise.all(ids.map(id => fetchUserById(id)))

export const createUser = async (payload: UserCreatePayload) => {
  const userId = await request<number>('/users', {
    method: 'POST',
    body: JSON.stringify(toUserCreateDto(payload))
  })
  return fetchUserById(userId)
}

export const updateUser = (id: number, payload: UserUpdatePayload) =>
  request<UserDto>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(toUserUpdateDto(payload))
  }).then(normalizeUser)

export const deleteUser = (id: number) =>
  request<UserDto>(`/users/${id}`, {
    method: 'DELETE'
  }).then(normalizeUser)

export const loginUser = (phoneNumber: string, firstName: string, lastName: string) =>
  request<UserDto>(
    `/users/login${buildQueryString({ phone_number: phoneNumber, first_name: firstName, last_name: lastName })}`,
    { method: 'POST' }
  ).then(normalizeUser)

export const lookupUser = (phoneNumber: string) =>
  request<UserDto>(`/users/lookup${buildQueryString({ phone: phoneNumber })}`).then(normalizeUser)

export const fetchCurrentUser = (userId?: number) =>
  request<UserDto>(`/users/current${buildQueryString({ user_id: userId })}`).then(normalizeUser)

export const getAvatarUser = (userId: number) =>
  request<AvatarDto>(`/users/avatar${buildQueryString({ user_id: userId })}`)

// Uploads an image for the user and then returns the updated avatar URL.
export const postAvatarUser = async (userId: number, file: Blob, filename = 'avatar.jpg') => {
  const form = new FormData()
  // FormData typing is DOM-centric; NativeScript fetch supports Blob/FormData at runtime.
  ;(form as any).append('file', file, filename)

  await request<unknown>(`/avatars/upload/${userId}`, {
    method: 'POST',
    body: form
  })

  return getAvatarUser(userId)
}

