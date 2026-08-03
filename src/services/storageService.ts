import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, Invoice, Product } from '../types';
import { STORAGE_KEYS, DEFAULT_SETTINGS, INITIAL_PRODUCTS } from '../utils/constants';

export const storageService = {
  // --- SETTINGS ---
  async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return JSON.parse(data);
      }
      // Save default settings if none exist
      await this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings from storage:', error);
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<AppSettings> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return settings;
    } catch (error) {
      console.error('Failed to save settings to storage:', error);
      throw error;
    }
  },

  // --- PRODUCTS ---
  async getProducts(): Promise<Product[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (data) {
        return JSON.parse(data);
      }
      await this.saveProducts(INITIAL_PRODUCTS);
      return INITIAL_PRODUCTS;
    } catch (error) {
      console.error('Failed to load products from storage:', error);
      return INITIAL_PRODUCTS;
    }
  },

  async saveProducts(products: Product[]): Promise<Product[]> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
      return products;
    } catch (error) {
      console.error('Failed to save products to storage:', error);
      throw error;
    }
  },

  // --- INVOICES ---
  async getInvoices(): Promise<Invoice[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error('Failed to load invoices from storage:', error);
      return [];
    }
  },

  async saveInvoice(invoice: Invoice): Promise<Invoice[]> {
    try {
      const currentInvoices = await this.getInvoices();
      const updatedInvoices = [invoice, ...currentInvoices];
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updatedInvoices));
      return updatedInvoices;
    } catch (error) {
      console.error('Failed to save invoice to storage:', error);
      throw error;
    }
  },

  async clearInvoices(): Promise<Invoice[]> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.INVOICES);
      return [];
    } catch (error) {
      console.error('Failed to clear invoices from storage:', error);
      throw error;
    }
  },
};
