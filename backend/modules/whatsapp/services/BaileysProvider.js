/**
 * BaileysProvider.js — WhatsApp connection manager
 *
 * Design rules (industry-grade):
 * 1. ONE socket per store. connectingStores guard prevents race conditions.
 * 2. 440 (Connection Replaced): STOP immediately. Clear session. User must reconnect via QR.
 *    No retry — retrying just starts an infinite fight with the competing session.
 * 3. 408 (QR timeout): STOP. Mark disconnected. Do NOT loop generating QRs nobody scans.
 * 4. loggedOut: Clear session. Stop.
 * 5. Genuine network drops: Retry up to 3 times with 5s/15s/30s backoff.
 * 6. Graceful shutdown: sockets end with "server-shutdown" reason → NOT treated as network drop.
 */

import { WhatsAppProvider } from "../interfaces/WhatsAppProvider.js";
import { useMultiFileAuthState, makeWASocket, DisconnectReason } from "@whiskeysockets/baileys";
import { sendSSEUpdate } from "../utils/sse.js";
import WhatsAppSession from "../models/WhatsAppSession.js";
import MedicalStore from "../../../models/MedicalStore.js";
import pino from "pino";
import fs from "fs";
import path from "path";
import qrcode from "qrcode";

export const activeSockets = new Map();       // storeIdStr -> socket
const qrCodes = new Map();                    // storeIdStr -> base64 QR data URL
const networkRetryCount = new Map();          // storeIdStr -> retry attempt number
const connectingStores = new Set();           // prevents duplicate concurrent connect() calls
const MAX_NETWORK_RETRIES = 3;

/**
 * Clear session: remove files, mark DB disconnected, notify frontend.
 */
