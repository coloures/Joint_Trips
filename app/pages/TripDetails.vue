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

          <GridLayout class="participants_section"columns="auto, auto, auto" rows="auto">
            <StackLayout orientation="vertical" col="0" marginTop="4">
               <Label class="title" text="Участники"/>
               <Label class="title3" :text="`${participantsCount} человек`" marginTop="8" />
            </StackLayout>
          </GridLayout>

          <StackLayout class="expenses_section">
            <Label class="title" text="Расходы"/>
            <Label class="title3" text="Общий бюджет на поездку" marginTop="8"/>
            <Label class="title3" :text="`${totalBudget} ₽`"/>

            

            <!-- Бюджет по категориям -->
            <StackLayout class="categories-budget">
              <Label text="📊 Бюджет по категориям" class="categories-title" />

              <StackLayout
                v-for="category in categoriesWithBudget"
                :key="category.id"
                class="category-budget-item"
                @tap="editCategoryBudget(category)"
              >
                <GridLayout columns="auto, *, auto">
                  <Label :text="getCategoryEmoji(category.name)" col="0" class="category-emoji" />
                  <Label :text="category.name" col="1" class="category-name" />
                  <Label
                    :text="categoryBudgetMap[category.id] ? `${categoryBudgetMap[category.id].toLocaleString('ru-RU')} ₽` : 'Не указан'"
                    col="2"
                    class="category-amount"
                    :class="{ 'no-budget': !categoryBudgetMap[category.id] }"
                  />
                </GridLayout>
                <Progress
                  v-if="categoryBudgetMap[category.id] && categorySpentMap[category.id]"
                  :value="getCategoryPercentage(category.id)"
                  :maxValue="100"
                  class="category-progress"
                />
                <Label
                  v-if="categoryBudgetMap[category.id] && categorySpentMap[category.id]"
                  :text="`Потрачено: ${categorySpentMap[category.id].toLocaleString('ru-RU')} ₽`"
                  class="category-spent"
                />
              </StackLayout>
            </StackLayout>
          </StackLayout>

          <StackLayout class="separator" />

          <StackLayout class="expenses-section">
            <StackLayout class="section-header">
              <Label text="📝 Последние расходы" class="section-title" />
              <Button text="+ Добавить" class="add-expense-btn" @tap="showAddExpense" />
            </StackLayout>

            <StackLayout v-if="recentExpenses.length > 0" class="expenses-list">
              <ExpenseCard
                v-for="expense in recentExpenses"
                :key="expense.id"
                :expense="expense"
                :currentUserId="currentUserId ?? undefined"
                @tap="openExpenseDetails"
              />
            </StackLayout>

            <StackLayout v-else class="empty-expenses">
              <Label text="💰" class="empty-icon" />
              <Label text="Нет расходов" class="empty-text" />
              <Button text="+ Добавить первый расход" class="btn-add" @tap="showAddExpense" />
            </StackLayout>
          </StackLayout>

          <StackLayout class="separator" />

          <GridLayout columns="*, *" class="actions" rows="auto">
            <Button col="0" text="✏️ Редактировать" class="btn-primary" @tap="onEdit" />
            <Button col="1" text="🗑️ Удалить" class="btn-outline" @tap="onDelete" />
          </GridLayout>

          <StackLayout height="30" />
        </StackLayout>
      </ScrollView>

    </GridLayout>



    <!-- Диалог редактирования бюджета категории -->
    <EditCategoryBudgetDialog
      v-if="showBudgetDialog"
      :tripId="tripId"
      :category="selectedCategory"
      :currentBudget="selectedCategoryBudget"
      @close="showBudgetDialog = false"
      @saved="onBudgetSaved"
    />
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
import { GridLayout, Label, StackLayout, confirm } from '@nativescript/core'

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
const showBudgetDialog = ref(false)
const selectedCategory = ref<ExpenseType | null>(null)
const selectedCategoryBudget = ref(0)
const currentUserId = computed(() => userStore.currentUserId)

onMounted(() => {
  trip.value = tripStore.getTripById(props.tripId)
})

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

// Расходы
const totalBudget = computed(() => trip.value?.budget || 0)


// Категории
const allCategories = computed(() => expenseTypeStore.getAllExpenseTypes())

// Бюджеты по категориям
const categoryBudgetMap = computed(() => {
  const map: Record<number, number> = {}
  allCategories.value.forEach(cat => {
    const budget = budgetCategoryStore.getBudgetCategory(props.tripId, cat.id)
    if (budget) {
      map[cat.id] = budget.planned_amount
    }
  })
  return map
})

// Расходы по категориям
const categorySpentMap = computed(() => {
  const map: Record<number, number> = {}
  allCategories.value.forEach(cat => {
    const spent = expenseStore.getTotalByCategory(props.tripId, cat.id)
    if (spent > 0) {
      map[cat.id] = spent
    }
  })
  return map
})

// Категории с указанным бюджетом
const categoriesWithBudget = computed(() => {
  return allCategories.value.filter(cat => categoryBudgetMap.value[cat.id])
})

