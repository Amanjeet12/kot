import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';

const mockPrinterContext = {
  checkConnection: jest.fn(),
  printTestPage: jest.fn(),
  removePrinter: jest.fn(),
  savePrinter: jest.fn(),
};

jest.mock('../src/contexts/ResponsiveContext', () => ({
  useResponsive: () => ({isTablet: false}),
}));

jest.mock('../src/contexts/PrinterContext', () => ({
  usePrinter: () => mockPrinterContext,
}));

jest.mock('../src/services/printer/PrinterManager', () => ({
  __esModule: true,
  default: {
    getPrinter: jest.fn(),
    normalizeConfig: jest.fn(config => ({...config})),
  },
}));

jest.mock('../src/components/printer/BluetoothPrinterPickerModal', () => () =>
  null,
);

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {show: jest.fn()},
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

import PrinterManager from '../src/services/printer/PrinterManager';
import PrinterSettingsScreen from '../src/screens/settings/PrinterSettingsScreen';

const navigation = {goBack: jest.fn()};

const renderScreen = async () => {
  let renderer;

  await act(async () => {
    renderer = ReactTestRenderer.create(
      <PrinterSettingsScreen navigation={navigation} />,
    );
    await Promise.resolve();
    await Promise.resolve();
  });

  return renderer;
};

const getTextValues = renderer =>
  renderer.root
    .findAllByType(Text)
    .map(node => node.props.children)
    .filter(value => typeof value === 'string');

describe('PrinterSettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    PrinterManager.getPrinter.mockResolvedValue(null);
  });

  it('shows only network fields by default and Bluetooth fields after switching', async () => {
    const renderer = await renderScreen();

    expect(getTextValues(renderer)).toContain('IP ADDRESS');
    expect(getTextValues(renderer)).not.toContain(
      'SELECTED BLUETOOTH DEVICE',
    );

    const bluetoothLabel = renderer.root
      .findAllByType(Text)
      .find(node => node.props.children === 'Bluetooth');
    let bluetoothButton = bluetoothLabel.parent;

    while (bluetoothButton && !bluetoothButton.props.onPress) {
      bluetoothButton = bluetoothButton.parent;
    }

    await act(async () => {
      bluetoothButton.props.onPress();
    });

    expect(getTextValues(renderer)).toContain('SELECTED BLUETOOTH DEVICE');
    expect(getTextValues(renderer)).toContain('Choose Bluetooth Printer');
    expect(getTextValues(renderer)).not.toContain('IP ADDRESS');
    expect(getTextValues(renderer)).not.toContain('PORT');

    await act(async () => renderer.unmount());
  });

  it('loads a saved Bluetooth printer by name and address', async () => {
    const saved = {
      id: 'primary_printer',
      name: 'Kitchen Printer',
      connectionType: 'bluetooth',
      protocol: 'escpos',
      bluetoothType: 'classic',
      deviceName: 'POS-80',
      deviceAddress: '00:11:22:33:44:55',
      paperWidth: 80,
      charactersPerLine: 48,
      autoCut: true,
      enabled: true,
    };

    PrinterManager.getPrinter.mockResolvedValue(saved);
    PrinterManager.normalizeConfig.mockReturnValue(saved);

    const renderer = await renderScreen();
    const textValues = getTextValues(renderer);

    expect(textValues).toContain('POS-80');
    expect(textValues).toContain('00:11:22:33:44:55');
    expect(textValues).not.toContain('IP ADDRESS');

    await act(async () => renderer.unmount());
  });
});
