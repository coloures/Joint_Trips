import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { User } from '~/models/user';

import Users from '../seeders/users.json';

export const useUserStore = defineStore('user', () => {
  // Состояние
  const users = ref<User[]>([]);

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
    getAllUsers,
    getUserById,
    getUserByPhoneNumber,
    getUsersByIds,
    addUser,
    updateUser
  };
});