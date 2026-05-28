<template>
  <Page>
    <ActionBar title="✈️ Новая поездка" backgroundColor="#3b82f6" color="white">
      <ActionItem text="✕" android:position="actionBar" @tap="onCancel" />
    </ActionBar>

    <ScrollView>
      <StackLayout class="p-4">
        <Label v-if="globalError" :text="globalError" class="error global-error" />

        <StackLayout class="form-group">
          <Label text="Эмодзи" class="label" />
          <StackLayout orientation="horizontal" class="emoji-row">
            <Label
              v-for="emo in emojiOptions"
              :key="emo"
              :text="emo"
              class="emoji"
              :class="{ active: formData.emoji === emo }"
              @tap="formData.emoji = emo"
            />
          </StackLayout>
        </StackLayout>

        <StackLayout class="form-group">
          <Label text="Название *" class="label" />
          <TextField v-model="formData.title" hint="Отпуск в Сочи" class="input" />
          <Label v-if="errors.title" :text="errors.title" class="error" />
        </StackLayout>

        <StackLayout class="form-group">
          <Label text="Куда едем? *" class="label" />
          <TextField v-model="formData.country" hint="Россия, Сочи" class="input" />
          <Label v-if="errors.country" :text="errors.country" class="error" />
        </StackLayout>

        <StackLayout class="form-group">
          <Label text="Даты поездки *" class="label" />
          <TextField v-model="formData.startDate" hint="ГГГГ-ММ-ДД (заезд)" class="input" />
          <TextField v-model="formData.endDate" hint="ГГГГ-ММ-ДД (выезд)" class="input mt-2" />
          <Label v-if="errors.startDate" :text="errors.startDate" class="error" />
          <Label v-if="errors.endDate" :text="errors.endDate" class="error" />
          <Label text="Формат: ГГГГ-ММ-ДД" class="hint" />
        </StackLayout>

        <StackLayout class="form-group">
          <Label text="Валюта" class="label" />
          <DropDown
            :items="currencyItems"
            :selectedIndex="selectedCurrencyIndex"
            @selectedIndexChanged="onCurrencyChange"
            class="input"
          />
        </StackLayout>

        <StackLayout class="form-group">
          <Label :text="`Бюджет (${currencySymbol})`" class="label" />
          <TextField v-model="formData.budget" hint="100000" keyboard-type="number" class="input" />
          <Label v-if="errors.budget" :text="errors.budget" class="error" />
        </StackLayout>

        <StackLayout class="form-group">
          <Label text="Участники по номеру телефона" class="label" />
          <TextField
            v-model="participantPhone"
            hint="+79161234567"
            keyboard-type="phone"
            class="input"
          />
          <Button
            text="Добавить участника"
            class="btn-outline add-participant-btn"
            :isEnabled="!isLookingUpParticipant"
            @tap="addParticipantByPhone"
          />
          <Label v-if="participantError" :text="participantError" class="error" />
          <Label text="Добавленные участники получат приглашение и смогут подтвердить участие." class="hint" />

          <StackLayout v-if="invitedParticipants.length" class="participants-list">
            <GridLayout
              v-for="participant in invitedParticipants"
              :key="participant.id"
              columns="*, auto"
              class="participant-item"
            >
              <StackLayout col="0">
                <Label :text="participant.fullName" class="participant-name" />
                <Label :text="participant.phone_number" class="participant-phone" />
              </StackLayout>
              <Button col="1" text="Удалить" class="remove-btn" @tap="removeParticipant(participant.id)" />
            </GridLayout>
          </StackLayout>
        </StackLayout>

        <GridLayout columns="*, *" class="mt-4">
          <Button col="0" text="Сбросить" class="btn-outline" @tap="onReset" />
          <Button
            col="1"
            :text="isSubmitting ? 'Создаём...' : '✅ Создать поездку'"
            class="btn-primary"
            :enabled="!isSubmitting"
            @tap="onSubmit"
          />
        </GridLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { ref, computed, watch, $navigateBack } from 'nativescript-vue'
