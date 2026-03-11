<template>
  <Page>
    <ScrollView>
      <StackLayout class="p-4">
        <CardTrip 
        v-for="(item, index) in items" 
        :key="index" 
        :icon="item.icon" 
        :title="item.title" 
        :participants="item.participants" 
        :startDate="item.startDate" 
        :endDate="item.endDate" 
        @tap="onCardTrip"
        />
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script>
import items from '../seeders/items.json'
import CardTrip from '../components/UI/CardTrip.vue'
import { ScrollView } from '@nativescript/core';

export default {
  name: 'Home',
  components: {
    CardTrip
  },
  data() {
    return {
      items
    }
  },
  methods: {
    onCardTrip(title) {
      console.log('Нажата карточка', title)
    }
  }
}
</script>