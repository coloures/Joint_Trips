<template>
  <GridLayout 
    class="bg-white rounded-2xl p-4"
    horizontalAlignment="stretch"
    verticalAlignment="stretch"
    >
    <StackLayout>
      <Label text="Уведомления" class="text-sm text-gray-500" />
      <Label :text="notificationText" class="text-xl font-bold text-gray-800 mt-1" />
    </StackLayout>
  </GridLayout>
</template>

<script>
export default {
  name: 'NotificationCard',
  props: {
    count: {
      type: Number,
      default: 0
    }
  },
  computed: {
    notificationText() {
      if (this.count === 0) return 'Нет новых'
      if (this.count === 1) return '1 новое'
      if (this.count < 5) return `${this.count} новых`
      return `${this.count} новых`
    }
  },
  methods: {
    onTap() {
      this.$emit('cardNotificationTap', this.count)
    }
  }
}
</script>