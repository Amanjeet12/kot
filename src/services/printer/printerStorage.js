import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const printerStorage = createAsyncStorage('workfood-printer');

const PRINTER_KEY = 'primary-printer-config';

export const savePrinterConfig = async config => {
  if (!config) {
    throw new Error('Printer configuration is required.');
  }

  await printerStorage.setItem(PRINTER_KEY, JSON.stringify(config));

  return config;
};

export const getPrinterConfig = async () => {
  try {
    const value = await printerStorage.getItem(PRINTER_KEY);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.log('[PrinterStorage] Read error:', error);

    throw new Error('Unable to read the saved printer configuration.', {
      cause: error,
    });
  }
};

export const removePrinterConfig = async () => {
  await printerStorage.removeItem(PRINTER_KEY);

  return true;
};
