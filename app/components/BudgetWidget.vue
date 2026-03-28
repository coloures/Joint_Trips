<script setup lang="ts">
import { computed } from 'nativescript-vue';
import { useTripStore } from '~/stores/tripStore';
import { useExpenseStore } from '~/stores/expenseStore';

const props = defineProps<{ tripId: number }>();

const tripStore = useTripStore();
const expenseStore = useExpenseStore();

const trip = computed(() => tripStore.getTripById(props.tripId));
const totalExpenses = computed(() => expenseStore.getTotalExpensesByTripId(props.tripId));
const remaining = computed(() => (trip.value?.budget || 0) - totalExpenses.value);
</script>