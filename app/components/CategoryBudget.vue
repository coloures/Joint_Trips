<script setup lang="ts">
import { computed } from 'nativescript-vue';
import { useExpenseStore } from '~/stores/expenseStore';
import { useTripBudgetCategoryStore } from '~/stores/tripBudgetCategoryStore';

const props = defineProps<{ 
  tripId: number;
  categoryId: number;
}>();

const expenseStore = useExpenseStore();
const budgetStore = useTripBudgetCategoryStore();

const spent = computed(() => expenseStore.getTotalByCategory(props.tripId, props.categoryId));
const planned = computed(() => {
  const cat = budgetStore.getBudgetCategory(props.tripId, props.categoryId);
  return cat?.planned_amount || 0;
});
const remaining = computed(() => planned.value - spent.value);
</script>