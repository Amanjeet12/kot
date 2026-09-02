import { Buffer } from 'buffer';

import EscPosProtocol from '../protocols/EscPosProtocol';

import { getCharactersPerLine } from '../printerTypes';

import receiptLogoRasters from './receiptLogoRaster';

const normalizeText = value => {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).replace(/₹|â‚¹/g, 'Rs.').replace(/\s+/g, ' ').trim();
};

const formatMoney = value => {
  const number = Number(value || 0);

  if (!Number.isFinite(number) || number < 0) {
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

const getReceiptLogo = width => {
  const safePixelWidth = Math.max(0, Number(width) || 0) * 12;
  const preferredPixelWidth = 256;

  return receiptLogoRasters
    .filter(
      logo => logo.width <= safePixelWidth && logo.width <= preferredPixelWidth,
    )
    .sort((first, second) => second.width - first.width)[0];
};

export const buildReceipt = (order, config) => {
  const width =
    config?.charactersPerLine || getCharactersPerLine(config?.paperWidth);

  const chunks = [];

  const items = Array.isArray(order?.items) ? order.items : [];

  const orderNumber =
    order?.orderNumber || order?.order_number || order?.id || '-';

  const totalQuantity = items.reduce((total, item) => {
    const quantity = Number(item?.quantity);

    return total + (Number.isFinite(quantity) && quantity > 0 ? quantity : 0);
  }, 0);

  const reference =
    order?.reference ||
    order?.referenceNumber ||
    order?.transactionReference ||
    order?.transaction_id ||
    order?.transactionId ||
    order?.paymentReference;

  const logo = getReceiptLogo(width);

  const paymentMode = normalizeText(
    order?.paymentMethod ||
      order?.payment_method ||
      order?.paymentType ||
      'Wallet',
  ).replace(/\s+paid$/i, '');

  chunks.push(EscPosProtocol.initialize());

  /*
   * HEADER
   */

  chunks.push(EscPosProtocol.alignCenter());

  if (logo) {
    chunks.push(EscPosProtocol.rasterImage(logo.data, logo.width, logo.height));

    chunks.push(EscPosProtocol.feed(1));
  }

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text('ORDER RECEIPT\n'));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  /*
   * ORDER
   */

  chunks.push(EscPosProtocol.alignLeft());

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.bold(true));

  const orderLabel = `Order #${orderNumber}`;
  const orderTime = normalizeText(order?.orderTime);
  const orderWidthMultiplier =
    !orderTime || orderLabel.length * 2 + orderTime.length + 1 <= width ? 2 : 1;

  chunks.push(EscPosProtocol.textSize(orderWidthMultiplier, 2));

  chunks.push(EscPosProtocol.text(orderLabel));

  if (orderTime) {
    chunks.push(EscPosProtocol.normalSize());

    const spaces = Math.max(
      width - orderLabel.length * orderWidthMultiplier - orderTime.length,
      1,
    );

    chunks.push(EscPosProtocol.text(`${' '.repeat(spaces)}${orderTime}\n`));
  } else {
    chunks.push(EscPosProtocol.text('\n'));

    chunks.push(EscPosProtocol.normalSize());
  }

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text('\n'));

  if (order?.customerName) {
    pushWrapped(chunks, `Customer: ${order.customerName}`, width);
  }

  if (order?.collectionPoint) {
    pushWrapped(chunks, `Pickup: ${order.collectionPoint}`, width);
  }

  chunks.push(
    EscPosProtocol.text(
      `Quantity: ${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}\n`,
    ),
  );

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  /*
   * ITEMS
   */

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.text(`${twoColumns('ITEM', 'AMOUNT', width)}\n`));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  items.forEach((item, index) => {
    const parsedQuantity = Number(item?.quantity);

    const quantity =
      Number.isFinite(parsedQuantity) && parsedQuantity > 0
        ? parsedQuantity
        : 0;

    const parsedPrice = Number(item?.price);

    const price =
      Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;

    const parsedAmount = Number(
      item?.totalAmount ??
        item?.total_amount ??
        item?.amount ??
        quantity * price,
    );

    const amount =
      Number.isFinite(parsedAmount) && parsedAmount >= 0 ? parsedAmount : 0;

    const itemName =
      item?.name || item?.itemName || item?.item_name || `Item ${index + 1}`;

    const title = `${quantity} x ${itemName}`;

    const amountText = `Rs.${formatMoney(amount)}`;

    const titleLines = wrapText(
      title,
      Math.max(width - amountText.length - 1, 1),
    );

    chunks.push(EscPosProtocol.bold(true));

    if (titleLines.length) {
      chunks.push(
        EscPosProtocol.text(
          `${twoColumns(titleLines[0], amountText, width)}\n`,
        ),
      );

      titleLines.slice(1).forEach(line => {
        chunks.push(EscPosProtocol.text(`${line}\n`));
      });
    }

    chunks.push(EscPosProtocol.bold(false));

    const itemNote = item?.preparationNote || item?.instructions || item?.note;

    if (itemNote) {
      pushWrapped(chunks, `Note: ${itemNote}`, width);
    }

    chunks.push(EscPosProtocol.text('\n'));
  });

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  /*
   * PAYMENT
   */

  chunks.push(
    EscPosProtocol.text(`${twoColumns('Payment', paymentMode, width)}\n`),
  );

  /*
   * TOTAL
   */

  chunks.push(EscPosProtocol.bold(true));

  const totalText = `Rs.${formatMoney(
    order?.totalAmount ?? order?.total_amount,
  )}`;

  const totalWidthMultiplier =
    'TOTAL'.length + totalText.length + 1 <= Math.floor(width / 2) ? 2 : 1;

  const totalLineWidth = Math.floor(width / totalWidthMultiplier);

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.textSize(totalWidthMultiplier, 2));

  chunks.push(
    EscPosProtocol.text(`${twoColumns('TOTAL', totalText, totalLineWidth)}\n`),
  );

  chunks.push(EscPosProtocol.normalSize());

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  if (reference) {
    pushWrapped(chunks, `Ref: ${reference}`, width);
  }

  /*
   * PREPARATION NOTE
   */

  if (order?.preparationNote) {
    chunks.push(EscPosProtocol.text('\n'));

    chunks.push(EscPosProtocol.bold(true));

    chunks.push(EscPosProtocol.text('PREPARATION NOTE\n'));

    chunks.push(EscPosProtocol.bold(false));

    pushWrapped(chunks, order.preparationNote, width);
  }

  /*
   * FOOTER
   */

  chunks.push(EscPosProtocol.text('\n'));

  chunks.push(EscPosProtocol.alignCenter());

  chunks.push(EscPosProtocol.bold(true));

  chunks.push(EscPosProtocol.text('Thank you\n'));

  chunks.push(EscPosProtocol.bold(false));

  chunks.push(EscPosProtocol.text(`Order #${orderNumber}\n`));

  chunks.push(EscPosProtocol.text(`${separator(width)}\n`));

  chunks.push(EscPosProtocol.text('Good food. Better workdays.\n'));

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
