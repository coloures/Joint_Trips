export interface ExpenseAllocation {
  id: number
  expense_id: number
  user_id: number
  amount: number
  isPaid? : boolean
}