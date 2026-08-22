import {Buffer} from 'buffer';
import {buildReceipt} from '../src/services/printer/receipt/receiptBuilder';
import PrinterManager from '../src/services/printer/PrinterManager';

jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn(),
}));

jest.mock('../src/services/printer/printerStorage', () => ({
  getPrinterConfig: jest.fn(),
  removePrinterConfig: jest.fn(),
  savePrinterConfig: jest.fn(),
}));

describe('buildReceipt', () => {
  it('sanitizes invalid quantities instead of printing NaN', () => {
    const receipt = buildReceipt(
      {
        orderNumber: '42',
        items: [{name: 'Coffee', quantity: 'invalid', price: 'invalid'}],
        totalAmount: Infinity,
      },
      {paperWidth: 58, charactersPerLine: 32, autoCut: false},
    ).toString('utf8');

    expect(receipt).toContain('Quantity: 0 items');
    expect(receipt).toContain('0x Coffee');
    expect(receipt).not.toContain('NaN');
    expect(receipt).not.toContain('Infinity');
  });

  it.each([
    [58, 32],
    [80, 48],
  ])('formats a %imm receipt at %i characters', (paperWidth, width) => {
    const receipt = buildReceipt(
      {orderNumber: '42', items: [], totalAmount: 10},
      {paperWidth, charactersPerLine: width, autoCut: false},
    ).toString('utf8');

    expect(receipt).toContain(`${'='.repeat(width)}\n`);
  });

  it('does not append a cutter command when autoCut is false', () => {
    const receipt = buildReceipt(
      {orderNumber: '42', items: [], totalAmount: 10},
      {paperWidth: 58, charactersPerLine: 32, autoCut: false},
    );

    expect(receipt.includes(Buffer.from([0x1d, 0x56, 0x00]))).toBe(false);
  });
});

describe('PrinterManager validation', () => {
  const validConfig = {
    connectionType: 'network',
    protocol: 'escpos',
    host: '192.168.1.12',
    port: 9100,
    paperWidth: 80,
  };

  it('rejects an invalid IP address', () => {
    expect(() =>
      PrinterManager.validateConfig({...validConfig, host: '999.1.1.1'}),
    ).toThrow('valid printer IP');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      PrinterManager.validateConfig({...validConfig, port: 70000}),
    ).toThrow('valid printer port');
  });
});
