import { baileysProviderInstance } from "./BaileysProvider.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import path from "path";
import fs from "fs";
import MedicalStore from "../../../models/MedicalStore.js";

const provider = baileysProviderInstance;

export const WhatsappService = {

  async connectStore(storeId) {
    await provider.connect(storeId, false);
  },

  async disconnectStore(storeId) {
    await provider.disconnect(storeId);
  },

  async reconnectStore(storeId) {
    await provider.connect(storeId, true);
  },

  async sendMessage(storeId, phone, message) {
    return await provider.sendMessage(storeId, phone, message);
  },

  async sendDocument(storeId, phone, fileBuffer, fileName, caption) {
    return await provider.sendDocument(storeId, phone, fileBuffer, fileName, caption);
  },

  async isConnected(storeId) {
    const status = await provider.getStatus(storeId);
    return status.connected;
  },

  async getStatus(storeId) {
    return await provider.getStatus(storeId);
  },

  getQR(storeId) {
    return provider.getQR(storeId);
  },

  /**
   * Called on server boot. Restores sessions that have valid credential files.
   * If credentials are missing (wiped/corrupted), marks DB disconnected immediately
   * instead of generating a QR that nobody scans → prevents the 408 loop.
   */
  async loadExistingSessions() {
    console.log("[WhatsappService] Checking sessions to restore on boot...");
    try {
      const activeSessions = await WhatsAppSession.find({ connected: true });

      if (activeSessions.length === 0) {
        console.log("[WhatsappService] No active sessions to restore.");
        return;
      }

      for (const session of activeSessions) {
        const storeIdStr = session.storeId.toString();
        const sessionFolder = path.join(
          process.cwd(), "modules/whatsapp/sessions", `store_${storeIdStr}`
        );
        const credsFile = path.join(sessionFolder, "creds.json");

        if (!fs.existsSync(credsFile)) {
          // Credentials wiped — don't auto-generate QR. Mark disconnected and wait for user.
          console.log(`[WhatsappService] No creds.json for store ${storeIdStr}. Marking disconnected — user must reconnect via UI.`);
          await WhatsAppSession.findOneAndUpdate(
            { storeId: session.storeId },
            { connected: false, phoneNumber: "", displayName: "" }
          );
          const store = await MedicalStore.findById(session.storeId);
          if (store?.whatsappConfig) {
            store.whatsappConfig.connected = false;
            store.whatsappConfig.connectionStatus = "DISCONNECTED";
            store.whatsappConfig.isEnabled = false;
            await store.save();
          }
          continue;
        }

        console.log(`[WhatsappService] Restoring session for store ${storeIdStr}`);
        provider.connect(session.storeId, false).catch((err) => {
          console.error(`[WhatsappService] Failed to restore store ${storeIdStr}:`, err.message);
        });
      }
    } catch (err) {
      console.error("[WhatsappService] Boot restore error:", err);
    }
  },

  async cleanup() {
    await provider.cleanupAll();
  }
};
