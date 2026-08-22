import { Buffer } from 'buffer';

import EscPosProtocol from '../protocols/EscPosProtocol';

import { getCharactersPerLine } from '../printerTypes';

const normalizeText = value => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/₹/g, 'Rs.').trim();
};

const formatMoney = value => {
  const number = Number(value || 0);

  if (Number.isNaN(number)) {
    return '0';
  }

  return Number.isInteger(number) ? String(number) : number.toFixed(2);
};

const separator = (width, char = '-') => char.repeat(width);

const twoColumns = (left, right, width) => {
  let leftText = normalizeText(left);

  let rightText = normalizeText(right);

  if (rightText.length >= width) {
    rightText = rightText.substring(0, width - 1);
  }

  const maxLeft = width - rightText.length - 1;

  if (leftText.length > maxLeft) {
    leftText = leftText.substring(0, Math.max(maxLeft, 1));
  }

  const spaces = Math.max(width - leftText.length - rightText.length, 1);

  return leftText + ' '.repeat(spaces) + rightText;
};

const wrapText = (value, width) => {
  const stringValue = normalizeText(value);

  if (!stringValue) {
    return [];
  }

  const words = stringValue.split(/\s+/);

  const lines = [];

  let currentLine = '';

  words.forEach(word => {
    if (word.length > width) {
      if (currentLine) {
        lines.push(currentLine);

        currentLine = '';
      }

      for (let index = 0; index < word.length; index += width) {
        lines.push(word.substring(index, index + width));
      }

      return;
    }

    if (!currentLine) {
      currentLine = word;

      return;
    }

    const candidate = `${currentLine} ${word}`;

    if (candidate.length <= width) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);

      currentLine = word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const pushWrapped = (chunks, value, width) => {
  wrapText(value, width).forEach(line => {
    chunks.push(EscPosProtocol.text(`${line}\n`));
  });
};

export const buildReceipt = (order, config) => {
  const width =
    config?.charactersPerLine || getCharactersPerLine(config?.paperWidth);

  const chunks = [];

  const items = Array.isArray(order?.items) ? order.items : [];

  const orderNumber =
    order?.orderNumber || order?.order_number || order?.id || '-';

  const kotNumber = order?.kotNumber || order?.kot_number || order?.id || '-';

  const totalQuantity = items.reduce(
    (total, item) => total + Number(item?.quantity || 0),
    0,
  );

  chunks.push(EscPosProtocol.initialize());

  /*
   * HEADER
   */

  chunks.push(EscPosProtocol.alignCenter());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.doubleSize());

  chunks.push(EscPosProtocol.text('WORKFOOD\n'));

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.text('ORDER RECEIPT\n'));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`${separator(width, '=')}\n`));

  /*
   * ORDER
   */

  chunks.push(EscPosProtocol.alignLeft());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(
    EscPosProtocol.text(
      `${twoColumns(`Order #${orderNumber}`, order?.orderTime || '', width)}\n`,
    ),
  );

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`KOT #${kotNumber}\n`));

  if (order?.customerName) {
    pushWrapped(chunks, `Customer: ${order.customerName}`, width);
  }

  if (order?.collectionPoint) {
    pushWrapped(chunks, `Collection: ${order.collectionPoint}`, width);
  }

  chunks.push(EscPosProtocol.text(`Quantity: ${totalQuantity} items\n`));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  /*
   * ITEMS
   */

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.text(`${twoColumns('ITEM', 'AMOUNT', width)}\n`));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  items.forEach((item, index) => {
    const quantity = Number(item?.quantity || 0);

    const price = Number(item?.price || 0);

    const amount = Number(
      item?.totalAmount ??
        item?.total_amount ??
        item?.amount ??
        quantity * price,
    );

    const itemName =
      item?.name || item?.itemName || item?.item_name || `Item ${index + 1}`;

    const title = `${quantity}x ${itemName}`;

    const titleLines = wrapText(title, Math.max(width - 12, 10));

    chunks.push(EscPosProtocol.bold(true));

    if (titleLines.length) {
      chunks.push(
        EscPosProtocol.text(
          `${twoColumns(titleLines[0], `Rs.${formatMoney(amount)}`, width)}\n`,
        ),
      );

      titleLines.slice(1).forEach(line => {
        chunks.push(EscPosProtocol.text(`${line}\n`));
      });
    }

    chunks.push(EscPosProtocol.bold(false));

    if (item?.category) {
      pushWrapped(chunks, `  ${item.category}`, width);
    }

    if (item?.description) {
      pushWrapped(chunks, `  ${item.description}`, width);
    }

    const itemNote = item?.preparationNote || item?.instructions || item?.note;

    if (itemNote) {
      pushWrapped(chunks, `  Note: ${itemNote}`, width);
    }

    chunks.push(EscPosProtocol.text('\n'));
  });

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  /*
   * PAYMENT
   */

  chunks.push(
    EscPosProtocol.text(
      `${twoColumns('Payment', order?.paymentType || 'Wallet paid', width)}\n`,
    ),
  );

  /*
   * TOTAL
   */

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(
    EscPosProtocol.text(
      `${twoColumns(
        'TOTAL',
        `Rs.${formatMoney(order?.totalAmount ?? order?.total_amount)}`,
        width,
      )}\n`,
    ),
  );

  chunks.push(EscPosProtocol.bold(false));

  /*
   * PREPARATION NOTE
   */

  if (order?.preparationNote) {
    chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

    chunks.push(EscPosProtocol.bold(true));

    chunks.push(EscPosProtocol.text('PREPARATION NOTE\n'));

    chunks.push(EscPosProtocol.bold(false));

    pushWrapped(chunks, order.preparationNote, width);
  }

  /*
   * FOOTER
   */

  chunks.push(EscPosProtocol.text(`${separator(width, '=')}\n`));

  chunks.push(EscPosProtocol.alignCenter());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.text('Thank You\n'));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`Order #${orderNumber}\n`));

  chunks.push(EscPosProtocol.feed(3));

  if (config?.autoCut !== false) {
    chunks.push(EscPosProtocol.fullCut());
  }

  return Buffer.concat(chunks);
};

export const buildTestReceipt = config => {
  const width =
    config?.charactersPerLine || getCharactersPerLine(config?.paperWidth);

  const chunks = [];

  chunks.push(EscPosProtocol.initialize());

  chunks.push(EscPosProtocol.alignCenter());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.doubleSize());

  chunks.push(EscPosProtocol.text('WORKFOOD\n'));

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.text('PRINTER TEST\n'));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`${separator(width, '=')}\n`));

  chunks.push(EscPosProtocol.alignLeft());

  chunks.push(EscPosProtocol.text(`Name: ${config?.name || 'Printer'}\n`));

  chunks.push(EscPosProtocol.text(`Connection: Network\n`));

  chunks.push(
    EscPosProtocol.text(`Address: ${config?.host}:${config?.port}\n`),
  );

  chunks.push(EscPosProtocol.text(`Protocol: ESC/POS\n`));

  chunks.push(EscPosProtocol.text(`Paper: ${config?.paperWidth}mm\n`));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  chunks.push(EscPosProtocol.alignCenter());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.text('TEST SUCCESSFUL\n'));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text('Printer is ready to use.\n'));

  chunks.push(EscPosProtocol.feed(3));

  if (config?.autoCut !== false) {
    chunks.push(EscPosProtocol.fullCut());
  }

  return Buffer.concat(chunks);
};
