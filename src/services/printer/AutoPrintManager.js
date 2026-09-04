import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

import {
  getUnprintedReceipts,
  markReceiptPrinted,
} from '../../api/orderApi';
import { normalizeOrderStatus } from '../../constant/orderStatus';
import { usePrinter } from '../../contexts/PrinterContext';
import { useSocket } from '../../contexts/SocketContext';
import { mapTuckShopOrder } from '../../utils/orderMapper';

export const AUTO_PRINT_EVENT = 'tuck_shop_order_created';

const devLog = message => {
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    console.log(`[AutoPrint] ${message}`);
  }
};

export const getSocketOrder = payload => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  if (payload.tuck_shop_order_id || payload.tuckShopOrderId) {
    return payload;
  }

  if (payload.order && typeof payload.order === 'object') {
    return getSocketOrder(payload.order);
  }

  if (payload.data && typeof payload.data === 'object') {
    return getSocketOrder(payload.data);
  }

  if (
    payload.id &&
    (payload.status !== undefined || Array.isArray(payload.items))
  ) {
    return payload;
  }

  return null;
};

export const getCanonicalOrderId = order => {
  const id =
    order?.tuck_shop_order_id ??
    order?.tuckShopOrderId ??
    order?.orderNumber ??
    order?.id;

  return id === null || id === undefined || String(id).trim() === ''
    ? null
    : String(id);
};

export const getPrintableSocketOrder = payload => {
  const socketOrder = getSocketOrder(payload);

  if (!socketOrder || !getCanonicalOrderId(socketOrder)) {
    return null;
  }

  if (normalizeOrderStatus(socketOrder.status) !== 'confirmed') {
    return null;
  }

  // There is no order-detail endpoint in this client. An ID-only event is not
  // printable, so require the item data used by the existing receipt path.
  if (!Array.isArray(socketOrder.items)) {
    return null;
  }

  return socketOrder.tuck_shop_order_id
    ? mapTuckShopOrder(socketOrder)
    : socketOrder;
};

export const getPrintableRecoveryOrder = order => {
  if (!order || typeof order !== 'object' || !getCanonicalOrderId(order)) {
    return null;
  }

  const receiptPrinted = order.receipt_printed ?? order.receiptPrinted;

  if (
    receiptPrinted === true ||
    receiptPrinted === 1 ||
    receiptPrinted === '1' ||
    receiptPrinted === 'true'
  ) {
    return null;
  }

  return mapTuckShopOrder(order);
};

const reportFailure = (type, id, error) => {
  console.warn(
    `[AutoPrint] ${type} order ${id}: ${
      error?.message || 'unknown error'
    }`,
  );
};

const AutoPrintManager = ({ token, isAuthenticated }) => {
  const { socket, isSocketConnected } = useSocket();
  const { printReceipt } = usePrinter();
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const receivedOrderIdsRef = useRef(new Set());
  const recoveryRunningRef = useRef(false);
  const activeRef = useRef(true);

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;

    try {
      while (activeRef.current && queueRef.current.length > 0) {
        const { id, order } = queueRef.current.shift();

        devLog(`printing order ${id}`);

        try {
          // One queue item gets exactly one logical print attempt. A transport
          // error is reported and never retried automatically.
          await printReceipt(order);
          devLog(`printed order ${id}`);
        } catch (error) {
          reportFailure('PRINT_FAILED', id, error);
          continue;
        }

        try {
          await markReceiptPrinted({
            token,
            tuckShopOrderId:
              order.tuckShopOrderId ?? order.tuck_shop_order_id ?? id,
          });
          devLog(`marked order ${id} as printed`);
        } catch (error) {
          // The physical print already succeeded. Reporting this separately is
          // intentional: a backend acknowledgement failure must never resend.
          reportFailure('MARK_PRINTED_FAILED', id, error);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [printReceipt, token]);

  const enqueue = useCallback(
    order => {
      const id = getCanonicalOrderId(order);

      if (!id) {
        return;
      }

      if (receivedOrderIdsRef.current.has(id)) {
        devLog(`skipped duplicate order ${id}`);
        return;
      }

      // Mark synchronously before queue processing yields, closing the window
      // in which two back-to-back socket callbacks could enqueue the same ID.
      receivedOrderIdsRef.current.add(id);
      queueRef.current.push({ id, order });
      devLog(`queued order ${id}`);
      processQueue();
    },
    [processQueue],
  );

  const recoverUnprintedReceipts = useCallback(async () => {
    if (
      !activeRef.current ||
      !isAuthenticated ||
      !token ||
      recoveryRunningRef.current
    ) {
      return;
    }

    recoveryRunningRef.current = true;

    try {
      const response = await getUnprintedReceipts({ token });

      if (!activeRef.current) {
        return;
      }

      const orders = Array.isArray(response?.data) ? response.data : [];

      // Preserve backend order so older receipts remain ahead when that is the
      // ordering supplied by the recovery endpoint.
      orders.forEach(rawOrder => {
        const order = getPrintableRecoveryOrder(rawOrder);

        if (order) {
          enqueue(order);
        }
      });
    } catch (error) {
      reportFailure('RECOVERY_FETCH_FAILED', 'request', error);
    } finally {
      recoveryRunningRef.current = false;
    }
  }, [enqueue, isAuthenticated, token]);

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
      queueRef.current = [];
    };
  }, []);

  useEffect(() => {
    recoverUnprintedReceipts();
  }, [recoverUnprintedReceipts]);

  useEffect(() => {
    if (isSocketConnected) {
      recoverUnprintedReceipts();
    }
  }, [isSocketConnected, recoverUnprintedReceipts]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        recoverUnprintedReceipts();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [recoverUnprintedReceipts]);

  useEffect(() => {
    if (!socket) {
      return undefined;
    }

    const handleOrderCreated = payload => {
      const socketOrder = getSocketOrder(payload);
      const id = getCanonicalOrderId(socketOrder);

      devLog(`received order ${id || 'without an ID'}`);

      const printableOrder = getPrintableSocketOrder(payload);

      if (!printableOrder) {
        devLog(
          `skipped order ${
            id || 'without an ID'
          }: payload is not a complete confirmed order`,
        );
        return;
      }

      enqueue(printableOrder);
    };

    socket.on(AUTO_PRINT_EVENT, handleOrderCreated);

    return () => {
      socket.off(AUTO_PRINT_EVENT, handleOrderCreated);
    };
  }, [enqueue, socket]);

  return null;
};

export default AutoPrintManager;