const getCategoryEmoji = (categoryName: string): string => {
  const emojis: Record<string, string> = {
    'Билеты': '✈️',
    'Отели': '🏨',
    'Питание': '🍜',
    'Развлечения': '🎉',
    'Страховка': '🛡️',
    'Другое': '📝'
  }
  return emojis[categoryName] || '💰'
}

const getCategoryPercentage = (categoryId: number) => {
  const budget = categoryBudgetMap.value[categoryId] || 0
  const spent = categorySpentMap.value[categoryId] || 0
  if (budget === 0) return 0
  return (spent / budget) * 100
}

const editCategoryBudget = (category: ExpenseType) => {
  selectedCategory.value = category
  selectedCategoryBudget.value = categoryBudgetMap.value[category.id] || 0
  showBudgetDialog.value = true
}

const showEditBudgetDialog = () => {
  // TODO: показать диалог для редактирования общего бюджета
  console.log('Редактировать общий бюджет')
}

const onBudgetSaved = () => {
  showBudgetDialog.value = false
  // Данные обновятся автоматически через computed
}

// Расходы (последние 5)
const recentExpenses = computed(() => {
  const allExpenses = expenseStore.getExpensesByTripId(props.tripId)
  return [...allExpenses].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  ).slice(0, 5)
})

// Действия
const onEdit = () => {
  console.log('Редактировать:', trip.value?.id)
}

const onDelete = async () => {
  if (trip.value) {
    // Ждем, пока пользователь нажмет "ОК" или "Отмена"
    const result = await confirm({
      title: "Удаление поездки",
      message: "Вы уверены, что хотите удалить эту поездку? Это действие нельзя отменить.",
      okButtonText: "Удалить",
      cancelButtonText: "Отмена"
    });

    // Если пользователь нажал "Удалить" (result === true)
    if (result) {
      tripStore.deleteTrip(trip.value.id);
      $navigateBack();
    }
  }
}

const showAddExpense = () => {
  $navigateTo(AddExpenseDialog, {
    props: {
      tripId: props.tripId
    }
  })
}

const openExpenseDetails = (expenseId: number) => {
  $navigateTo(ExpenseDetails, {
    props: {
      expenseId: expenseId,
      tripId: props.tripId
    }
  })
}

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

/* Секция расходы */

.expenses_section {
  margin-top: 32;
  padding: 24;
  background-color: white;
  border-radius: 24;
  width: 354;
  height: 650;
}




.budget-header {
  margin-bottom: 16;
  align-items: center;
  flex-direction: row;
  justify-content: space-between;
}

.edit-budget-btn {
  background-color: transparent;
  color: #3b82f6;
  font-size: 12;
  padding: 6 12;
  border-width: 0;
  border-radius: 16;
  height: 32;
}

.section-title {
  font-size: 16;
  font-weight: 600;
  color: #1f2937;
}


/* Бюджет по категориям */
.categories-budget {
  margin-top: 20;
  padding-top: 16;
  border-top-width: 1;
  border-top-color: #e5e7eb;
}

.categories-title {
  font-size: 14;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12;
}

.category-budget-item {
  padding: 12;
  background-color: #f9fafb;
  border-radius: 12;
  margin-bottom: 8;
}

.category-emoji {
  font-size: 18;
  margin-right: 12;
  width: 32;
}

.category-name {
  font-size: 14;
  font-weight: 500;
  color: #374151;
}

.category-amount {
  font-size: 14;
  font-weight: 600;
  color: #3b82f6;
}

.category-amount.no-budget {
  color: #9ca3af;
  font-weight: normal;
}

.category-progress {
  margin-top: 8;
  height: 4;
  border-radius: 2;
  background-color: #e5e7eb;
}

.category-spent {
  font-size: 10;
  color: #6b7280;
  margin-top: 4;
}

/* Расходы */
.expenses-section {
  margin-bottom: 16;
}

.section-header {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16;
  padding-bottom: 8;
  border-bottom-width: 1;
  border-bottom-color: #e5e7eb;
}

.add-expense-btn {
  background-color: #3b82f6;
  color: white;
  font-size: 12;
  padding: 6 12;
  border-radius: 20;
  border-width: 0;
  height: 32;
}

.expenses-list {
  margin-top: 8;
}

/* Карточки расходов */
.expenses-list > * {
  margin-bottom: 12;
}

.empty-expenses {
  align-items: center;
  padding: 40;
  background-color: #f9fafb;
  border-radius: 12;
  margin-top: 8;
}

.empty-icon {
  font-size: 48;
  margin-bottom: 12;
}

.empty-text {
  font-size: 14;
  color: #9ca3af;
  margin-bottom: 12;
  text-align: center;
}

.btn-add {
  background-color: #3b82f6;
  color: white;
  padding: 10 20;
  border-radius: 8;
  font-size: 14;
}

/* Кнопки действий */
.actions {
  margin-top: 16;
  margin-bottom: 16;
  gap: 12;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 12 20;
  border-radius: 10;
  font-size: 14;
  font-weight: 500;
}

.btn-outline {
  background-color: transparent;
  border-width: 1;
  border-color: #ef4444;
  color: #ef4444;
  padding: 12 20;
  border-radius: 10;
  font-size: 14;
  font-weight: 500;
}
</style>

