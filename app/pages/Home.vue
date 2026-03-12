<template>
  <Page>
    <ScrollView>
      <StackLayout class="w-full p-4">
        <GridLayout columns="*, *" class="w-full mb-4">
          <CardDebt col="0" :amount="debtAmount" class="mr-2" @tap="onCardDept"/>
          <CardNotification col="1" :count="notificationCount" class="ml-2" @tap="onCardNotification"/>
        </GridLayout>

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
import CardDebt from '../components/UI/CardDebt.vue'
import CardNotification from '~/components/UI/CardNotification.vue';

export default {
  name: 'Home',
  components: {
    CardTrip,
    CardDebt,
    CardNotification
  },
  data() {
    return {
      items,
      debtAmount: 12000,
      notificationCount: 3
    }
  },
  methods: {
    onCardTrip(title) {
      console.log('Нажата карточка', title)
    },
    onCardDept(dept) {
      console.log('У вас долг: ', dept, ' рублей.')
    },
    onCardNotification(notificationCount) {
      console.log('Количество уведомлений: ', notificationCount)
    }
  }
}
</script>