import { defineStore } from 'pinia';
import { computed, ref } from 'nativescript-vue';
import type { User } from '~/models/user';
import type { UserCreatePayload, UserUpdatePayload } from '~/services/userApi';
import { fetchUsers, loginUser, createUser as createUserApi, updateUser as updateUserApi } from '~/services/userApi';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const currentUserId = ref<number | null>(null);
  const isSyncingUsers = ref(false);

  async function loadUsers() {
    if (isSyncingUsers.value) return;
    isSyncingUsers.value = true;
    try {
      const list = await fetchUsers();
      users.value = list;
      console.log(`[UserStore] Загружено ${users.value.length} пользователей с API`);
    } catch (error) {
      console.warn('[UserStore] не удалось загрузить пользователей', error);
    } finally {
      isSyncingUsers.value = false;
    }
  }

  function init() {
    void loadUsers();
  }
  init();

  // Геттеры
  const getAllUsers = () => users.value;

  const getUserById = (id: number): User | null => {
    return users.value.find(user => user.id === id) || null;
  };

  const getUserByPhoneNumber = (phoneNumber: string): User | null => {
    return users.value.find(user => user.phone_number === phoneNumber) || null;
  };

  const getUsersByIds = (ids: number[]): User[] => {
    return users.value.filter(user => ids.includes(user.id));
  };

  const isAuthenticated = computed(() => currentUserId.value !== null);

  const currentUser = computed(() => {
    if (!currentUserId.value) return null;
    return getUserById(currentUserId.value);
  });

  const setCurrentUser = (userId: number | null) => {
    currentUserId.value = userId;
  };

  const loginWithCredentials = async (payload: {
    first_name: string;
    last_name: string;
    phone_number: string;
  }) => {
    const firstName = payload.first_name.trim();
    const lastName = payload.last_name.trim();
    const phoneNumber = payload.phone_number.replace(/\s+/g, '');
    const user = await loginUser(phoneNumber, firstName, lastName);
    currentUserId.value = user.id;
    if (!users.value.some(existing => existing.id === user.id)) {
      users.value.push(user);
    }
    return user;
  };

  const logout = () => {
    currentUserId.value = null;
  };

  // Методы для управления данными (в будущем)
  async function addUser(user: UserCreatePayload) {
    const created = await createUserApi(user);
    users.value.push(created);
    return created;
  }

  async function updateUser(id: number, updates: UserUpdatePayload) {
    const updated = await updateUserApi(id, updates);
    const index = users.value.findIndex(u => u.id === id);
    if (index !== -1) {
      users.value[index] = updated;
    } else {
      users.value.push(updated);
    }
    if (currentUserId.value === id) {
      currentUserId.value = updated?.id ?? currentUserId.value;
    }
    return updated;
  }

  // Возвращаем публичный API
  return {
    users,
    currentUserId,
    currentUser,
    isAuthenticated,
    getAllUsers,
    getUserById,
    getUserByPhoneNumber,
    getUsersByIds,
    addUser,
    updateUser,
    loginWithCredentials,
    logout,
    setCurrentUser
  };
});
