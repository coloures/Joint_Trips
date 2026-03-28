<template>
  <Page>
    <ActionBar title="✈️ Новая поездка" backgroundColor="#3b82f6" color="white">
      <ActionItem text="✕" android:position="actionBar" @tap="onCancel" />
    </ActionBar>

    <ScrollView>
      <StackLayout class="p-4">
        
        <!-- 🔹 Глобальная ошибка -->
        <Label v-if="snapshot.context.errors?.submit" :text="snapshot.context.errors.submit" class="error global-error" />

        <!-- 🔹 Эмодзи -->
        <StackLayout class="form-group">
          <Label text="Эмодзи" class="label" />
          <StackLayout orientation="horizontal" class="emoji-row">
            <Label 
              v-for="emo in emojiOptions" 
              :key="emo" 
              :text="emo" 
              class="emoji"
              :class="{ active: snapshot.context.emoji === emo }"
              @tap="setField('emoji', emo)"
            />
          </StackLayout>
        </StackLayout>

        <!-- 🔹 Название -->
        <StackLayout class="form-group">
          <Label text="Название *" class="label" />
          <TextField 
            :text="snapshot.context.title"
            hint="Отпуск в Сочи" 
            class="input"
            @textChange="(e: any) => setField('title', e.value)"
          />
          <Label v-if="snapshot.context.errors?.title" :text="snapshot.context.errors.title" class="error" />
        </StackLayout>

        <!-- 🔹 Место -->
        <StackLayout class="form-group">
          <Label text="Куда едем? *" class="label" />
          <TextField 
            :text="snapshot.context.country"
            hint="Россия, Сочи" 
            class="input"
            @textChange="(e: any) => setField('country', e.value)"
          />
          <Label v-if="snapshot.context.errors?.country" :text="snapshot.context.errors.country" class="error" />
        </StackLayout>

        <!-- 🔹 Даты с ручным вводом -->
        <StackLayout class="form-group">
          <Label text="Даты поездки *" class="label" />
          
          <!-- Поле для даты заезда -->
          <StackLayout class="date-field-wrapper">
            <TextField 
              :text="snapshot.context.startDate"
              hint="ГГГГ-ММ-ДД (например: 2024-12-31)" 
              class="input"
              keyboard-type="number"
              @textChange="(e: any) => onDateChange('start', e.value)"
            />
            <Label v-if="snapshot.context.errors?.startDate" :text="snapshot.context.errors.startDate" class="error" />
          </StackLayout>
          
          <!-- Поле для даты выезда -->
          <StackLayout class="date-field-wrapper mt-2">
            <TextField 
              :text="snapshot.context.endDate"
              hint="ГГГГ-ММ-ДД (например: 2025-01-10)" 
              class="input"
              keyboard-type="number"
              @textChange="(e: any) => onDateChange('end', e.value)"
            />
            <Label v-if="snapshot.context.errors?.endDate" :text="snapshot.context.errors.endDate" class="error" />
          </StackLayout>
          
          <Label text="Формат: ГГГГ-ММ-ДД" class="hint" />
        </StackLayout>

        <!-- 🔹 Бюджет -->
        <StackLayout class="form-group">
          <Label text="Бюджет (₽)" class="label" />
          <TextField 
            :text="String(snapshot.context.budget)"
            hint="100000" 
            keyboard-type="number"
            class="input"
            @textChange="(e: any) => setField('budget', Number(e.value) || 0)"
          />
          <Label v-if="snapshot.context.errors?.budget" :text="snapshot.context.errors.budget" class="error" />
        </StackLayout>

        <!-- 🔹 Кнопки -->
        <GridLayout columns="*, *" class="mt-4">
          <Button col="0" text="Сбросить" class="btn-outline" @tap="onReset" />
          <Button 
            col="1" 
            :text="snapshot.context.isSubmitting ? 'Создаём...' : '✅ Создать поездку'" 
            class="btn-primary"
            :enabled="!snapshot.context.isSubmitting"
            @tap="onSubmit" 
          />
        </GridLayout>

      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, $navigateBack } from 'nativescript-vue'
import { createActor } from 'xstate'
import { addTripMachine, validateForm, type AddTripContext } from '~/machines/addTrip.machine'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import * as dialogs from '@nativescript/core/ui/dialogs'

// Сторы
const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()

// 🔹 Реальное сохранение в Pinia
const saveTripToStores = async (ctx: AddTripContext) => {
  console.log('Сохраняем поездку:', ctx)
  
  // 1. Создаём поездку
  const newTrip = {
    emoji: ctx.emoji,
    creator_id: ctx.creatorId,
    title: ctx.title,
    country: ctx.country,
    startDate: ctx.startDate,
    endDate: ctx.endDate,
    currency_id: ctx.currencyId,
    budget: ctx.budget,
    description: ctx.description || ''
  }
  
  tripStore.addTrip(newTrip)
  
  const tripId = tripStore.trips[tripStore.trips.length - 1]?.id
  if (!tripId) throw new Error('Failed to create trip')
  
  // 2. Добавляем создателя как участника
  tripMemberStore.addTripMember({
    trip_id: tripId,
    member_id: ctx.creatorId,
    status: 'confirmed',
    role: 'creator'
  })
  
  return { id: tripId }
}

