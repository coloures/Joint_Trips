export interface Notification {
  id: number
  trip_id: number
  user_id: number
  type: 'expense_added' | 'budget_changed' | 'reminder' | 'status_changed'
  message: string
  is_read: boolean
  created_at: string
}