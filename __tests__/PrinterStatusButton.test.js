import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import ReactTestRenderer, { act } from 'react-test-renderer';

const mockNavigate = jest.fn();
const mockRetryConnection = jest.fn();
const mockToastShow = jest.fn();

let mockPrinterContext;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: { show: (...args) => mockToastShow(...args) },
}));

jest.mock('../src/contexts/PrinterContext', () => ({
  PRINTER_STATUS: {
    NOT_CONFIGURED: 'not_configured',
    CHECKING: 'checking',
    CONNECTED: 'connected',
    DISCONNECTED: 'disconnected',
  },
  usePrinter: () => mockPrinterContext,
}));

import PrinterStatusButton, {
  getPrinterRetryErrorMessage,
} from '../src/components/printer/PrinterStatusButton';

const renderButton = async () => {
  let renderer;

  await act(async () => {
    renderer = ReactTestRenderer.create(<PrinterStatusButton />);
  });

  return renderer;
};

describe('PrinterStatusButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRetryConnection.mockResolvedValue(true);
    mockPrinterContext = {
      isChecking: false,
      retryConnection: mockRetryConnection,
      status: 'disconnected',
    };
  });

  it('retries a disconnected saved printer once', async () => {
    const renderer = await renderButton();

    await act(async () => {
      await renderer.root.findByType(TouchableOpacity).props.onPress();
    });

    expect(mockRetryConnection).toHaveBeenCalledTimes(1);
    expect(mockRetryConnection).toHaveBeenCalledWith({ throwOnError: true });
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockToastShow).not.toHaveBeenCalled();
  });

  it('is disabled and ignores duplicate taps while checking', async () => {
    mockPrinterContext = {
      isChecking: true,
      retryConnection: mockRetryConnection,
      status: 'checking',
    };
    const renderer = await renderButton();
    const button = renderer.root.findByType(TouchableOpacity);

    expect(button.props.disabled).toBe(true);
    expect(renderer.root.findByType(ActivityIndicator)).toBeTruthy();
    expect(
      renderer.root.findAllByType(Text).some(node =>
        node.props.children.includes('Checking Printer'),
      ),
    ).toBe(true);

    await act(async () => {
      await button.props.onPress();
    });

    expect(mockRetryConnection).not.toHaveBeenCalled();
  });

  it('shows an operator-friendly message when USB permission is denied', async () => {
    mockRetryConnection.mockRejectedValue(
      Object.assign(new Error('Native permission rejection'), {
        code: 'USB_PERMISSION_DENIED',
      }),
    );
    const renderer = await renderButton();

    await act(async () => {
      await renderer.root.findByType(TouchableOpacity).props.onPress();
    });

    expect(mockToastShow).toHaveBeenCalledWith({
      type: 'error',
      text1: 'Printer connection failed',
      text2: 'USB permission is required to connect the printer.',
      position: 'top',
    });
  });

  it('opens settings only when no printer is configured', async () => {
    mockPrinterContext = {
      isChecking: false,
      retryConnection: mockRetryConnection,
      status: 'not_configured',
    };
    const renderer = await renderButton();

    await act(async () => {
      await renderer.root.findByType(TouchableOpacity).props.onPress();
    });

    expect(mockNavigate).toHaveBeenCalledWith('Profile', {
      screen: 'PrinterSettingsScreen',
    });
    expect(mockRetryConnection).not.toHaveBeenCalled();
  });

  it.each([
    ['USB_DEVICE_NOT_FOUND', 'USB printer is not connected.'],
    ['USB_PERMISSION_REQUIRED', 'USB printer permission is required.'],
    [
      'USB_PERMISSION_TIMEOUT',
      'USB permission request timed out. Try again.',
    ],
    ['USB_OPEN_FAILED', 'Unable to connect to the USB printer.'],
    ['USB_CLAIM_FAILED', 'Unable to connect to the USB printer.'],
  ])('maps %s to a safe operator message', (code, message) => {
    expect(getPrinterRetryErrorMessage({ code })).toBe(message);
  });
});
