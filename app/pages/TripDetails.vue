<template>
  <Page>
    <ActionBar class="hidden"/>
    <GridLayout rows="auto, *">
      
      <GridLayout
      columns="auto, *"
      height="30"
      marginTop="24"
      paddingLeft="24"
      paddingRight="24"
      row="0"
      >
        <GridLayout
          col="0"
          width="30"
          height="30"
          @tap="$navigateBack"
        >
        <Image
          src="~/assets/icons/Arrow_left.png"
          width="30"
          height="30"
          stretch="aspectFit"
        />
        </GridLayout>
      </GridLayout>

      <ScrollView row="1">
        <StackLayout class="p-4">

          <StackLayout>
            <Label class="title" text="Поездка в" horizontalAlignment="center"/>
            <Label class="title2" :text="`${trip?.title} ${trip?.emoji}`" horizontalAlignment="center"/>
            <Label class="title3" :text="formattedDates" horizontalAlignment="center" marginTop="16"/>
          </StackLayout>

          <GridLayout class="participants_section" columns="auto, auto" rows="auto">
            <StackLayout col="0" marginTop="4" marginRight="24">
               <Label class="title" text="Участники"/>
               <Label class="title3" :text="`${participantsCount} человек`" marginTop="8" />
            </StackLayout>

            <StackLayout orientation="horizontal" col="1">
              <Image
                v-for="participant in particapantsAvatar"
                :key="participant.memberId"
                :src="participant.avatar"
                class="particapants-image"
                stretch="aspectFill"
              />
            </StackLayout>
          </GridLayout>

          <StackLayout class="expenses_section">
            <Label class="title" text="Расходы"/>
            <Label class="title3" text="Общие расходы на поездку" marginTop="16"/>
            <StackLayout orientation="horizontal" marginTop="8">
              <Label class="title3" :text="`${formatMoney(totalExpenses)} ₽`" color="#313132"/>
              <Label class="title3" :text="` / ${formatMoney(totalBudget)} ₽`"/>
            </StackLayout>

            <StackLayout marginTop="32">
              <GridLayout
                class="category-row"
                v-for="item in categorySpendList"
                :key="item.id"
                columns="auto, *, auto"
                height="45"
              >
                <Label col="0" :text="item.emoji" marginRight="8" />
                <Label col="1" class="title4" :text="item.name" />
                <Label col="2" class="title4" :text="`${formatMoney(item.spent)} ₽`" />
              </GridLayout>
              <GridLayout
                class="category-row"
                columns="auto, *, auto"
                height="45"
                borderBottomWidth="0"
              >
                <Label col="0" text="💼" marginRight="8" />
                <Label col="1" class="title4" text="Не распределено" />
                <Label col="2" class="title4" :text="`${formatMoney(unallocatedFunds)} ₽`" />
              </GridLayout>
            </StackLayout>
          </StackLayout>

          <StackLayout class="btn-hist" marginTop="18" verticalAlignment="middle">
            <label class="title" text="История расходов" horizontalAlignment="center" color="#FFDD2D"/>
          </StackLayout>

          <StackLayout class="btn-exp" marginTop="24" marginBottom="36" verticalAlignment="middle">
            <label class="title" text="Добавить расход" horizontalAlignment="center" color="#313132"/>
          </StackLayout>

        </StackLayout>
      </ScrollView>

    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, $navigateBack, $navigateTo } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useExpenseStore } from '~/stores/expenseStore'
import { useExpenseTypeStore } from '~/stores/expenseTypeStore'
import { useTripBudgetCategoryStore } from '~/stores/tripBudgetCategoryStore'
import { useUserStore } from '~/stores/userStore'
import type { Trip } from '~/models/trip'
import type { ExpenseType } from '~/models/type_of_expense'
import ExpenseCard from '~/components/UI/ExpenseCard.vue'
import AddExpenseDialog from './AddExpenseDialog.vue'
import EditCategoryBudgetDialog from '~/components/EditCategoryBudgetDialog.vue'
import ExpenseDetails from './ExpenseDetails.vue'
import DebtsWidget from '~/components/DebtsWidget.vue'
import { Button, GridLayout, Label, StackLayout, confirm } from '@nativescript/core'

