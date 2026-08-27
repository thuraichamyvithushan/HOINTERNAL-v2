import firebase, { firestore, messaging } from "../firebase";

const TOKEN_STORAGE_KEY = "chat_push_notification_token";
const USER_STORAGE_KEY = "chat_push_notification_user";
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || "";
const SERVICE_WORKER_URL = `${process.env.PUBLIC_URL || ""}/firebase-messaging-sw.js`;

const hasWindow = () =>
  typeof window !== "undefined" && typeof navigator !== "undefined";

const loadStoredRegistration = () => {
  if (!hasWindow()) {
    return { token: "", userId: "" };
  }

  try {
    return {
      token: window.localStorage.getItem(TOKEN_STORAGE_KEY) || "",
      userId: window.localStorage.getItem(USER_STORAGE_KEY) || ""
    };
  } catch (error) {
    console.warn("Failed to load chat push registration:", error);
    return { token: "", userId: "" };
  }
};

const persistStoredRegistration = (token, userId) => {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    window.localStorage.setItem(USER_STORAGE_KEY, userId);
  } catch (error) {
    console.warn("Failed to store chat push registration:", error);
  }
};

const clearStoredRegistration = () => {
  if (!hasWindow()) {
    return;
  }

  try {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear chat push registration:", error);
  }
};

const isPushSupported = async () => {
  if (
    !hasWindow() ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !messaging ||
    !VAPID_KEY
  ) {
    return false;
  }

  try {
    if (typeof firebase.messaging.isSupported !== "function") {
      return true;
    }

    const supportResult = firebase.messaging.isSupported();
    return typeof supportResult?.then === "function"
      ? await supportResult
      : Boolean(supportResult);
  } catch (error) {
    console.warn("Failed to detect chat push support:", error);
    return false;
  }
};

const removeTokenFromUserDocument = async (userId, token) => {
  if (!userId || !token) {
    return;
  }

  await firestore
    .collection("users")
    .doc(userId)
    .set(
      {
        chatNotificationTokens: firebase.firestore.FieldValue.arrayRemove(token)
      },
      { merge: true }
    );
};

export const ensureChatPushRegistration = async (userId) => {
  if (!userId || !(await isPushSupported())) {
    return;
  }

  if (window.Notification.permission === "denied") {
    return;
  }

  try {
    const permission =
      window.Notification.permission === "granted"
        ? "granted"
        : await window.Notification.requestPermission();

    if (permission !== "granted") {
      return;
    }

    const serviceWorkerRegistration = await navigator.serviceWorker.register(
      SERVICE_WORKER_URL
    );
    const token = await messaging.getToken({
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration
    });

    if (!token) {
      return;
    }

    const storedRegistration = loadStoredRegistration();

    if (
      storedRegistration.token &&
      storedRegistration.userId &&
      (storedRegistration.userId !== userId ||
        storedRegistration.token !== token)
    ) {
      await removeTokenFromUserDocument(
        storedRegistration.userId,
        storedRegistration.token
      ).catch((error) => {
        console.warn("Failed to detach previous chat push token:", error);
      });
    }

    await firestore
      .collection("users")
      .doc(userId)
      .set(
        {
          chatNotificationTokens: firebase.firestore.FieldValue.arrayUnion(token),
          chatNotificationUpdatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

    persistStoredRegistration(token, userId);
  } catch (error) {
    console.warn("Failed to register chat push notifications:", error);
  }
};

export const clearChatPushRegistration = async () => {
  const storedRegistration = loadStoredRegistration();

  if (!storedRegistration.token || !storedRegistration.userId) {
    clearStoredRegistration();
    return;
  }

  try {
    await removeTokenFromUserDocument(
      storedRegistration.userId,
      storedRegistration.token
    );
  } catch (error) {
    console.warn("Failed to clear chat push registration:", error);
  } finally {
    clearStoredRegistration();
  }
};
