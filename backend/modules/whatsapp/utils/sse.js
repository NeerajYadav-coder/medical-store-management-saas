/**
 * modules/whatsapp/utils/sse.js
 *
 * Real-time event propagation via Server-Sent Events (SSE).
 * Handles pushing QR codes, connection progress, and connection state updates to active clients.
 */

const clients = new Map(); // storeId (string) -> Array of Response objects

/**
 * Register a client's response channel for SSE updates.
 * @param {string} storeId
 * @param {object} res
 */
export const registerClient = (storeId, res) => {
  if (!clients.has(storeId)) {
    clients.set(storeId, []);
  }
  clients.get(storeId).push(res);
  console.log(`[SSE] Client registered for store: ${storeId}. Active clients: ${clients.get(storeId).length}`);
};

/**
 * Unregister a client's response channel.
 * @param {string} storeId
 * @param {object} res
 */
export const unregisterClient = (storeId, res) => {
  if (!clients.has(storeId)) return;
  const list = clients.get(storeId);
  const updated = list.filter((c) => c !== res);
  if (updated.length === 0) {
    clients.delete(storeId);
    console.log(`[SSE] All clients unregistered for store: ${storeId}`);
  } else {
    clients.set(storeId, updated);
    console.log(`[SSE] Client unregistered for store: ${storeId}. Active clients: ${updated.length}`);
  }
};

/**
 * Push an SSE payload event to all registered clients for a store.
 * @param {string} storeId
 * @param {string} event
 * @param {object} data
 */
export const sendSSEUpdate = (storeId, event, data) => {
  const list = clients.get(storeId) || [];
  if (list.length === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  list.forEach((res) => {
    try {
      res.write(payload);
    } catch (err) {
      console.error(`[SSE] Failed writing to client for store ${storeId}:`, err);
    }
  });
};
