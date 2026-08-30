export const CONNECTION_TYPES = {
  NETWORK: 'network',
  BLUETOOTH: 'bluetooth',
  USB: 'usb',
};

export const BLUETOOTH_TYPES = {
  CLASSIC: 'classic',
};

export const USB_TYPES = {
  PRINTER_CLASS: 'printer_class',
  VENDOR_SPECIFIC: 'vendor_specific',
  SERIAL: 'usb_serial',
  UNSUPPORTED: 'unsupported',
};

export const PRINTER_PROTOCOLS = {
  ESC_POS: 'escpos',
};

export const PAPER_WIDTHS = {
  MM_58: 58,
  MM_80: 80,
};

export const DEFAULT_PRINTER_CONFIG = {
  id: 'primary_printer',

  name: 'Kitchen Printer',

  connectionType: CONNECTION_TYPES.NETWORK,

  protocol: PRINTER_PROTOCOLS.ESC_POS,

  host: '',

  port: 9100,

  paperWidth: PAPER_WIDTHS.MM_80,

  charactersPerLine: 48,

  autoCut: true,

  enabled: true,
};

export const getCharactersPerLine = paperWidth => {
  if (Number(paperWidth) === PAPER_WIDTHS.MM_58) {
    return 32;
  }

  return 48;
};
