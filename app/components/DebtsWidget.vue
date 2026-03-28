<script setup lang="ts">
import { computed } from 'nativescript-vue';
import { useExpenseStore } from '~/stores/expenseStore';
import { useUserStore } from '~/stores/userStore';

const props = defineProps<{ tripId: number }>();

const expenseStore = useExpenseStore();
const userStore = useUserStore();

const debts = computed(() => expenseStore.calculateDebts(props.tripId));

const getUserName = (id: number) => {
  return userStore.getUserById(id)?.first_name || `User ${id}`;
};
</script>