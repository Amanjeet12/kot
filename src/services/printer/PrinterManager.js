import NetworkTransport from './transports/NetworkTransport';
import BluetoothTransport from './transports/BluetoothTransport';

import { buildReceipt, buildTestReceipt } from './receipt/receiptBuilder';

import {
  getPrinterConfig,
  savePrinterConfig,
  removePrinterConfig,
} from './printerStorage';

import {
  BLUETOOTH_TYPES,
  CONNECTION_TYPES,
  DEFAULT_PRINTER_CONFIG,
  PRINTER_PROTOCOLS,
  getCharactersPerLine,
} from './printerTypes';

const isValidIpv4 = value => {
  if (!value) {
    return false;
  }

  const parts = String(value).split('.');

  if (parts.length !== 4) {
    return false;
  }

  return parts.every(part => {
    if (!/^\d+$/.test(part)) {
      return false;
    }

    const number = Number(part);

    return number >= 0 && number <= 255;
  });
};

class PrinterManager {
  async getPrinter() {
    return getPrinterConfig();
  }

  async isConfigured() {
    const printer = await this.getPrinter();

    if (!printer) {
      return false;
    }

    try {
      this.validateConfig(this.normalizeConfig(printer));

      return true;
    } catch (error) {
      return false;
    }
  }

  validateConfig(config) {
    if (!config) {
      throw new Error('Printer configuration is required.');
    }

    if (config.protocol !== PRINTER_PROTOCOLS.ESC_POS) {
      throw new Error('Only ESC/POS printers are supported.');
    }

    if (![58, 80].includes(Number(config.paperWidth))) {
      throw new Error('Paper width must be 58mm or 80mm.');
    }

    switch (config.connectionType) {
      case CONNECTION_TYPES.NETWORK: {
        if (!isValidIpv4(config.host)) {
          throw new Error('Enter a valid printer IP address.');
        }

        const port = Number(config.port);

        if (!Number.isInteger(port) || port <= 0 || port > 65535) {
          throw new Error('Enter a valid printer port.');
        }

        return true;
      }

      case CONNECTION_TYPES.BLUETOOTH:
        if (config.bluetoothType !== BLUETOOTH_TYPES.CLASSIC) {
          throw new Error('Only Bluetooth Classic printers are supported.');
        }

        if (!String(config.deviceAddress || '').trim()) {
          throw new Error('Select a Bluetooth printer.');
        }

        return true;

      default:
        throw new Error('Unsupported printer connection type.');
    }
  }

  normalizeConfig(config) {
    if (!config) {
      throw new Error('Printer configuration is required.');
    }

    const connectionType =
      config.connectionType || DEFAULT_PRINTER_CONFIG.connectionType;
    const paperWidth = Number(
      config.paperWidth ?? DEFAULT_PRINTER_CONFIG.paperWidth,
    );

    const sharedConfig = {
      id: config.id || DEFAULT_PRINTER_CONFIG.id,
      name: config.name?.trim() || 'Kitchen Printer',
      connectionType,
      protocol: config.protocol || DEFAULT_PRINTER_CONFIG.protocol,
      paperWidth,
      charactersPerLine: getCharactersPerLine(paperWidth),
      autoCut: config.autoCut !== false,
      enabled: config.enabled !== false,
    };

    if (connectionType === CONNECTION_TYPES.NETWORK) {
      const port =
        config.port === '' || config.port === null || config.port === undefined
          ? DEFAULT_PRINTER_CONFIG.port
          : Number(config.port);

      return {
        ...sharedConfig,
        host: String(config.host || '').trim(),
        port,
      };
    }

    if (connectionType === CONNECTION_TYPES.BLUETOOTH) {
      return {
        ...sharedConfig,
        bluetoothType: config.bluetoothType || BLUETOOTH_TYPES.CLASSIC,
        deviceName: String(config.deviceName || '').trim(),
        deviceAddress: String(config.deviceAddress || '').trim(),
      };
    }

    return sharedConfig;
  }

  getTransport(config) {
    switch (config?.connectionType) {
      case CONNECTION_TYPES.NETWORK:
        return NetworkTransport;

      case CONNECTION_TYPES.BLUETOOTH:
        return BluetoothTransport;

      default:
        throw new Error('Unsupported printer connection type.');
    }
  }

  async savePrinter(config) {
    const normalized = this.normalizeConfig(config);

    this.validateConfig(normalized);

    await savePrinterConfig(normalized);

    return normalized;
  }

  async removePrinter() {
    return removePrinterConfig();
  }

  async testConnection(config = null) {
    const printer = config || (await this.getPrinter());

    if (!printer) {
      throw new Error('Printer is not configured.');
    }

    const normalized = this.normalizeConfig(printer);

    this.validateConfig(normalized);

    return this.getTransport(normalized).test(normalized);
  }

  async printTestPage(config = null) {
    const printer = config || (await this.getPrinter());

    if (!printer) {
      throw new Error('Printer is not configured.');
    }

    const normalized = this.normalizeConfig(printer);

    this.validateConfig(normalized);

    const data = buildTestReceipt(normalized);

    return this.getTransport(normalized).send(normalized, data);
  }

  async printReceipt(order) {
    if (!order) {
      throw new Error('Order is required.');
    }

    const printer = await this.getPrinter();

    if (!printer) {
      const error = new Error('Printer is not configured.');

      error.code = 'PRINTER_NOT_CONFIGURED';

      throw error;
    }

    if (printer.enabled === false) {
      throw new Error('Printer is disabled.');
    }

    const normalized = this.normalizeConfig(printer);

    this.validateConfig(normalized);

    const data = buildReceipt(order, normalized);

    return this.getTransport(normalized).send(normalized, data);
  }
}

export default new PrinterManager();
