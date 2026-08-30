import { createAsyncStorage } from '@react-native-async-storage/async-storage';

const printerStorage = createAsyncStorage('workfood-printer');

const PRINTER_KEY = 'primary-printer-config';

export const savePrinterConfig = async config => {
  if (!config) {
    throw new Error('Printer configuration is required.');
  }

  try {
    await printerStorage.setItem(PRINTER_KEY, JSON.stringify(config));
  } catch (error) {
    throw new Error('Unable to save the printer configuration.', {
      cause: error,
    });
  }

  return config;
};

export const getPrinterConfig = async () => {
  try {
    const value = await printerStorage.getItem(PRINTER_KEY);

    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value);
    } catch (parseError) {
      console.log('[PrinterStorage] Invalid saved configuration:', parseError);

      await printerStorage.removeItem(PRINTER_KEY);

      return null;
    }
  } catch (error) {
    console.log('[PrinterStorage] Read error:', error);

    throw new Error('Unable to read the saved printer configuration.', {
      cause: error,
    });
  }
};

export const removePrinterConfig = async () => {
  try {
    await printerStorage.removeItem(PRINTER_KEY);
  } catch (error) {
    throw new Error('Unable to remove the printer configuration.', {
      cause: error,
    });
  }

  return true;
};
