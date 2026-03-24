import { defineStore } from 'pinia';
import { ref } from 'nativescript-vue';
import type { Notification } from '~/models/notification';

import Notifications from '../seeders/notifications.json';

export const useNotificationStore = defineStore('notification', () => {
  // Состояние
  const notifications = ref<Notification[]>([]);

  // Инициализация из сидов (в будущем будет из API)
  function init() {
    notifications.value = JSON.parse(JSON.stringify(Notifications));
    console.log(`[NotificationStore] Загружено ${notifications.value.length} уведомлений из тестовых данных`);
  }
  init();

  // Геттеры
  const getAllNotifications = () => notifications.value;

  // Получить уведомления для конкретного пользователя
  const getNotificationsByUserId = (userId: number): Notification[] => {
    return notifications.value.filter(n => n.user_id === userId);
  };

  // Получить непрочитанные уведомления для пользователя
  const getUnreadNotificationsByUserId = (userId: number): Notification[] => {
    return getNotificationsByUserId(userId).filter(n => !n.is_read);
  };

  // Получить количество непрочитанных уведомлений для пользователя
  const getUnreadCountByUserId = (userId: number): number => {
    return getUnreadNotificationsByUserId(userId).length;
  };

  // Получить уведомления для определенной поездки
  const getNotificationsByTripId = (tripId: number): Notification[] => {
    return notifications.value.filter(n => n.trip_id === tripId);
  };

  // Методы для изменения
  // Пометить одно уведомление как прочитанное
  function markAsRead(notificationId: number) {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification && !notification.is_read) {
      notification.is_read = true;
    }
  }

  // Пометить все уведомления пользователя как прочитанные
  function markAllAsRead(userId: number) {
    getNotificationsByUserId(userId).forEach(notification => {
      notification.is_read = true;
    });
  }

  // Добавить новое уведомление
  function addNotification(notification: Omit<Notification, 'id'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.max(0, ...notifications.value.map(n => n.id)) + 1,
      is_read: false // Новые уведомления по умолчанию непрочитанные
    };
    notifications.value.unshift(newNotification); // Добавляем в начало массива
  }

  // Возвращаем публичный API
  return {
    // Состояние
    notifications,
    
    // Геттеры
    getAllNotifications,
    getNotificationsByUserId,
    getUnreadNotificationsByUserId,
    getUnreadCountByUserId,
    getNotificationsByTripId,
    
    // Методы
    markAsRead,
    markAllAsRead,
    addNotification
  };
});