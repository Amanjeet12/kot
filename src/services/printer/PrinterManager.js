import NetworkTransport from './transports/NetworkTransport';

import { buildReceipt, buildTestReceipt } from './receipt/receiptBuilder';

import {
  getPrinterConfig,
  savePrinterConfig,
  removePrinterConfig,
} from './printerStorage';

import {
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

    return Boolean(printer?.host);
  }

  validateConfig(config) {
    if (!config) {
      throw new Error('Printer configuration is required.');
    }

    if (config.connectionType !== CONNECTION_TYPES.NETWORK) {
      throw new Error('Only network printers are supported in Phase 1.');
    }

    if (config.protocol !== PRINTER_PROTOCOLS.ESC_POS) {
      throw new Error('Only ESC/POS printers are supported in Phase 1.');
    }

    if (!isValidIpv4(config.host)) {
      throw new Error('Enter a valid printer IP address.');
    }

    const port = Number(config.port);

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new Error('Enter a valid printer port.');
    }

    if (![58, 80].includes(Number(config.paperWidth))) {
      throw new Error('Paper width must be 58mm or 80mm.');
    }

    return true;
  }

  normalizeConfig(config) {
    const port =
      config.port === '' || config.port === null || config.port === undefined
        ? DEFAULT_PRINTER_CONFIG.port
        : Number(config.port);
    const paperWidth = Number(
      config.paperWidth ?? DEFAULT_PRINTER_CONFIG.paperWidth,
    );

    return {
      id: config.id || DEFAULT_PRINTER_CONFIG.id,
      name: config.name?.trim() || 'Kitchen Printer',
      connectionType:
        config.connectionType || DEFAULT_PRINTER_CONFIG.connectionType,
      protocol: config.protocol || DEFAULT_PRINTER_CONFIG.protocol,
      host: String(config.host || '').trim(),
      port,
      paperWidth,
      charactersPerLine: getCharactersPerLine(paperWidth),
      autoCut: config.autoCut !== false,
      enabled: config.enabled !== false,
    };
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

    return NetworkTransport.test(normalized);
  }

  async printTestPage(config = null) {
    const printer = config || (await this.getPrinter());

    if (!printer) {
      throw new Error('Printer is not configured.');
    }

    const normalized = this.normalizeConfig(printer);

    this.validateConfig(normalized);

    const data = buildTestReceipt(normalized);

    return NetworkTransport.send(normalized, data);
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

    return NetworkTransport.send(normalized, data);
  }
}

export default new PrinterManager();
