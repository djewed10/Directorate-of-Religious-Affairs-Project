import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'mosque.accessToken';
const USER_KEY = 'mosque.user';

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const authStorage = {
  async setSession(token: string, user: unknown) {
    await setItem(TOKEN_KEY, token);
    await setItem(USER_KEY, JSON.stringify(user));
  },
  async getToken() {
    return getItem(TOKEN_KEY);
  },
  async getUser<T>() {
    const raw = await getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  async clear() {
    await deleteItem(TOKEN_KEY);
    await deleteItem(USER_KEY);
  },
};

