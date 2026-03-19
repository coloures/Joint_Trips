export interface Expense {
  id: number
  trip_id: number
  user_id_pay: number
  amount: number
  date: string
  type_of_expense: number,
  description: string,
  currency_id : number
}