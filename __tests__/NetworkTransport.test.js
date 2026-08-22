import {Buffer} from 'buffer';

const mockSocket = {
  destroy: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
  setNoDelay: jest.fn(),
  write: jest.fn(),
};

let connectCallback;

let mockSocketHandlers;

jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn((options, callback) => {
    connectCallback = callback;

    mockSocketHandlers = {};

    mockSocket.on.mockImplementation((event, handler) => {
      mockSocketHandlers[event] = handler;

      return mockSocket;
    });

    return mockSocket;
  }),
}));

import NetworkTransport from '../src/services/printer/transports/NetworkTransport';

describe('NetworkTransport.send', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket.write.mockImplementation((data, encoding, callback) => {
      callback();

      return true;
    });
  });

  it('resolves only after the socket confirms the write', async () => {
    const resultPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('receipt'),
    );

    connectCallback();

    await expect(resultPromise).resolves.toMatchObject({success: true});
    expect(mockSocket.write).toHaveBeenCalledWith(
      expect.any(Buffer),
      undefined,
      expect.any(Function),
    );
    expect(mockSocket.end).toHaveBeenCalledTimes(1);
  });

  it('rejects a write error and destroys the socket', async () => {
    mockSocket.write.mockImplementation((data, encoding, callback) => {
      callback(new Error('Write failed'));

      return false;
    });

    const resultPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('receipt'),
    );

    connectCallback();

    await expect(resultPromise).rejects.toThrow('Write failed');
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });

  it('rejects a socket error and destroys the socket', async () => {
    const resultPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('receipt'),
    );

    mockSocketHandlers.error(new Error('Network unavailable'));

    await expect(resultPromise).rejects.toThrow('Network unavailable');
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });
});

describe('NetworkTransport.test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens a connection and destroys it after success', async () => {
    const resultPromise = NetworkTransport.test({
      host: '192.168.1.12',
      port: 9100,
    });

    connectCallback();

    await expect(resultPromise).resolves.toMatchObject({success: true});
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });

  it('times out and destroys the socket', async () => {
    jest.useFakeTimers();

    const resultPromise = NetworkTransport.test({
      host: '192.168.1.12',
      port: 9100,
    });

    jest.advanceTimersByTime(5000);

    await expect(resultPromise).rejects.toThrow('timed out');
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });
});
