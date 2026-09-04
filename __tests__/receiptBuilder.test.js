import { Buffer } from 'buffer';
import {
  buildReceipt,
  buildTestReceipt,
} from '../src/services/printer/receipt/receiptBuilder';
import PrinterManager from '../src/services/printer/PrinterManager';
import { mapTuckShopOrder } from '../src/utils/orderMapper';

jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn(),
}));

jest.mock('../src/services/printer/transports/BluetoothTransport', () => ({
  __esModule: true,
  default: { send: jest.fn(), test: jest.fn() },
}));

jest.mock('../src/services/printer/printerStorage', () => ({
  getPrinterConfig: jest.fn(),
  removePrinterConfig: jest.fn(),
  savePrinterConfig: jest.fn(),
}));

describe('buildReceipt', () => {
  const rasterPrefix = Buffer.from([0x1d, 0x76, 0x30, 0x00]);

  const getRasterDimensions = receipt => {
    const offset = receipt.indexOf(rasterPrefix);

    expect(offset).toBeGreaterThanOrEqual(0);

    return {
      offset,
      width: (receipt[offset + 4] + receipt[offset + 5] * 256) * 8,
      height: receipt[offset + 6] + receipt[offset + 7] * 256,
    };
  };

  it('prints the centered raster logo before ORDER RECEIPT without a text header', () => {
    const receipt = buildReceipt(
      { orderNumber: '42', items: [], totalAmount: 10 },
      { paperWidth: 80, charactersPerLine: 48, autoCut: false },
    );
    const { offset } = getRasterDimensions(receipt);
    const titleOffset = receipt.indexOf(Buffer.from('ORDER RECEIPT\n'));
    const centerOffset = receipt.indexOf(Buffer.from([0x1b, 0x61, 0x01]));

    expect(centerOffset).toBeLessThan(offset);
    expect(offset).toBeLessThan(titleOffset);
    expect(receipt.includes(Buffer.from('WORKFOOD\n'))).toBe(false);
    expect(
      receipt.includes(
        Buffer.concat([
          Buffer.from([0x1d, 0x21, 0x00]),
          Buffer.from([0x1b, 0x45, 0x00]),
          Buffer.from('ORDER RECEIPT\n'),
        ]),
      ),
    ).toBe(true);
  });

  it.each([
    [58, 32, 256],
    [80, 48, 256],
  ])(
    'keeps the %imm logo within the configured printable width',
    (paperWidth, charactersPerLine, expectedLogoWidth) => {
      const receipt = buildReceipt(
        { orderNumber: '42', items: [], totalAmount: 10 },
        { paperWidth, charactersPerLine, autoCut: false },
      );
      const dimensions = getRasterDimensions(receipt);

      expect(dimensions.width).toBe(expectedLogoWidth);
      expect(dimensions.width).toBeLessThanOrEqual(charactersPerLine * 12);
      expect(dimensions.height).toBeGreaterThan(0);
    },
  );

  it('sanitizes invalid quantities instead of printing NaN', () => {
    const receipt = buildReceipt(
      {
        orderNumber: '42',
        items: [{ name: 'Coffee', quantity: 'invalid', price: 'invalid' }],
        totalAmount: Infinity,
      },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');

    expect(receipt).toContain('Quantity: 0 items');
    expect(receipt).toContain('0 x Coffee');
    expect(receipt).not.toContain('NaN');
    expect(receipt).not.toContain('Infinity');
  });

  it.each([
    [58, 32],
    [80, 48],
  ])('formats a %imm receipt at %i characters', (paperWidth, width) => {
    const receipt = buildReceipt(
      { orderNumber: '42', items: [], totalAmount: 10 },
      { paperWidth, charactersPerLine: width, autoCut: false },
    ).toString('utf8');

    expect(receipt).toContain(`${'-'.repeat(width)}\n`);
  });

  it('uses singular and plural quantity grammar', () => {
    const oneItem = buildReceipt(
      { items: [{ name: 'Coffee', quantity: 1, amount: 10 }], totalAmount: 10 },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');
    const multipleItems = buildReceipt(
      { items: [{ name: 'Coffee', quantity: 2, amount: 20 }], totalAmount: 20 },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');

    expect(oneItem).toContain('Quantity: 1 item\n');
    expect(multipleItems).toContain('Quantity: 2 items\n');
  });

  it('wraps a long item name without colliding with its amount', () => {
    const receipt = buildReceipt(
      {
        items: [
          {
            name: 'Extraordinarily Long Chicken Burger With Cheese',
            quantity: 2,
            amount: 40,
          },
        ],
        totalAmount: 40,
      },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');
    const amountOffset = receipt.indexOf('Rs.40');
    const amountLineStart = receipt.lastIndexOf('2 x ', amountOffset);
    const amountLineEnd = receipt.indexOf('\n', amountOffset);
    const amountLine = receipt.slice(amountLineStart, amountLineEnd);

    expect(amountLine).toHaveLength(32);
    expect(amountLine).toMatch(/^2 x .+\sRs\.40$/);
    expect(receipt).toContain('Chicken Burger With Cheese\n');
  });

  it('does not multiply an API line total by the quantity a second time', () => {
    const order = mapTuckShopOrder({
      tuck_shop_order_id: 148,
      total_price: 2050,
      items: [
        {
          tuck_shop_item_id: 23,
          itemName: 'Curd Rice Bowl',
          qty: 6,
          price: 300,
          total_price: 1800,
        },
        {
          tuck_shop_item_id: 40,
          itemName: 'Pomegranate Juice',
          qty: 1,
          price: 250,
          total_price: 250,
        },
      ],
    });
    const receipt = buildReceipt(order, {
      paperWidth: 80,
      charactersPerLine: 48,
      autoCut: false,
    }).toString('utf8');

    expect(receipt).toContain('6 x Curd Rice Bowl');
    expect(receipt).toContain('Rs.1800');
    expect(receipt).toContain('1 x Pomegranate Juice');
    expect(receipt).toContain('Rs.250');
    expect(receipt).toContain('Rs.2050');
    expect(receipt).not.toContain('Rs.10800');
  });

  it('emphasizes the order number while keeping the time on the same row', () => {
    const receipt = buildReceipt(
      { orderNumber: '132', orderTime: '16 Aug, 9:07\u202fPM', items: [] },
      { paperWidth: 80, charactersPerLine: 48, autoCut: false },
    );

    expect(
      receipt.includes(
        Buffer.concat([
          Buffer.from([0x1d, 0x21, 0x11]),
          Buffer.from('Order #132'),
          Buffer.from([0x1d, 0x21, 0x00]),
          Buffer.from(' '.repeat(13)),
          Buffer.from('16 Aug, 9:07 PM\n'),
        ]),
      ),
    ).toBe(true);
    expect(receipt.toString('utf8')).not.toContain('\u202f');
  });

  it('does not print the KOT number', () => {
    const receipt = buildReceipt(
      { orderNumber: '132', kotNumber: '132', items: [] },
      { paperWidth: 80, charactersPerLine: 48, autoCut: false },
    ).toString('utf8');

    expect(receipt).not.toContain('KOT #');
  });

  it('omits item descriptions and categories', () => {
    const receipt = buildReceipt(
      {
        items: [
          {
            name: 'Chicken Burger',
            category: 'Snacks',
            description: 'Mini chicken burger',
            quantity: 1,
            amount: 40,
          },
        ],
        totalAmount: 40,
      },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');

    expect(receipt).not.toContain('Snacks');
    expect(receipt).not.toContain('Mini chicken burger');
  });

  it('uses a wider, taller, width-safe TOTAL line on 58mm paper', () => {
    const receipt = buildReceipt(
      { items: [], totalAmount: 40 },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    );

    expect(
      receipt.includes(
        Buffer.concat([
          Buffer.from([0x1d, 0x21, 0x11]),
          Buffer.from('TOTAL      Rs.40\n'),
          Buffer.from([0x1d, 0x21, 0x00]),
          Buffer.from([0x1b, 0x45, 0x00]),
        ]),
      ),
    ).toBe(true);
  });

  it('prints only the payment mode without a paid suffix', () => {
    const receipt = buildReceipt(
      { items: [], totalAmount: 40, paymentType: 'Wallet paid' },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    ).toString('utf8');

    expect(receipt).toContain('Payment                   Wallet\n');
    expect(receipt).not.toContain('Wallet paid');
  });

  it('prints available reference data and the requested footer text', () => {
    const receipt = buildReceipt(
      { orderNumber: '004', items: [], totalAmount: 40, transactionId: 'TX-7' },
      { paperWidth: 80, charactersPerLine: 48, autoCut: false },
    ).toString('utf8');

    expect(receipt).toContain('Ref: TX-7\n');
    expect(receipt).toContain('Thank you\n');
    expect(receipt).toContain('Order #004\n');
    expect(receipt).toContain('Good food. Better workdays.\n');
  });

  it('does not append a cutter command when autoCut is false', () => {
    const receipt = buildReceipt(
      { orderNumber: '42', items: [], totalAmount: 10 },
      { paperWidth: 58, charactersPerLine: 32, autoCut: false },
    );

    expect(receipt.includes(Buffer.from([0x1d, 0x56, 0x00]))).toBe(false);
  });

  it('appends a cutter command when autoCut is true', () => {
    const receipt = buildReceipt(
      { orderNumber: '42', items: [], totalAmount: 10 },
      { paperWidth: 80, charactersPerLine: 48, autoCut: true },
    );

    expect(receipt.includes(Buffer.from([0x1d, 0x56, 0x00]))).toBe(true);
  });

  it('leaves the printer test receipt byte-for-byte unchanged', () => {
    const receipt = buildTestReceipt({
      name: 'Test',
      host: '127.0.0.1',
      port: 9100,
      paperWidth: 58,
      charactersPerLine: 32,
      autoCut: true,
    });
    const hash = require('crypto')
      .createHash('sha256')
      .update(receipt)
      .digest('hex');

    expect(hash).toBe(
      'd6af7cc6bc3d518808db7f2f1de597ea94c5e1b34b2f5de58c0d8acb20de47c4',
    );
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
      PrinterManager.validateConfig({ ...validConfig, host: '999.1.1.1' }),
    ).toThrow('valid printer IP');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      PrinterManager.validateConfig({ ...validConfig, port: 70000 }),
    ).toThrow('valid printer port');
  });

  it('defaults a missing port and removes stale fields when saving', async () => {
    const {
      savePrinterConfig,
    } = require('../src/services/printer/printerStorage');

    await PrinterManager.savePrinter({
      ...validConfig,
      port: '',
      obsoleteModel: 'legacy-printer',
    });

    expect(savePrinterConfig).toHaveBeenCalledWith(
      expect.objectContaining({ port: 9100 }),
    );
    expect(savePrinterConfig.mock.calls[0][0]).not.toHaveProperty(
      'obsoleteModel',
    );
  });
});
