import TcpSocket from 'react-native-tcp-socket';

const DEFAULT_TIMEOUT = 5000;

class NetworkTransport {
  validateConfig(config) {
    if (!config?.host) {
      throw new Error('Printer IP address is required.');
    }

    const port = Number(config?.port);

    if (!Number.isInteger(port) || port <= 0 || port > 65535) {
      throw new Error('Printer port is invalid.');
    }

    return true;
  }

  test(config) {
    this.validateConfig(config);

    return new Promise((resolve, reject) => {
      let socket = null;

      let finished = false;

      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);

          timeoutId = null;
        }

        try {
          socket?.destroy();
        } catch (error) {
          console.log('[NetworkPrinter] Cleanup:', error);
        }
      };

      const success = () => {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        resolve({
          success: true,
          message: 'Printer connection successful.',
        });
      };

      const failure = error => {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        reject(error instanceof Error ? error : new Error(String(error)));
      };

      try {
        timeoutId = setTimeout(() => {
          failure(new Error('Printer connection timed out.'));
        }, DEFAULT_TIMEOUT);

        socket = TcpSocket.createConnection(
          {
            host: config.host,

            port: Number(config.port),

            connectTimeout: DEFAULT_TIMEOUT,

            reuseAddress: true,

            /*
             * Android:
             * keep printer traffic on Wi-Fi.
             */
            interface: 'wifi',
          },

          () => {
            console.log(
              '[NetworkPrinter] Test connected:',
              `${config.host}:${config.port}`,
            );

            success();
          },
        );

        socket.on('error', error => {
          console.log('[NetworkPrinter] Test error:', error);

          failure(new Error(error?.message || 'Unable to connect to printer.'));
        });
      } catch (error) {
        failure(error);
      }
    });
  }

  send(config, data) {
    this.validateConfig(config);

    if (!data) {
      throw new Error('Printer data is empty.');
    }

    return new Promise((resolve, reject) => {
      let socket = null;

      let finished = false;

      let timeoutId = null;

      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);

          timeoutId = null;
        }

        try {
          socket?.destroy();
        } catch (error) {
          console.log('[NetworkPrinter] Cleanup:', error);
        }
      };

      const failure = error => {
        if (finished) {
          return;
        }

        finished = true;

        cleanup();

        reject(error instanceof Error ? error : new Error(String(error)));
      };

      const success = () => {
        if (finished) {
          return;
        }

        finished = true;

        if (timeoutId) {
          clearTimeout(timeoutId);

          timeoutId = null;
        }

        resolve({
          success: true,

          message: 'Receipt sent to printer.',
        });
      };

      try {
        timeoutId = setTimeout(() => {
          failure(new Error('Printer request timed out.'));
        }, DEFAULT_TIMEOUT);

        socket = TcpSocket.createConnection(
          {
            host: config.host,

            port: Number(config.port),

            connectTimeout: DEFAULT_TIMEOUT,

            reuseAddress: true,

            interface: 'wifi',
          },

          () => {
            console.log(
              '[NetworkPrinter] Connected:',
              `${config.host}:${config.port}`,
            );

            try {
              socket.setNoDelay(true);

              socket.write(data, undefined, error => {
                if (error) {
                  failure(error);

                  return;
                }

                socket.end();

                success();
              });
            } catch (error) {
              failure(error);
            }
          },
        );

        socket.on('error', error => {
          console.log('[NetworkPrinter] Error:', error);

          failure(
            new Error(error?.message || 'Unable to send data to printer.'),
          );
        });

        socket.on('close', hadError => {
          console.log('[NetworkPrinter] Closed:', hadError);
        });
      } catch (error) {
        failure(error);
      }
    });
  }
}

export default new NetworkTransport();
