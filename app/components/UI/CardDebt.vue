<template>
  <GridLayout 
    class="bg-white rounded-2xl p-4"
    horizontalAlignment="stretch"
    verticalAlignment="stretch"
    @tap="onTap"
    >
    <StackLayout>
      <Label text="Долг" class="text-sm text-gray-500" />
      <Label :text="formattedAmount" class="text-xl font-bold text-gray-800 mt-1" />
    </StackLayout>
  </GridLayout>
</template>

<script>
export default {
  name: 'DebtCard',
  props: {
    amount: {
      type: Number,
      default: 0
    }
  },
  computed: {
    formattedAmount() {
      return `${this.amount.toLocaleString('ru-RU')} ₽`
    }
  },
  methods: {
    onTap() {
      this.$emit('cardDebtTap', this.amount)
    }
  }
}
</script>