<template>
  <GridLayout 
    class="bg-white rounded-2xl p-4"
    horizontalAlignment="stretch"
    verticalAlignment="stretch"
    >
    <StackLayout>
      <Label :text="`${name}`" class="text-sm text-gray-500" />
      <Label :text="formattedAmount" class="text-xl font-bold text-gray-800 mt-1" />
    </StackLayout>
  </GridLayout>
</template>

<script>
export default {
  name: 'CardDebtToPerson',
  props: {
    name: {
        type: String,
        default: "Ноунейм какой-то"
    },
    amount: {
      type: Number,
      default: 0
    },
    currencySymbol: {
      type: String,
      default: '₽'
    }
  },
  computed: {
    formattedAmount() {
      return `${this.amount.toLocaleString('ru-RU')} ${this.currencySymbol}`
    }
  }
}
</script>