import { useTripStore } from '~/stores/tripStore'
import { useTripMemberStore } from '~/stores/tripMemberStore'
import { useCurrencyStore } from '~/stores/currencyStore'
import { useUserStore } from '~/stores/userStore'
import { useNotificationStore } from '~/stores/notificationStore'
import { fetchUserbyPhoneNumber } from '~/services/userApi'
import * as dialogs from '@nativescript/core/ui/dialogs'
import type { SelectedIndexChangedEventData } from 'nativescript-drop-down'

interface InvitedParticipant {
  id: number
  first_name: string
  last_name: string
  phone_number: string
  fullName: string
}

const tripStore = useTripStore()
const tripMemberStore = useTripMemberStore()
const currencyStore = useCurrencyStore()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

const selectedCurrencyId = ref<number | null>(null)
const participantPhone = ref('')
const participantError = ref('')
const isLookingUpParticipant = ref(false)
const invitedParticipants = ref<InvitedParticipant[]>([])

watch(
  () => currencyStore.currencies,
  (list) => {
    if (!selectedCurrencyId.value && list.length) {
      selectedCurrencyId.value = list[0].id
    }
  },
  { immediate: true }
)

const currencyItems = computed(() => currencyStore.currencies.map(c => `${c.code} (${c.symbol})`))

const selectedCurrencyIndex = computed(() => {
  if (!selectedCurrencyId.value) return 0
  const index = currencyStore.currencies.findIndex(c => c.id === selectedCurrencyId.value)
  return index >= 0 ? index : 0
})

const onCurrencyChange = (args: SelectedIndexChangedEventData) => {
  const currency = currencyStore.currencies[args.newIndex]
  if (currency) selectedCurrencyId.value = currency.id
}

const currencySymbol = computed(() => {
  const currencyId = selectedCurrencyId.value
  if (!currencyId) return '₽'
  return currencyStore.currencies.find(c => c.id === currencyId)?.symbol || '₽'
})

const formData = ref({
  title: '',
  emoji: '🌴',
  country: '',
  startDate: '',
  endDate: '',
  budget: 0
})

const errors = ref({
  title: '',
  country: '',
  startDate: '',
  endDate: '',
  budget: ''
})

const isSubmitting = ref(false)
const globalError = ref('')
const emojiOptions = ['🌴', '✈️', '🏔️', '🏖️', '🗼', '🏰', '🚗', '⛺']

const normalizePhone = (value: string) => value.replace(/\s+/g, '').trim()

const addParticipantByPhone = async () => {
  participantError.value = ''
  const phone = normalizePhone(participantPhone.value)

  if (!phone) {
    participantError.value = 'Введите номер телефона'
    return
  }

  if (phone === normalizePhone(userStore.currentUser?.phone_number || '')) {
    participantError.value = 'Создатель уже участвует в поездке'
    return
  }

  if (invitedParticipants.value.some(user => normalizePhone(user.phone_number) === phone)) {
    participantError.value = 'Этот участник уже добавлен'
    return
  }

  isLookingUpParticipant.value = true
  try {
    const user = await fetchUserbyPhoneNumber(phone)
    invitedParticipants.value.push({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      fullName: `${user.first_name} ${user.last_name}`.trim()
    })
    participantPhone.value = ''
  } catch (lookupError: any) {
    participantError.value = lookupError?.message || 'Пользователь с таким номером не найден'
  } finally {
    isLookingUpParticipant.value = false
  }
}

const removeParticipant = (participantId: number) => {
  invitedParticipants.value = invitedParticipants.value.filter(user => user.id !== participantId)
}

