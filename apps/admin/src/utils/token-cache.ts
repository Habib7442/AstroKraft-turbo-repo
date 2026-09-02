import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          return localStorage.getItem(key);
        }
        return null;
      }
      const item = await SecureStore.getItemAsync(key);
      return item;
    } catch (error) {
      console.error("SecureStore get token error: ", error);
      if (Platform.OS !== "web") {
        await SecureStore.deleteItemAsync(key);
      }
      return null;
    }
  },

  async saveToken(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value);
        }
        return;
      }
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("SecureStore save token error: ", err);
    }
  },

  async clearToken(key: string): Promise<void> {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          localStorage.removeItem(key);
        }
        return;
      }
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.error("SecureStore clear token error: ", err);
    }
  }
};
