import { type User, type Sample, type Booking, type Protocol, type Notification, type ActivityLog } from '../types';
import { mockUsers, mockSamples, mockBookings, mockProtocols, mockNotifications, mockActivityLogs } from './mockData';

const STORAGE_KEYS = {
  CURRENT_USER: 'biolab_current_user',
  USERS: 'biolab_users',
  SAMPLES: 'biolab_samples',
  BOOKINGS: 'biolab_bookings',
  PROTOCOLS: 'biolab_protocols',
  NOTIFICATIONS: 'biolab_notifications',
  ACTIVITY_LOGS: 'biolab_activity_logs'
};

// Initialize storage with mock data if empty
export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SAMPLES)) {
    localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(mockSamples));
  }
  if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(mockBookings));
  }
  if (!localStorage.getItem(STORAGE_KEYS.PROTOCOLS)) {
    localStorage.setItem(STORAGE_KEYS.PROTOCOLS, JSON.stringify(mockProtocols));
  }
  if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(mockNotifications));
  }
  if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS)) {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(mockActivityLogs));
  }
};

// Current User
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return userStr ? JSON.parse(userStr) : null;
};

export const setCurrentUser = (user: User | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// Users
export const getUsers = (): User[] => {
  const usersStr = localStorage.getItem(STORAGE_KEYS.USERS);
  return usersStr ? JSON.parse(usersStr) : [];
};

export const addUser = (user: User) => {
  const users = getUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const updateUser = (userId: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    
    // Update current user if it's the same
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === userId) {
      setCurrentUser(users[index]);
    }
  }
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filtered));
};

// Samples
export const getSamples = (): Sample[] => {
  const samplesStr = localStorage.getItem(STORAGE_KEYS.SAMPLES);
  return samplesStr ? JSON.parse(samplesStr) : [];
};

export const addSample = (sample: Sample) => {
  const samples = getSamples();
  samples.push(sample);
  localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
};

export const updateSample = (sampleId: string, updates: Partial<Sample>) => {
  const samples = getSamples();
  const index = samples.findIndex(s => s.id === sampleId);
  if (index !== -1) {
    samples[index] = { ...samples[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
  }
};

export const deleteSample = (sampleId: string) => {
  const samples = getSamples();
  const filtered = samples.filter(s => s.id !== sampleId);
  localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(filtered));
};

// Bookings
export const getBookings = (): Booking[] => {
  const bookingsStr = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
  return bookingsStr ? JSON.parse(bookingsStr) : [];
};

export const addBooking = (booking: Booking) => {
  const bookings = getBookings();
  bookings.push(booking);
  localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
};

export const updateBooking = (bookingId: string, updates: Partial<Booking>) => {
  const bookings = getBookings();
  const index = bookings.findIndex(b => b.id === bookingId);
  if (index !== -1) {
    bookings[index] = { ...bookings[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  }
};

// Protocols
export const getProtocols = (): Protocol[] => {
  const protocolsStr = localStorage.getItem(STORAGE_KEYS.PROTOCOLS);
  return protocolsStr ? JSON.parse(protocolsStr) : [];
};

export const addProtocol = (protocol: Protocol) => {
  const protocols = getProtocols();
  protocols.push(protocol);
  localStorage.setItem(STORAGE_KEYS.PROTOCOLS, JSON.stringify(protocols));
};

export const updateProtocol = (protocolId: string, updates: Partial<Protocol>) => {
  const protocols = getProtocols();
  const index = protocols.findIndex(p => p.id === protocolId);
  if (index !== -1) {
    protocols[index] = { ...protocols[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.PROTOCOLS, JSON.stringify(protocols));
  }
};

export const deleteProtocol = (protocolId: string) => {
  const protocols = getProtocols();
  const filtered = protocols.filter(p => p.id !== protocolId);
  localStorage.setItem(STORAGE_KEYS.PROTOCOLS, JSON.stringify(filtered));
};

// Notifications
export const getNotifications = (): Notification[] => {
  const notificationsStr = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
  return notificationsStr ? JSON.parse(notificationsStr) : [];
};

export const addNotification = (notification: Notification) => {
  const notifications = getNotifications();
  notifications.unshift(notification);
  localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
};

export const markNotificationAsRead = (notificationId: string) => {
  const notifications = getNotifications();
  const index = notifications.findIndex(n => n.id === notificationId);
  if (index !== -1) {
    notifications[index].read = true;
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }
};

// Activity Logs
export const getActivityLogs = (): ActivityLog[] => {
  const logsStr = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
  return logsStr ? JSON.parse(logsStr) : [];
};

export const addActivityLog = (log: ActivityLog) => {
  const logs = getActivityLogs();
  logs.unshift(log);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
};
