import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { AppState } from 'react-native';

import PrinterManager from '../services/printer/PrinterManager';

export const PRINTER_STATUS = {
  NOT_CONFIGURED: 'not_configured',
  CHECKING: 'checking',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
};

const HEALTH_CHECK_INTERVAL = 30000;

const PrinterContext = createContext(null);

export const PrinterProvider = ({ children }) => {
  const [printer, setPrinter] = useState(null);

  const [status, setStatus] = useState(PRINTER_STATUS.NOT_CONFIGURED);

  const [lastCheckedAt, setLastCheckedAt] = useState(null);

  const [error, setError] = useState(null);

  const appStateRef = useRef(AppState.currentState);

  const checkingRef = useRef(false);

  const checkingDoneRef = useRef(null);

  const mountedRef = useRef(true);

  const printerRef = useRef(null);

  const printerRevisionRef = useRef(0);

  const operationRevisionRef = useRef(0);

  const updatePrinter = useCallback(nextPrinter => {
    printerRevisionRef.current += 1;

    printerRef.current = nextPrinter;

    if (mountedRef.current) {
      setPrinter(nextPrinter);
    }
  }, []);

  /*
   * ======================================================
   * LOAD SAVED PRINTER
   * ======================================================
   */

  const loadPrinter = useCallback(async () => {
    try {
      const savedPrinter = await PrinterManager.getPrinter();

      updatePrinter(savedPrinter);

      if (!mountedRef.current) {
        return savedPrinter;
      }

      if (!savedPrinter) {
        setStatus(PRINTER_STATUS.NOT_CONFIGURED);

        setError(null);

        return null;
      }

      return savedPrinter;
    } catch (loadError) {
      console.log('[PrinterContext] load printer:', loadError);

      updatePrinter(null);

      if (!mountedRef.current) {
        return null;
      }

      setStatus(PRINTER_STATUS.DISCONNECTED);

      setError(loadError);

      return null;
    }
  }, [updatePrinter]);

  /*
   * ======================================================
   * CHECK PRINTER CONNECTION
   * ======================================================
   */

  const checkConnection = useCallback(
    async (printerConfig = null, options = {}) => {
      const { silent = false, throwOnError = false } = options;

      /*
       * Avoid two health checks running simultaneously.
       */
      if (checkingRef.current) {
        if (printerConfig && checkingDoneRef.current) {
          await checkingDoneRef.current;

          return checkConnection(printerConfig, options);
        }

        return false;
      }

      checkingRef.current = true;

      const operationRevision = ++operationRevisionRef.current;

      let finishCheck;

      checkingDoneRef.current = new Promise(resolve => {
        finishCheck = resolve;
      });

      let printerRevision = printerRevisionRef.current;

      try {
        let currentPrinter = printerConfig || printerRef.current;

        /*
         * Context may not have loaded it yet.
         */
        if (!currentPrinter) {
          currentPrinter = await PrinterManager.getPrinter();

          updatePrinter(currentPrinter);
        }

        if (!mountedRef.current) {
          return false;
        }

        printerRevision = printerRevisionRef.current;

        if (!currentPrinter) {
          setStatus(PRINTER_STATUS.NOT_CONFIGURED);

          setError(null);

          return false;
        }

        if (!silent) {
          setStatus(PRINTER_STATUS.CHECKING);
        }

        await PrinterManager.testConnection(currentPrinter);

        if (
          !mountedRef.current ||
          printerRevision !== printerRevisionRef.current ||
          operationRevision !== operationRevisionRef.current
        ) {
          return false;
        }

        setStatus(PRINTER_STATUS.CONNECTED);

        setLastCheckedAt(new Date());

        setError(null);

        return true;
      } catch (connectionError) {
        console.log('[PrinterContext] connection failed:', connectionError);

        if (
          !mountedRef.current ||
          printerRevision !== printerRevisionRef.current ||
          operationRevision !== operationRevisionRef.current
        ) {
          return false;
        }

        setStatus(PRINTER_STATUS.DISCONNECTED);

        setLastCheckedAt(new Date());

        setError(connectionError);

        if (throwOnError) {
          throw connectionError;
        }

        return false;
      } finally {
        checkingRef.current = false;

        finishCheck?.();

        checkingDoneRef.current = null;
      }
    },
    [updatePrinter],
  );

  /*
   * ======================================================
   * RETRY
   * ======================================================
   */

  const retryConnection = useCallback(async () => {
    return checkConnection(null, {
      silent: false,
    });
  }, [checkConnection]);

  /*
   * ======================================================
   * REFRESH SAVED CONFIG
   *
   * Call this after:
   *
   * - saving printer
   * - editing printer
   * - removing printer
   * ======================================================
   */

  const refreshPrinter = useCallback(async () => {
    const savedPrinter = await loadPrinter();

    if (!savedPrinter) {
      return false;
    }

    return checkConnection(savedPrinter, {
      silent: false,
    });
  }, [loadPrinter, checkConnection]);

  const savePrinter = useCallback(
    async printerConfig => {
      const savedPrinter = await PrinterManager.savePrinter(printerConfig);

      updatePrinter(savedPrinter);

      await checkConnection(savedPrinter, { silent: false });

      return savedPrinter;
    },
    [checkConnection, updatePrinter],
  );

  const removePrinter = useCallback(async () => {
    await PrinterManager.removePrinter();

    operationRevisionRef.current += 1;

    updatePrinter(null);

    if (mountedRef.current) {
      setStatus(PRINTER_STATUS.NOT_CONFIGURED);
      setLastCheckedAt(null);
      setError(null);
    }

    return true;
  }, [updatePrinter]);

  /*
   * ======================================================
   * PRINT RECEIPT
   *
   * IMPORTANT:
   *
   * We DO NOT run testConnection first.
   *
   * PrinterManager.printReceipt()
   * itself creates the fresh TCP connection.
   * ======================================================
   */

  const printReceipt = useCallback(async order => {
    const operationRevision = ++operationRevisionRef.current;

    try {
      const result = await PrinterManager.printReceipt(order);

      if (!printerRef.current) {
        updatePrinter(await PrinterManager.getPrinter());
      }

      if (
        !mountedRef.current ||
        operationRevision !== operationRevisionRef.current
      ) {
        return result;
      }

      /*
       * Fresh TCP print succeeded.
       */
      setStatus(PRINTER_STATUS.CONNECTED);

      setLastCheckedAt(new Date());

      setError(null);

      return result;
    } catch (printError) {
      console.log('[PrinterContext] print failed:', printError);

      if (
        !mountedRef.current ||
        operationRevision !== operationRevisionRef.current
      ) {
        throw printError;
      }

      if (printError?.code === 'PRINTER_NOT_CONFIGURED') {
        updatePrinter(null);

        setStatus(PRINTER_STATUS.NOT_CONFIGURED);
      } else {
        setStatus(PRINTER_STATUS.DISCONNECTED);
      }

      setLastCheckedAt(new Date());

      setError(printError);

      throw printError;
    }
  }, [updatePrinter]);

  const printTestPage = useCallback(async printerConfig => {
    const operationRevision = ++operationRevisionRef.current;

    try {
      const result = await PrinterManager.printTestPage(printerConfig);

      if (
        mountedRef.current &&
        operationRevision === operationRevisionRef.current
      ) {
        setStatus(PRINTER_STATUS.CONNECTED);
        setLastCheckedAt(new Date());
        setError(null);
      }

      return result;
    } catch (printError) {
      if (
        mountedRef.current &&
        operationRevision === operationRevisionRef.current
      ) {
        setStatus(PRINTER_STATUS.DISCONNECTED);
        setLastCheckedAt(new Date());
        setError(printError);
      }

      throw printError;
    }
  }, []);

  /*
   * ======================================================
   * INITIAL APP START
   * ======================================================
   */

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const savedPrinter = await loadPrinter();

      if (!active || !savedPrinter) {
        return;
      }

      await checkConnection(savedPrinter);
    };

    initialize();

    return () => {
      active = false;
    };
  }, [checkConnection, loadPrinter]);

  /*
   * ======================================================
   * APP BACKGROUND -> FOREGROUND
   * ======================================================
   */

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      const previousState = appStateRef.current;

      appStateRef.current = nextState;

      /*
       * App comes back into foreground.
       */
      if (nextState === 'active' && previousState !== 'active') {
        checkConnection(null, {
          silent: true,
        });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkConnection]);

  /*
   * ======================================================
   * PERIODIC HEALTH CHECK
   * ======================================================
   */

  useEffect(() => {
    if (!printer) {
      return undefined;
    }

    const interval = setInterval(() => {
      /*
       * Don't run checks while application
       * is backgrounded.
       */
      if (appStateRef.current !== 'active') {
        return;
      }

      checkConnection(printer, {
        /*
         * Keep current UI state while doing
         * automatic background health checks.
         */
        silent: true,
      });
    }, HEALTH_CHECK_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [printer, checkConnection]);

  const value = {
    printer,

    status,

    error,

    lastCheckedAt,

    isChecking: status === PRINTER_STATUS.CHECKING,

    isConnected: status === PRINTER_STATUS.CONNECTED,

    isConfigured: Boolean(printer),

    checkConnection,

    retryConnection,

    refreshPrinter,

    savePrinter,

    removePrinter,

    printTestPage,

    printReceipt,
  };

  return (
    <PrinterContext.Provider value={value}>{children}</PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);

  if (!context) {
    throw new Error('usePrinter must be used inside PrinterProvider.');
  }

  return context;
};