async function clearSession(storeId, storeIdStr, sessionFolder, notify = true) {
  activeSockets.delete(storeIdStr);
  qrCodes.delete(storeIdStr);
  networkRetryCount.delete(storeIdStr);
  connectingStores.delete(storeIdStr);

  try {
    if (fs.existsSync(sessionFolder)) {
      fs.rmSync(sessionFolder, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`[Baileys] Failed to delete session folder for store ${storeIdStr}:`, err.message);
  }

  try {
    await WhatsAppSession.findOneAndUpdate(
      { storeId },
      { connected: false, phoneNumber: "", displayName: "" },
      { upsert: true }
    );
    const store = await MedicalStore.findById(storeId);
    if (store?.whatsappConfig) {
      store.whatsappConfig.connected = false;
      store.whatsappConfig.connectionStatus = "DISCONNECTED";
      store.whatsappConfig.isEnabled = false;
      store.whatsappConfig.businessPhone = "";
      store.whatsappConfig.businessName = "";
      await store.save();
    }
  } catch (err) {
    console.error(`[Baileys] DB update failed in clearSession for store ${storeIdStr}:`, err.message);
  }

  if (notify) {
    sendSSEUpdate(storeIdStr, "status", { state: "Disconnected" });
  }
}

export class BaileysProvider extends WhatsAppProvider {

  async connect(storeId, forceFresh = false) {
    const storeIdStr = storeId.toString();
    const sessionFolder = path.join(
      process.cwd(), "modules/whatsapp/sessions", `store_${storeIdStr}`
    );

    // Already connected — just refresh SSE status
    if (activeSockets.has(storeIdStr) && !forceFresh) {
      console.log(`[Baileys] Socket already active for store ${storeIdStr}. Skipping.`);
      const session = await WhatsAppSession.findOne({ storeId });
      if (session?.connected) {
        sendSSEUpdate(storeIdStr, "status", {
          state: "Connected",
          phone: session.phoneNumber,
          name: session.displayName,
          connectedAt: session.connectedAt,
        });
      }
      return;
    }

    // Prevent two concurrent connect() calls
    if (connectingStores.has(storeIdStr) && !forceFresh) {
      console.log(`[Baileys] Connection already in progress for store ${storeIdStr}. Skipping.`);
      return;
    }

    // Force fresh: wipe existing socket and session files
    if (forceFresh) {
      console.log(`[Baileys] Force-fresh for store ${storeIdStr}. Wiping session files.`);
      if (activeSockets.has(storeIdStr)) {
        try {
          const old = activeSockets.get(storeIdStr);
          old.ev.removeAllListeners();
          old.end(new Error("force-fresh"));
        } catch (_) {}
        activeSockets.delete(storeIdStr);
      }
      try {
        if (fs.existsSync(sessionFolder)) {
          fs.rmSync(sessionFolder, { recursive: true, force: true });
        }
      } catch (err) {
        console.error(`[Baileys] Failed to wipe session folder:`, err.message);
      }
      networkRetryCount.delete(storeIdStr);
      qrCodes.delete(storeIdStr);
    }

    if (!fs.existsSync(sessionFolder)) {
      fs.mkdirSync(sessionFolder, { recursive: true });
    }

    connectingStores.add(storeIdStr);
    console.log(`[Baileys] Connecting store: ${storeIdStr}`);
    sendSSEUpdate(storeIdStr, "status", { state: "Connecting" });

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

      const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        fireInitQueries: false,
        connectTimeoutMs: 20000,
        defaultQueryTimeoutMs: 15000,
      });

      activeSockets.set(storeIdStr, sock);
      connectingStores.delete(storeIdStr);

      sock.ev.on("creds.update", () => {
        saveCreds().catch((err) => {
          console.error(`[Baileys] Failed to save credentials for store ${storeIdStr}:`, err);
        });
      });

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await qrcode.toDataURL(qr);
            qrCodes.set(storeIdStr, qrDataUrl);
            sendSSEUpdate(storeIdStr, "qr", { qr: qrDataUrl });
            sendSSEUpdate(storeIdStr, "status", { state: "QR_Generated" });
            console.log(`[Baileys] QR code generated for store ${storeIdStr}`);
          } catch (err) {
            console.error(`[Baileys] QR render failed:`, err.message);
          }
        }

        if (connection === "open") {
          qrCodes.delete(storeIdStr);
          networkRetryCount.delete(storeIdStr);

          const jid = sock.user?.id || "";
          const phone = jid.split(":")[0] || jid.split("@")[0];
          const name = sock.user?.name || "WhatsApp Business";

          console.log(`[Baileys] CONNECTED: store ${storeIdStr} | ${phone}`);

          try {
            await WhatsAppSession.findOneAndUpdate(
              { storeId },
              {
                connected: true,
                phoneNumber: phone,
                displayName: name,
                sessionPath: sessionFolder,
                connectedAt: new Date(),
                lastSeen: new Date(),
              },
              { upsert: true, new: true }
            );

            const store = await MedicalStore.findById(storeId);
            if (store) {
              store.whatsappConfig = {
                ...store.whatsappConfig,
                connected: true,
                businessName: name,
                businessPhone: phone,
                connectedAt: new Date(),
                connectionStatus: "CONNECTED",
                isEnabled: true,
              };
              await store.save();
            }
          } catch (err) {
            console.error(`[Baileys] DB update failed on open:`, err.message);
          }

          sendSSEUpdate(storeIdStr, "status", {
            state: "Connected",
            phone,
            name,
            connectedAt: new Date(),
          });
        }

        if (connection === "close") {
          activeSockets.delete(storeIdStr);
          qrCodes.delete(storeIdStr);

          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const reason = lastDisconnect?.error?.message || "";
          console.log(`[Baileys] Connection closed: store ${storeIdStr} | code ${statusCode} | reason: ${reason}`);

          // Intentional shutdown — do not reconnect
          if (reason === "server-shutdown" || reason === "user-disconnect" || reason === "force-fresh") {
            return;
          }

          // 440 = Connection Replaced by another session.
          // NEVER auto-reconnect on 440 — it creates an infinite loop.
          // User must go to Phone > WhatsApp > Linked Devices > remove old entries > reconnect via QR.
          if (statusCode === DisconnectReason.connectionReplaced || statusCode === 440) {
            console.log(`[Baileys] 440: store ${storeIdStr} session was replaced. Clearing. User must reconnect via UI.`);
            await clearSession(storeId, storeIdStr, sessionFolder, true);
            return;
          }

          // 408 = QR code expired (nobody scanned it).
          // NEVER loop back to generate another QR — nobody is there to scan it.
          // Mark disconnected. User must open the UI and click Connect.
          if (statusCode === 408 || reason.includes("QR refs")) {
            console.log(`[Baileys] 408: QR timed out for store ${storeIdStr}. Marking disconnected. User must reconnect via UI.`);
            networkRetryCount.delete(storeIdStr);
            sendSSEUpdate(storeIdStr, "status", { state: "Disconnected" });
            try {
              await WhatsAppSession.findOneAndUpdate({ storeId }, { connected: false }, { upsert: true });
              const store = await MedicalStore.findById(storeId);
              if (store?.whatsappConfig) {
                store.whatsappConfig.connected = false;
                store.whatsappConfig.connectionStatus = "DISCONNECTED";
                await store.save();
              }
            } catch (_) {}
            return;
          }

          // loggedOut: user removed this device from phone
          if (statusCode === DisconnectReason.loggedOut) {
            console.log(`[Baileys] Logged out for store ${storeIdStr}. Clearing session.`);
            await clearSession(storeId, storeIdStr, sessionFolder, true);
            return;
          }

          // Genuine network drop: retry up to MAX_NETWORK_RETRIES times
          const attempt = (networkRetryCount.get(storeIdStr) || 0) + 1;
          networkRetryCount.set(storeIdStr, attempt);

          if (attempt > MAX_NETWORK_RETRIES) {
            console.error(`[Baileys] Store ${storeIdStr} exceeded max retries. Marking disconnected.`);
            networkRetryCount.delete(storeIdStr);
            sendSSEUpdate(storeIdStr, "status", { state: "Disconnected" });
            try {
              await WhatsAppSession.findOneAndUpdate({ storeId }, { connected: false }, { upsert: true });
            } catch (_) {}
            return;
          }

          const delays = [5000, 15000, 30000];
          const delay = delays[Math.min(attempt - 1, delays.length - 1)];
          console.log(`[Baileys] Network drop. Retry #${attempt}/${MAX_NETWORK_RETRIES} in ${delay}ms...`);
          sendSSEUpdate(storeIdStr, "status", { state: "Connection_Lost" });

          setTimeout(() => {
            if (!activeSockets.has(storeIdStr) && !connectingStores.has(storeIdStr)) {
              this.connect(storeId, false).catch((err) => {
                console.error(`[Baileys] Auto-reconnect failed:`, err.message);
              });
            }
          }, delay);
        }
      });

    } catch (err) {
      connectingStores.delete(storeIdStr);
      console.error(`[Baileys] Init error for store ${storeIdStr}:`, err.message);
      sendSSEUpdate(storeIdStr, "status", { state: "Disconnected", error: err.message });
      throw err;
    }
  }

  async disconnect(storeId) {
    const storeIdStr = storeId.toString();
    const sessionFolder = path.join(
      process.cwd(), "modules/whatsapp/sessions", `store_${storeIdStr}`
    );
    connectingStores.delete(storeIdStr);

    if (activeSockets.has(storeIdStr)) {
      try {
        const sock = activeSockets.get(storeIdStr);
        sock.ev.removeAllListeners();
        sock.end(new Error("user-disconnect"));
      } catch (_) {}
    }

    await clearSession(storeId, storeIdStr, sessionFolder, true);
    console.log(`[Baileys] Manual disconnect for store ${storeIdStr}`);
  }

  async sendMessage(storeId, phone, message) {
    const storeIdStr = storeId.toString();
    const sock = activeSockets.get(storeIdStr);
    if (!sock) throw new Error(`WhatsApp not connected for store ${storeIdStr}`);
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.endsWith("@s.whatsapp.net")) cleaned += "@s.whatsapp.net";
    await sock.sendMessage(cleaned, { text: message });
  }

  async sendDocument(storeId, phone, fileBuffer, fileName, caption = "") {
    const storeIdStr = storeId.toString();
    const sock = activeSockets.get(storeIdStr);
    if (!sock) throw new Error(`WhatsApp not connected for store ${storeIdStr}`);
    let cleaned = phone.replace(/\D/g, "");
    if (!cleaned.endsWith("@s.whatsapp.net")) cleaned += "@s.whatsapp.net";
    await sock.sendMessage(cleaned, {
      document: fileBuffer,
      mimetype: "application/pdf",
      fileName,
      caption,
    });
  }

  async getStatus(storeId) {
    const storeIdStr = storeId.toString();
    const session = await WhatsAppSession.findOne({ storeId });
    if (!session || !session.connected) {
      return { connected: false, status: "DISCONNECTED" };
    }
    const hasActiveSocket = activeSockets.has(storeIdStr);
    return {
      connected: session.connected,
      status: hasActiveSocket ? "CONNECTED" : "CONNECTING",
      phoneNumber: session.phoneNumber,
      displayName: session.displayName,
      connectedAt: session.connectedAt,
    };
  }

  getQR(storeId) {
    return qrCodes.get(storeId.toString()) || null;
  }

  async cleanupAll() {
    console.log(`[Baileys] Cleaning up ${activeSockets.size} active sockets...`);
    for (const [storeIdStr, sock] of activeSockets.entries()) {
      try {
        sock.ev.removeAllListeners();
        sock.end(new Error("server-shutdown"));
        console.log(`[Baileys] Closing socket cleanly for store: ${storeIdStr}`);
      } catch (_) {}
    }
    activeSockets.clear();
    connectingStores.clear();
    networkRetryCount.clear();
    qrCodes.clear();
    console.log("[Baileys] All sockets closed and cleanup complete.");
  }
}

export const baileysProviderInstance = new BaileysProvider();
