<template>
  <Page>
    <ActionBar class="hidden" />
    <GridLayout rows="auto, *">
      <GridLayout
        columns="auto, *"
        height="30"
        marginTop="24"
        paddingLeft="24"
        paddingRight="24"
        row="0"
      >
        <GridLayout col="0" width="30" height="30" @tap="$navigateBack">
          <Image
            src="~/assets/icons/Arrow_left.png"
            width="30"
            height="30"
            stretch="aspectFit"
          />
        </GridLayout>
      </GridLayout>

      <ScrollView row="1">
        <StackLayout class="profile-root">
          <GridLayout columns="120, *" class="profile-top">
            <Image col="0" class="profile-avatar" :src="avatarSrc" stretch="aspectFill" />
            <StackLayout col="1" marginLeft="24" marginTop="16">
              <Label class="profile-name" :text="fullName" textWrap="true" />
              <Label class="section-change" text="Поменять" />
            </StackLayout>
          </GridLayout>

          <StackLayout class="section">
            <Label class="section-label" text="Номер:" />
            <Label class="section-value" :text="formattedPhone" />
            <Label class="section-change" text="Поменять" />
          </StackLayout>

          <StackLayout class="section">
            <Label class="section-label" text="Пароль:" />
            <Label class="section-value" text="**********" />
            <Label class="section-change" text="Поменять" />
          </StackLayout>

          <StackLayout class="section section-last">
            <Label class="section-label" text="Задолженность:" />
            <Label class="section-value" :text="`${formattedDebt} ₽`" />
          </StackLayout>

          <StackLayout class="logout-btn" @tap="onLogoutTap">
            <Label text="Выйти из аккаунта" class="logout-btn-text" />
          </StackLayout>
        </StackLayout>
      </ScrollView>
    </GridLayout>
  </Page>
</template>

<script setup lang="ts">
import { computed } from 'nativescript-vue'
import * as dialogs from '@nativescript/core/ui/dialogs'
import { useUserStore } from '~/stores/userStore'

const props = defineProps<{
  debtAmount: number
}>()

const userStore = useUserStore()

const currentUser = computed(() => userStore.currentUser)
const currentUserId = computed(() => userStore.currentUserId)

const fullName = computed(() => {
  if (!currentUser.value) return 'Гость'
  return `${currentUser.value.first_name} ${currentUser.value.last_name}`
})

const avatarSrc = computed(() => {
  if (!currentUserId.value) return ''
  return currentUser.value?.avatar || `https://i.pravatar.cc/200?u=member-${currentUserId.value}`
})

const formattedPhone = computed(() => {
  const phone = currentUser.value?.phone_number || ''
  return phone || '+7 000 000 00 00'
})

const formattedDebt = computed(() => {
  const safe = Number.isFinite(props.debtAmount) ? props.debtAmount : 0
  return Math.round(safe).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
})

const onLogoutTap = async () => {
  const confirmed = await dialogs.confirm({
    title: 'Выход',
    message: 'Выйти из аккаунта?',
    okButtonText: 'Да',
    cancelButtonText: 'Нет'
  })

  if (!confirmed) return
  userStore.logout()
}
</script>

<style scoped>

.hidden {
  height: 0;
  visibility: collapse;
}

.profile-root {
  width: 354;
}

.profile-top {
  margin-top: 24;
  margin-bottom: 20;
}

.profile-avatar {
  width: 120;
  height: 120;
  border-radius: 24;
  background-color: #efefef;
}

.profile-name {
  font-size: 30;
  font-weight: bold;
  color: #313132;
}

.profile-change {
  margin-top: 8;
  font-size: 30;
  color: #ffcc00;
}

.section {
  border-top-width: 1;
  border-top-color: #d9d9d9;
  padding-top: 24;
  padding-bottom: 24;
}

.section-last {
  padding-bottom: 8;
}

.section-label {
  font-size: 16;
  color: #6f7071;
}

.section-value {
  margin-top: 8;
  font-size: 20;
  font-weight: bold;
  color: #313132;
}

.section-change {
  margin-top: 8;
  font-size: 16;
  color: #ffcc00;
}

.logout-btn {
  margin-top: 24;
  margin-bottom: 28;
  height: 52;
  border-radius: 14;
  background-color: #313132;
  vertical-align: middle;
}

.logout-btn-text {
  color: #ffffff;
  font-size: 16;
  font-weight: bold;
  text-align: center;
  vertical-align: middle;
}
</style>
