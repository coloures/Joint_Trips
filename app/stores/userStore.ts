import { defineStore } from 'pinia';
import { computed, ref } from 'nativescript-vue';
import type { User } from '~/models/user';

import Users from '../seeders/users.json';

export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([]);
  const currentUserId = ref<number | null>(null);

  // Инициализация из сидов (в будущем будет из API)
  function init() {
    users.value = JSON.parse(JSON.stringify(Users));
    console.log(`[UserStore] Загружено ${users.value.length} пользователей из тестовых данных`);
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

  const loginWithCredentials = (payload: {
    first_name: string;
    last_name: string;
    phone_number: string;
  }) => {
    const normalized = {
      first_name: payload.first_name.trim().toLowerCase(),
      last_name: payload.last_name.trim().toLowerCase(),
      phone_number: payload.phone_number.replace(/\s+/g, '')
    };

    const matchedUser = users.value.find(user => {
      return (
        user.first_name.trim().toLowerCase() === normalized.first_name &&
        user.last_name.trim().toLowerCase() === normalized.last_name &&
        user.phone_number.replace(/\s+/g, '') === normalized.phone_number
      );
    });

    if (matchedUser) {
      currentUserId.value = matchedUser.id;
      return matchedUser;
    }

    throw new Error('Пользователь не найден');
  };

  const logout = () => {
    currentUserId.value = null;
  };

  // Методы для управления данными (в будущем)
  function addUser(user: Omit<User, 'id'>) {
    const newUser: User = {
      ...user,
      id: Math.max(0, ...users.value.map(u => u.id)) + 1
    };
    users.value.push(newUser);
  }

  function updateUser(id: number, updates: Partial<User>) {
    const index = users.value.findIndex(u => u.id === id);
    if (index !== -1) {
      users.value[index] = { ...users.value[index], ...updates };
    }
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
