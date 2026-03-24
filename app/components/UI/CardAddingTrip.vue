<template>
  <GridLayout columns="*" class="bg-white rounded-2xl p-4 mb-3" @tap="onTap">
    <Label col="0" :text="icon" class="text-4xl mr-3 text-center" />
  </GridLayout>
</template>

<script>
export default {
  name: 'TravelCard',
  props: {
    icon: {
      type: String,
      default: '+'
    }
  },
  methods: {
    onTap() {
      this.$emit('addNewTrip')
    }
  }
}
</script>