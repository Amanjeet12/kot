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

  afterEach(() => {
    jest.useRealTimers();
  });

  it('resolves only after the write and graceful socket close complete', async () => {
    const resultPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('receipt'),
    );

    connectCallback();

    let resolved = false;
    resultPromise.then(() => {
      resolved = true;
    });
    await Promise.resolve();

    expect(resolved).toBe(false);
    expect(mockSocket.end).toHaveBeenCalledTimes(1);
    expect(mockSocket.destroy).not.toHaveBeenCalled();

    mockSocketHandlers.close(false);

    await expect(resultPromise).resolves.toMatchObject({success: true});
    expect(mockSocket.write).toHaveBeenCalledWith(
      expect.any(Buffer),
      undefined,
      expect.any(Function),
    );
    expect(mockSocket.destroy).not.toHaveBeenCalled();
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

  it('times out and destroys the socket', async () => {
    jest.useFakeTimers();

    const resultPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('receipt'),
    );

    jest.advanceTimersByTime(5000);

    await expect(resultPromise).rejects.toThrow('timed out');
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });

  it('finishes connection-test cleanup before the first print starts', async () => {
    const testPromise = NetworkTransport.test({
      host: '192.168.1.12',
      port: 9100,
    });

    connectCallback();
    expect(mockSocket.end).toHaveBeenCalledTimes(1);
    expect(mockSocket.write).not.toHaveBeenCalled();

    let testResolved = false;
    testPromise.then(() => {
      testResolved = true;
    });
    await Promise.resolve();
    expect(testResolved).toBe(false);

    mockSocketHandlers.close(false);
    await testPromise;

    const printPromise = NetworkTransport.send(
      {host: '192.168.1.12', port: 9100},
      Buffer.from('test receipt'),
    );
    connectCallback();
    mockSocketHandlers.close(false);

    await expect(printPromise).resolves.toMatchObject({success: true});
    expect(mockSocket.write).toHaveBeenCalledTimes(1);
    expect(mockSocket.destroy).not.toHaveBeenCalled();
  });
});

describe('NetworkTransport.test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens a connection and resolves only after graceful close', async () => {
    const resultPromise = NetworkTransport.test({
      host: '192.168.1.12',
      port: 9100,
    });

    connectCallback();

    let resolved = false;
    resultPromise.then(() => {
      resolved = true;
    });
    await Promise.resolve();

    expect(resolved).toBe(false);
    expect(mockSocket.end).toHaveBeenCalledTimes(1);
    expect(mockSocket.destroy).not.toHaveBeenCalled();

    mockSocketHandlers.close(false);

    await expect(resultPromise).resolves.toMatchObject({success: true});
    expect(mockSocket.destroy).not.toHaveBeenCalled();
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

  it('rejects a connection error and destroys the socket', async () => {
    const resultPromise = NetworkTransport.test({
      host: '192.168.1.12',
      port: 9100,
    });

    mockSocketHandlers.error(new Error('Connection refused'));

    await expect(resultPromise).rejects.toThrow('Connection refused');
    expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
  });
});
