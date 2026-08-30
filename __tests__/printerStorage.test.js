jest.mock('@react-native-async-storage/async-storage', () => {
  const storage = {
    getItem: jest.fn(),
    removeItem: jest.fn(),
    setItem: jest.fn(),
  };

  return {
    __storage: storage,
    createAsyncStorage: jest.fn(() => storage),
  };
});

import {
  getPrinterConfig,
  removePrinterConfig,
  savePrinterConfig,
} from '../src/services/printer/printerStorage';

const {__storage: mockStorage} = require('@react-native-async-storage/async-storage');

describe('printerStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes and deserializes printer configuration', async () => {
    const config = {host: '192.168.1.12', port: 9100};
    mockStorage.getItem.mockResolvedValue(JSON.stringify(config));

    await expect(getPrinterConfig()).resolves.toEqual(config);
    await expect(savePrinterConfig(config)).resolves.toEqual(config);
    expect(mockStorage.setItem).toHaveBeenCalledWith(
      'primary-printer-config',
      JSON.stringify(config),
    );
  });

  it('clears corrupt JSON without crashing', async () => {
    mockStorage.getItem.mockResolvedValue('{not-json');
    mockStorage.removeItem.mockResolvedValue();

    await expect(getPrinterConfig()).resolves.toBeNull();
    expect(mockStorage.removeItem).toHaveBeenCalledWith(
      'primary-printer-config',
    );
  });

  it('removes the saved configuration', async () => {
    mockStorage.removeItem.mockResolvedValue();

    await expect(removePrinterConfig()).resolves.toBe(true);
    expect(mockStorage.removeItem).toHaveBeenCalledWith(
      'primary-printer-config',
    );
  });
});
