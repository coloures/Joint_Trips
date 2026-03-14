export interface Trip {
  emoji: string
  id: number
  creator_id: number
  title: string
  country: string
  startDate: string
  endDate: string
  currency_id: number
  budget: number
  description?: string
}