// 🔹 СОЗДАЁМ АКТОР С РЕАЛЬНЫМИ СЕРВИСАМИ
const actor = createActor(addTripMachine, {
  // @ts-ignore
  implementations: {
    services: {
      saveTrip: saveTripToStores
    }
  }
})

// 🔹 ЗАПУСКАЕМ АКТОР
actor.start()

// 🔹 Состояние и отправка событий
const snapshot = ref(actor.getSnapshot())

// Подписываемся на обновления
const subscription = actor.subscribe((newSnapshot) => {
  snapshot.value = newSnapshot
})

// Функция для отправки событий
const send = (event: any) => {
  actor.send(event)
}

// 🔹 Локальные данные
const emojiOptions = ['🌴', '✈️', '🏔️', '🏖️', '🗼', '🏰', '🚗', '⛺']

// 🔹 Валидация даты
const isValidDate = (dateStr: string): boolean => {
  if (!dateStr) return false
  
  // Проверка формата ГГГГ-ММ-ДД
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false
  
  const date = new Date(dateStr)
  const isValid = !isNaN(date.getTime())
  
  return isValid
}

// 🔹 Обработка изменения даты
const onDateChange = (type: 'start' | 'end', value: string) => {
  setField(type === 'start' ? 'startDate' : 'endDate', value)
  
  // Дополнительная валидация
  const startDate = type === 'start' ? value : snapshot.value.context.startDate
  const endDate = type === 'end' ? value : snapshot.value.context.endDate
  
  if (startDate && endDate && isValidDate(startDate) && isValidDate(endDate)) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (end < start) {
      dialogs.alert({
        title: 'Ошибка',
        message: 'Дата выезда не может быть раньше даты заезда',
        okButtonText: 'OK'
      })
      if (type === 'end') {
        setField('endDate', '')
      }
    }
  }
}

// 🔹 Действия
const setField = (field: string, value: any) => {
  send({ type: 'SET_FIELD', field, value })
}

const onReset = async () => {
  const result = await dialogs.confirm({
    title: 'Сброс формы',
    message: 'Вы уверены, что хотите сбросить все данные?',
    okButtonText: 'Сбросить',
    cancelButtonText: 'Отмена'
  })
  
  if (result) {
    send({ type: 'RESET' })
  }
}

const onCancel = async () => {
  try {
    const result = await dialogs.confirm({
      title: 'Подтверждение',
      message: 'Отменить создание поездки?',
      okButtonText: 'Да',
      cancelButtonText: 'Нет',
      cancelable: true
    })
    
    if (result) {
      send({ type: 'CANCEL' })
      $navigateBack()
    }
  } catch (error) {
    console.log('Диалог закрыт без выбора')
  }
}

const onSubmit = () => {
  const ctx = snapshot.value.context as AddTripContext
  
  // Дополнительная проверка дат перед отправкой
  if (ctx.startDate && !isValidDate(ctx.startDate)) {
    dialogs.alert({
      title: 'Ошибка',
      message: 'Неверный формат даты заезда. Используйте ГГГГ-ММ-ДД',
      okButtonText: 'OK'
    })
    return
  }
  
  if (ctx.endDate && !isValidDate(ctx.endDate)) {
    dialogs.alert({
      title: 'Ошибка',
      message: 'Неверный формат даты выезда. Используйте ГГГГ-ММ-ДД',
      okButtonText: 'OK'
    })
    return
  }
  
  const errors = validateForm(ctx)
  
  if (Object.keys(errors).length > 0) {
    send({ type: 'SET_FIELD', field: 'errors', value: errors })
    return
  }
  
  send({ type: 'SUBMIT' })
}

// 🔹 Инициализация
onMounted(() => {
  // Устанавливаем ID создателя (замени на реальный ID пользователя)
  send({ type: 'SET_CREATOR', creatorId: 2 })
})

onUnmounted(() => {
  // Отписываемся и останавливаем актор
  if (subscription) {
    subscription.unsubscribe()
  }
  actor.stop()
})
</script>

<style scoped>
.form-group { 
  margin-bottom: 16; 
}

.label {
  font-size: 14;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4;
}

.input {
  border-width: 1;
  border-color: #d1d5db;
  border-radius: 8;
  padding: 12 16;
  font-size: 16;
  background-color: white;
}

.error {
  color: #ef4444;
  font-size: 12;
  margin-top: 4;
}

.global-error {
  background-color: #fef2f2;
  padding: 12;
  border-radius: 8;
  margin-bottom: 16;
  text-align: center;
}

.emoji-row {
  flex-direction: row;
  flex-wrap: wrap;
  margin-top: 8;
}

.emoji {
  font-size: 28;
  padding: 8 12;
  margin: 4;
  border-radius: 8;
  background-color: #f3f4f6;
}

.emoji.active {
  background-color: #3b82f6;
}

.date-field-wrapper {
  margin-bottom: 8;
}

.hint {
  font-size: 12;
  color: #6b7280;
  margin-top: 4;
}

.mt-2 {
  margin-top: 8;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 14 24;
  border-radius: 10;
  font-weight: 500;
}

.btn-primary:disabled {
  background-color: #9ca3af;
}

.btn-outline {
  background-color: transparent;
  border-width: 2;
  border-color: #9ca3af;
  color: #6b7280;
  padding: 14 24;
  border-radius: 10;
  margin-right: 8;
}

.btn-outline:active {
  background-color: #f3f4f6;
}

.mt-4 { 
  margin-top: 16; 
}
</style>