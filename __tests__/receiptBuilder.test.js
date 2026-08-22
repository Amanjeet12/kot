import {buildReceipt} from '../src/services/printer/receipt/receiptBuilder';

describe('buildReceipt', () => {
  it('sanitizes invalid quantities instead of printing NaN', () => {
    const receipt = buildReceipt(
      {
        orderNumber: '42',
        items: [{name: 'Coffee', quantity: 'invalid', price: 20}],
        totalAmount: 0,
      },
      {paperWidth: 58, charactersPerLine: 32, autoCut: false},
    ).toString('utf8');

    expect(receipt).toContain('Quantity: 0 items');
    expect(receipt).toContain('0x Coffee');
    expect(receipt).not.toContain('NaN');
  });
});
