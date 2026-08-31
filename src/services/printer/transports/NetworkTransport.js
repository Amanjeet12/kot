import TcpSocket from 'react-native-tcp-socket';
import {Platform} from 'react-native';

const DEFAULT_TIMEOUT = 5000;

const elapsed = startedAt => `${Date.now() - startedAt}ms`;

class NetworkTransport {
  getConnectionOptions(config) {
    return {
      host: config.host,
      port: Number(config.port),
      connectTimeout: DEFAULT_TIMEOUT,
      reuseAddress: true,
      ...(Platform.OS === 'android' ? {interface: 'wifi'} : {}),
    };
  }

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

    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      let socket = null;
      let finished = false;
      let ending = false;
      let timeoutId = null;

      const clearDeadline = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const destroy = () => {
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
        clearDeadline();
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
        clearDeadline();
        destroy();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      try {
        timeoutId = setTimeout(() => {
          failure(new Error('Printer connection timed out.'));
        }, DEFAULT_TIMEOUT);

        socket = TcpSocket.createConnection(
          this.getConnectionOptions(config),
          () => {
            console.log(
              '[NetworkPrinter] Test connected:',
              `${config.host}:${config.port}`,
              elapsed(startedAt),
            );

            // Resolve only after native close so an immediate print cannot
            // overlap teardown from this connection-only health check.
            ending = true;
            console.log('[NetworkPrinter] Test shutdown started:', elapsed(startedAt));
            socket.end();
          },
        );

        socket.on('error', error => {
          console.log('[NetworkPrinter] Test error:', error);
          failure(new Error(error?.message || 'Unable to connect to printer.'));
        });

        socket.on('close', hadError => {
          console.log(
            '[NetworkPrinter] Test closed:',
            hadError,
            elapsed(startedAt),
          );

          if (finished) {
            return;
          }

          if (ending && !hadError) {
            success();
          } else {
            failure(new Error('Printer connection closed unexpectedly.'));
          }
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

    const startedAt = Date.now();

    return new Promise((resolve, reject) => {
      let socket = null;
      let finished = false;
      let ending = false;
      let timeoutId = null;

      const clearDeadline = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      };

      const destroy = () => {
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
        clearDeadline();
        resolve({
          success: true,
          message: 'Receipt sent to printer.',
        });
      };

      const failure = error => {
        if (finished) {
          return;
        }

        finished = true;
        clearDeadline();
        destroy();
        reject(error instanceof Error ? error : new Error(String(error)));
      };

      try {
        timeoutId = setTimeout(() => {
          failure(new Error('Printer request timed out.'));
        }, DEFAULT_TIMEOUT);

        socket = TcpSocket.createConnection(
          this.getConnectionOptions(config),
          () => {
            console.log(
              '[NetworkPrinter] Connected:',
              `${config.host}:${config.port}`,
              elapsed(startedAt),
            );

            try {
              socket.setNoDelay(true);
              console.log('[NetworkPrinter] Write started:', elapsed(startedAt));

              socket.write(data, undefined, error => {
                try {
                  if (error) {
                    failure(error);
                    return;
                  }

                  console.log(
                    '[NetworkPrinter] Write completed:',
                    elapsed(startedAt),
                  );

                  // The callback confirms the native OutputStream write, not
                  // physical paper output. Close gracefully and wait for the
                  // native close event before reporting success.
                  ending = true;
                  console.log(
                    '[NetworkPrinter] Shutdown started:',
                    elapsed(startedAt),
                  );
                  socket.end();
                } catch (writeError) {
                  failure(writeError);
                }
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
          console.log(
            '[NetworkPrinter] Closed:',
            hadError,
            elapsed(startedAt),
          );

          if (finished) {
            return;
          }

          if (ending && !hadError) {
            success();
          } else {
            failure(new Error('Printer connection closed before completion.'));
          }
        });
      } catch (error) {
        failure(error);
      }
    });
  }
}

export default new NetworkTransport();
