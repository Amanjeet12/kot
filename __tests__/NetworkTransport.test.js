import {Buffer} from 'buffer';

const mockSocket = {
  destroy: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
  setNoDelay: jest.fn(),
  write: jest.fn(),
};

let connectCallback;

jest.mock('react-native-tcp-socket', () => ({
  createConnection: jest.fn((options, callback) => {
    connectCallback = callback;

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
});
