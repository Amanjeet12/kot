import { useCallback, useEffect, useRef } from 'react';

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

const AutoPrintManager = () => {
  const { socket } = useSocket();
  const { printReceipt } = usePrinter();
  const queueRef = useRef([]);
  const processingRef = useRef(false);
  const receivedOrderIdsRef = useRef(new Set());
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
          devLog(`failed order ${id}: ${error?.message || 'unknown error'}`);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [printReceipt]);

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

  useEffect(() => {
    activeRef.current = true;

    return () => {
      activeRef.current = false;
      queueRef.current = [];
    };
  }, []);

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
