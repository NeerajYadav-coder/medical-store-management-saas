/**
 * WhatsAppProvider
 *
 * Abstract provider interface.
 * Any WhatsApp engine (Baileys, Meta Cloud API, Twilio, etc.) must implement this.
 */
export class WhatsAppProvider {
  /**
   * Initialize a connection session for a given tenant store.
   * @param {string|ObjectId} storeId
   * @returns {Promise<void>}
   */
  async connect(storeId) {
    throw new Error("Method 'connect' must be implemented");
  }

  /**
   * Terminate/disconnect session for a given store.
   * @param {string|ObjectId} storeId
   * @returns {Promise<void>}
   */
  async disconnect(storeId) {
    throw new Error("Method 'disconnect' must be implemented");
  }

  /**
   * Send WhatsApp text message using store session.
   * @param {string|ObjectId} storeId
   * @param {string} phone
   * @param {string} message
   * @returns {Promise<void>}
   */
  async sendMessage(storeId, phone, message) {
    throw new Error("Method 'sendMessage' must be implemented");
  }

  /**
   * Retrieve active connection status state.
   * @param {string|ObjectId} storeId
   * @returns {Promise<object>}
   */
  async getStatus(storeId) {
    throw new Error("Method 'getStatus' must be implemented");
  }
}