const props = defineProps<{
  tripId: number
}>()

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const expenseStore = useExpenseStore()
const expenseTypeStore = useExpenseTypeStore()
const budgetCategoryStore = useTripBudgetCategoryStore()
const userStore = useUserStore()

const trip = ref<Trip | null>(null)

onMounted(() => {
  trip.value = tripStore.getTripById(props.tripId)
})

const formatMoney = (value: number): string => {
  const safe = Number.isFinite(value) ? value : 0
  return Math.round(safe).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

// Заголовок
const formattedDates = computed(() => {
  if (!trip.value) return ''
  const start = new Date(trip.value.startDate).toLocaleDateString('ru-RU')
  const end = new Date(trip.value.endDate).toLocaleDateString('ru-RU')
  return `${start} — ${end}`
})

// Участники
const participantsCount = computed(() => {
  if (!trip.value) return 0
  return tripMemberStore.getTripMembersByTripId(trip.value.id).length
})

const particapantsIDs = computed(() => {
  if (!trip.value) return []
  return tripMemberStore.getTripMembersByTripId(trip.value.id)
})

const particapantsAvatar = computed(() => {
  return particapantsIDs.value.map(participant => {
    const user = userStore.getUserById(participant.member_id)
    return {
      memberId: participant.member_id,
      avatar: user?.avatar || `https://i.pravatar.cc/150?u=member-${participant.member_id}`
    }
  })
})

// Расходы
const totalBudget = computed(() => trip.value?.budget || 0)
const totalExpenses = computed(() => expenseStore.getTotalExpensesByTripId(props.tripId))
const allCategories = computed(() => expenseTypeStore.getAllExpenseTypes())

const categorySpendList = computed(() => {
  return allCategories.value.map(category => ({
    id: category.id,
    name: category.name,
    emoji: category.icon,
    spent: expenseStore.getTotalByCategory(props.tripId, category.id)
  }))
})

const unallocatedFunds = computed(() => {
  const remaining = Number(totalBudget.value) - totalExpenses.value
  return remaining > 0 ? remaining : 0
})

</script>

<style scoped>

/* Прочее */

.p-4 {
  padding: 0;
}

.hidden {
  height: 0;
  visibility: collapse;
}

/* Текст */

.title {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 20;
  font-weight: bold;
  color: #313132;
}

.title2 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold";
  font-size: 36;
  font-weight: bold;
  color: #313132;
}

.title3 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold", "Inter-Light";
  font-size: 20;
  color: #6F7071;
}

.title4 {
  font-family: "Inter", "Inter-Regular", "Inter-Bold", "Inter-Light";
  font-size: 16;
  color: #313132;
}

/* Секция участники */

.participants_section {
  margin-top: 32;
  padding-bottom: 20;
  padding-top: 20;
  padding-left: 24;
  background-color: white;
  border-radius: 24;
  width: 354;
  height: 130;
}

.particapants-image {
  margin-right: 12;
  width: 90;
  height: 90;
  border-radius: 24;
}

/* Секция расходы */

.expenses_section {
  margin-top: 32;
  padding: 24;
  padding-bottom: 24;
  background-color: white;
  border-radius: 24;
  width: 354;
  height: auto;
}

.category-row {
  padding-left: 12;
  padding-right: 12;
  border-bottom-width: 1;
  border-bottom-color: #D3D3D3;
}

/* Кнопки */

.btn-hist {
  width: 354;
  height: 60;
  border-radius: 14;
  background-color: #FFF7CF;
}

.btn-exp {
  width: 354;
  height: 60;
  border-radius: 14;
  background-color: #FFDD2D;
}

</style>
