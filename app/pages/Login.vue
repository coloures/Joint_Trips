<template>
  <Page class="login-page">
    <ActionBar title="Вход в аккаунт" backgroundColor="#3b82f6" color="white" />

    <ScrollView>
      <StackLayout class="login-content">
        <Label text="Войти в аккаунт" class="login-title" />
        <Label
          text="Введите имя, фамилию и номер телефона, чтобы найти пользователя в тестовой базе"
          class="login-subtitle"
          textWrap="true"
        />

        <StackLayout class="input-group">
          <Label text="Имя" class="input-label" />
          <TextField v-model="firstName" hint="Иван" class="input" />
        </StackLayout>

        <StackLayout class="input-group">
          <Label text="Фамилия" class="input-label" />
          <TextField v-model="lastName" hint="Иванов" class="input" />
        </StackLayout>

        <StackLayout class="input-group">
          <Label text="Номер телефона" class="input-label" />
          <TextField v-model="phoneNumber" hint="+79161234567" keyboard-type="phone" class="input" />
        </StackLayout>

        <Button text="Войти" class="btn-login" @tap="attemptLogin" />
        <Label v-if="error" :text="error" class="error" />

        <StackLayout v-if="users.length" class="helper-block">
          <Label text="Тестовые пользователи" class="helper-title" />
          <Label
            v-for="user in users"
            :key="user.id"
            :text="`${user.first_name} ${user.last_name} — ${user.phone_number}`"
            class="helper-line"
          />
        </StackLayout>
      </StackLayout>
    </ScrollView>
  </Page>
</template>

<script setup lang="ts">
import { computed, ref } from 'nativescript-vue'
import { useUserStore } from '~/stores/userStore'

const userStore = useUserStore()

const users = computed(() => userStore.getAllUsers())
const firstName = ref('')
const lastName = ref('')
const phoneNumber = ref('')
const error = ref('')

const attemptLogin = () => {
  error.value = ''
  if (!firstName.value.trim() || !lastName.value.trim() || !phoneNumber.value.trim()) {
    error.value = 'Заполните имя, фамилию и номер телефона'
    return
  }

  try {
    userStore.loginWithCredentials({
      first_name: firstName.value,
      last_name: lastName.value,
      phone_number: phoneNumber.value
    })
  } catch (authError: any) {
    error.value = authError?.message || 'Не удалось найти пользователя'
  }
}
</script>

<style scoped>
.login-page {
  background-color: #f3f4f8;
}

.login-content {
  padding: 32;
  gap: 16;
}

.login-title {
  font-size: 24;
  font-weight: bold;
  color: #111827;
  margin-bottom: 8;
}

.login-subtitle {
  font-size: 14;
  color: #6b7280;
}

.input-group {
  margin-top: 8;
}

.input-label {
  font-size: 12;
  color: #6b7280;
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

.btn-login {
  margin-top: 16;
  background-color: #3b82f6;
  color: white;
  border-radius: 10;
  padding: 12;
  font-weight: 600;
}

.error {
  margin-top: 8;
  color: #ef4444;
  font-size: 12;
  text-align: center;
}

.helper-block {
  margin-top: 24;
  padding: 16;
  border-radius: 12;
  background-color: white;
  border-width: 1;
  border-color: #e5e7eb;
}

.helper-title {
  font-size: 12;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8;
}

.helper-line {
  font-size: 14;
  color: #111827;
  margin-bottom: 4;
}
</style>