const validateForm = () => {
  let isValid = true
  const newErrors = {
    title: '',
    country: '',
    startDate: '',
    endDate: '',
    budget: ''
  }

  if (!formData.value.title || formData.value.title.length < 3) {
    newErrors.title = 'Минимум 3 символа'
    isValid = false
  }

  if (!formData.value.country || formData.value.country.length < 2) {
    newErrors.country = 'Укажите место'
    isValid = false
  }

  if (!formData.value.startDate) {
    newErrors.startDate = 'Выберите дату заезда'
    isValid = false
  }

  if (!formData.value.endDate) {
    newErrors.endDate = 'Выберите дату выезда'
    isValid = false
  }

  if (formData.value.startDate && formData.value.endDate) {
    const start = new Date(formData.value.startDate)
    const end = new Date(formData.value.endDate)
    if (end < start) {
      newErrors.endDate = 'Не может быть раньше заезда'
      isValid = false
    }
  }

  if (formData.value.budget < 0) {
    newErrors.budget = 'Не может быть отрицательным'
    isValid = false
  }

  errors.value = newErrors
  return isValid
}

const onSubmit = async () => {
  if (!validateForm()) return

  isSubmitting.value = true
  globalError.value = ''

  try {
    const creatorId = userStore.currentUserId ?? 1
    const currencyId = selectedCurrencyId.value ?? currencyStore.currencies[0]?.id ?? 1

    const newTrip = await tripStore.createTrip({
      emoji: formData.value.emoji,
      creatorId,
      title: formData.value.title,
      country: formData.value.country,
      startDate: formData.value.startDate,
      endDate: formData.value.endDate,
      currencyId,
      budget: Number(formData.value.budget) || 0,
      description: ''
    })

    const tripId = newTrip.id
    if (!tripId) {
      throw new Error('Не удалось создать поездку')
    }

    await tripMemberStore.addTripMember({
      trip_id: tripId,
      member_id: creatorId,
      status: 'confirmed',
      role: 'creator'
    })

    await Promise.all(invitedParticipants.value.map(async participant => {
      await tripMemberStore.addTripMember({
        trip_id: tripId,
        member_id: participant.id,
        status: 'pending',
        role: 'participant'
      })

      await notificationStore.addNotification({
        trip_id: tripId,
        user_id: participant.id,
        type: 'trip_invite',
        message: `${userStore.currentUser?.first_name || 'Пользователь'} приглашает вас в поездку "${formData.value.title}"`,
        is_read: false,
        created_at: new Date().toISOString()
      })
    }))

    await dialogs.alert({
      title: 'Успешно',
      message: 'Поездка создана!',
      okButtonText: 'OK'
    })

    $navigateBack()
  } catch (error: any) {
    globalError.value = error.message || 'Ошибка при создании поездки'
  } finally {
    isSubmitting.value = false
  }
}

const onReset = async () => {
  const result = await dialogs.confirm({
    title: 'Сброс',
    message: 'Очистить все поля?',
    okButtonText: 'Да',
    cancelButtonText: 'Нет'
  })

  if (result) {
    formData.value = {
      title: '',
      emoji: '🌴',
      country: '',
      startDate: '',
      endDate: '',
      budget: 0
    }
    invitedParticipants.value = []
    participantPhone.value = ''
    participantError.value = ''
    errors.value = {
      title: '',
      country: '',
      startDate: '',
      endDate: '',
      budget: ''
    }
  }
}

const onCancel = async () => {
  const result = await dialogs.confirm({
    title: 'Отмена',
    message: 'Отменить создание поездки?',
    okButtonText: 'Да',
    cancelButtonText: 'Нет'
  })

  if (result) {
    $navigateBack()
  }
}
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
  background-color: #FFDD2D;
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
  background-color: #FFDD2D;
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

.mt-4 {
  margin-top: 16;
}

.add-participant-btn {
  margin-top: 8;
  margin-right: 0;
}

.participants-list {
  margin-top: 12;
}

.participant-item {
  padding: 12;
  border-width: 1;
  border-color: #e5e7eb;
  border-radius: 10;
  margin-top: 8;
  background-color: white;
}

.participant-name {
  font-size: 14;
  font-weight: 600;
  color: #111827;
}

.participant-phone {
  font-size: 12;
  color: #6b7280;
  margin-top: 2;
}

.remove-btn {
  color: #ef4444;
  background-color: transparent;
  border-width: 1;
  border-color: #fecaca;
  border-radius: 8;
  padding: 8 12;
}
</style>
