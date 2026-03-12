<template>
  <GridLayout columns="auto, *" class="bg-white rounded-2xl p-4 mb-3" @tap="onTap">
    <Label col="0" :text="icon" class="text-4xl mr-3" />

    <StackLayout col="1" class="flex-1">
      <Label :text="title" class="text-base font-bold text-gray-800" />
      <Label :text="participantsText" class="text-sm text-gray-500 mt-1" />
      <Label :text="dateText" class="text-sm text-gray-400" />
    </StackLayout>
  </GridLayout>
</template>

<script>
export default {
  name: 'TravelCard',
  props: {
    icon: {
      type: String,
      default: '✈️'
    },
    title: {
      type: String,
      required: true
    },
    participants: {
      type: Number,
      default: 0
    },
    startDate: {
      type: String,
      required: true
    },
    endDate: {
      type: String,
      required: true
    }
  },
  computed: {
    participantsText() {
      if (this.participants === 0) return 'Вы один'
      if (this.participants === 1) return '1 человек участвует'
      if (this.participants < 5) return `${this.participants} человека участвуют`
      return `${this.participants} человек участвуют`
    },
    dateText() {
      const start = new Date(this.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      const end = new Date(this.endDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
      return `${start} — ${end}`
    }
  },
  methods: {
    onTap() {
      this.$emit('tap', this.title)
    }
  }
}
</script>