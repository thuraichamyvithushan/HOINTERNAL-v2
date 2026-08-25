import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import {
  faCheck,
  faChevronLeft,
  faComments,
  faFileLines,
  faImage,
  faMagnifyingGlass,
  faPaperPlane,
  faPaperclip,
  faPenToSquare,
  faReply,
  faTrashCan,
  faUserShield,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import firebase, { auth, firestore, storage } from "../firebase";
import { API_URL, SOCKET_NOTIFICATIONS_ENABLED, SOCKET_URL } from "../config";
import { AuthContext } from "../context/AuthContext";
import "./ChatWidget.css";

const PRESENCE_HEARTBEAT_MS = 45000;
const PRESENCE_STALE_MS = 90000;
const STORAGE_KEY_PREFIX = "chat_seen_timestamps";
const MAX_CHAT_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const getStableParticipants = (firstUserId, secondUserId) =>
  [firstUserId, secondUserId].sort();

const getConversationId = (firstUserId, secondUserId) =>
  getStableParticipants(firstUserId, secondUserId).join("__");

const getConversationParticipants = (
  firstUserId,
  secondUserId,
  existingParticipants = []
) => {
  if (
    Array.isArray(existingParticipants) &&
    existingParticipants.length === 2 &&
    existingParticipants.includes(firstUserId) &&
    existingParticipants.includes(secondUserId)
  ) {
    return existingParticipants;
  }

  return getStableParticipants(firstUserId, secondUserId);
};

const getDisplayName = (profile = {}) =>
  profile.name ||
  profile.displayName ||
  profile.email?.split("@")[0] ||
  "Unknown User";

const sanitizeAttachmentFileName = (fileName = "attachment") =>
  fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

const isImageAttachment = (attachment = {}) =>
  (attachment.mimeType || "").startsWith("image/");

const formatAttachmentSize = (size = 0) => {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getReadStateTimestampMs = (conversation = {}, participantId = "") =>
  getTimestampMs(conversation?.readStates?.[participantId]);

const getDeletedMessageSummaryText = (message = {}) => {
  if (message.deletedByRole === "admin" && message.deletedBy !== message.senderId) {
    return "Admin deleted this message";
  }

  if (message.deletedByName) {
    return `${message.deletedByName} deleted this message`;
  }

  return "User deleted this message";
};

const getDeletedMessageText = (message = {}, viewerId = "") => {
  if (!message?.deletedAt) {
    return "";
  }

  if (viewerId && message.deletedBy === viewerId) {
    return "You deleted this message";
  }

  return getDeletedMessageSummaryText(message);
};

const getMessageReplyPreviewText = (message = {}) => {
  if (message.deletedAt) {
    return "Deleted message";
  }

  const trimmedText = `${message.text || ""}`.trim();

  if (trimmedText) {
    return trimmedText;
  }

  if (message.attachment) {
    return isImageAttachment(message.attachment) ? "Photo" : "Attachment";
  }

  return "Message";
};

const getTimestampMs = (value) => {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (value.seconds) return value.seconds * 1000;
  return 0;
};

const formatMessageTime = (value) => {
  const timestampMs = getTimestampMs(value);

  if (!timestampMs) {
    return "Now";
  }

  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(timestampMs));
};

const formatConversationTime = (value) => {
  const timestampMs = getTimestampMs(value);

  if (!timestampMs) {
    return "";
  }

  const messageDate = new Date(timestampMs);
  const today = new Date();
  const isToday = messageDate.toDateString() === today.toDateString();

  if (isToday) {
    return formatMessageTime(value);
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric"
  }).format(messageDate);
};

const isUserOnline = (profile = {}) => {
  const presence = profile.chatPresence || {};
  const lastSeenMs = getTimestampMs(presence.lastSeen);

  return (
    presence.state === "online" &&
    lastSeenMs > Date.now() - PRESENCE_STALE_MS
  );
};

const formatLastSeen = (profile = {}) => {
  if (isUserOnline(profile)) {
    return "Online";
  }

  const presence = profile.chatPresence || {};
  const lastSeenMs = getTimestampMs(presence.lastSeen);

  if (!lastSeenMs) {
    return "Last seen recently";
  }

  const now = Date.now();
  const diffMinutes = Math.max(1, Math.floor((now - lastSeenMs) / 60000));

  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Last seen ${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);

  if (diffDays === 1) {
    return `Last seen yesterday at ${formatMessageTime({ toMillis: () => lastSeenMs })}`;
  }

  return `Last seen ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(lastSeenMs))}`;
};

const getSeenTimestampsStorageKey = (userId) =>
  `${STORAGE_KEY_PREFIX}:${userId}`;

const supportsBrowserNotifications = () =>
  typeof window !== "undefined" && "Notification" in window;

const requestBrowserNotificationPermission = async () => {
  if (!supportsBrowserNotifications()) {
    return "denied";
  }

  if (window.Notification.permission !== "default") {
    return window.Notification.permission;
  }

  return window.Notification.requestPermission();
};

const showBrowserNotification = ({ title, body, onClick }) => {
  if (
    !supportsBrowserNotifications() ||
    window.Notification.permission !== "granted" ||
    (document.visibilityState === "visible" && document.hasFocus())
  ) {
    return null;
  }

  const notification = new window.Notification(title, {
    body,
    tag: `chat-${title}`,
    renotify: false
  });

  if (typeof onClick === "function") {
    notification.onclick = (event) => {
      event.preventDefault();
      onClick();
      notification.close();
    };
  }

  window.setTimeout(() => notification.close(), 6000);
  return notification;
};

const loadSeenConversationTimestamps = (userId) => {
  if (!userId) {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(
      getSeenTimestampsStorageKey(userId)
    );
    return storedValue ? JSON.parse(storedValue) : {};
  } catch (error) {
    console.warn("Failed to load chat seen timestamps:", error);
    return {};
  }
};

const isMobileChatViewport = () =>
  typeof window !== "undefined" && window.innerWidth <= 700;

const getAuthenticatedRequestHeaders = async () => {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("Authentication required");
  }

  const token = await currentUser.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
};

const isMissingChatApiRoute = (error) => {
  return (
    error?.message === "CHAT_API_ROUTE_NOT_FOUND" ||
    error?.message === "Failed to fetch"
  );
};

const ChatWidget = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [actionMenuMessageId, setActionMenuMessageId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [messageActionInFlightId, setMessageActionInFlightId] = useState(null);
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(isMobileChatViewport);
  const [sidebarTab, setSidebarTab] = useState("chats");
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [activeImagePreview, setActiveImagePreview] = useState(null);
  const messagesEndRef = useRef(null);
  const longPressTimerRef = useRef(null);
  const notifiedConversationKeysRef = useRef(new Set());
  const hasLoadedConversationsRef = useRef(false);
  const isSocketConnectedRef = useRef(false);
  const socketRef = useRef(null);
  const isOpenRef = useRef(false);
  const activeConversationIdRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [seenConversationTimestamps, setSeenConversationTimestamps] = useState(() =>
    loadSeenConversationTimestamps(user?.uid)
  );

  useEffect(() => {
    setSeenConversationTimestamps(loadSeenConversationTimestamps(user?.uid));
    notifiedConversationKeysRef.current = new Set();
    hasLoadedConversationsRef.current = false;
    isSocketConnectedRef.current = false;
    socketRef.current = null;
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    try {
      window.localStorage.setItem(
        getSeenTimestampsStorageKey(user.uid),
        JSON.stringify(seenConversationTimestamps)
      );
    } catch (error) {
      console.warn("Failed to save chat seen timestamps:", error);
    }
  }, [seenConversationTimestamps, user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const userRef = firestore.collection("users").doc(user.uid);

    const setPresence = (state) =>
      userRef.set(
        {
          chatPresence: {
            state,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
          }
        },
        { merge: true }
      ).catch((error) => {
        console.error(`Failed to set chat presence to ${state}:`, error);
      });

    const markOnline = () => setPresence("online");
    const markOffline = () => setPresence("offline");

    markOnline();

    const heartbeat = window.setInterval(markOnline, PRESENCE_HEARTBEAT_MS);
    const handlePageHide = () => {
      markOffline();
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    const unsubscribe = firestore.collection("users").onSnapshot(
      (snapshot) => {
        const users = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((candidate) => candidate.id !== user.uid)
          .sort((firstUser, secondUser) => {
            if (firstUser.role === "admin" && secondUser.role !== "admin") return -1;
            if (firstUser.role !== "admin" && secondUser.role === "admin") return 1;
            return getDisplayName(firstUser).localeCompare(getDisplayName(secondUser));
          });

        setAllUsers(users);
      },
      (error) => {
        console.error("Failed to load chat users:", error);
      }
    );

    return () => {
      window.clearInterval(heartbeat);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
      markOffline();
      unsubscribe();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const syncViewport = () => {
      setIsMobileViewport(isMobileChatViewport());
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      return undefined;
    }

    const unsubscribe = firestore
      .collection("chatConversations")
      .where("participants", "array-contains", user.uid)
      .onSnapshot(
        (snapshot) => {
          const isInitialSnapshot = !hasLoadedConversationsRef.current;
          const nextConversations = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((firstConversation, secondConversation) => {
              return (
                getTimestampMs(secondConversation.updatedAt) -
                getTimestampMs(firstConversation.updatedAt)
              );
            });

          if (isInitialSnapshot) {
            nextConversations.forEach((conversation) => {
              const latestMessageMs = getTimestampMs(conversation.updatedAt);

              if (
                conversation.lastMessageSenderId &&
                conversation.lastMessageSenderId !== user.uid &&
                latestMessageMs
              ) {
                notifiedConversationKeysRef.current.add(
                  `${conversation.id}:${latestMessageMs}`
                );
              }
            });

            hasLoadedConversationsRef.current = true;
          }

          setConversations(nextConversations);

          if (!isMobileViewport && !activeContactId && nextConversations.length > 0) {
            const firstConversation = nextConversations[0];
            const otherUserId = (firstConversation.participants || []).find(
              (participantId) => participantId !== user.uid
            );

            if (otherUserId) {
              setActiveContactId(otherUserId);
            }
          }
        },
        (error) => {
          console.error("Failed to load chat conversations:", error);
        }
      );

    return () => unsubscribe();
  }, [activeContactId, isMobileViewport, user?.uid]);

  const activeConversationId = useMemo(() => {
    if (!activeContactId || !user?.uid) {
      return null;
    }

    return getConversationId(user.uid, activeContactId);
  }, [activeContactId, user?.uid]);

  const usersById = useMemo(() => {
    return allUsers.reduce((result, candidate) => {
      result[candidate.id] = candidate;
      return result;
    }, {});
  }, [allUsers]);

  const enrichedConversations = useMemo(() => {
    return conversations
      .map((conversation) => {
        const otherUserId = (conversation.participants || []).find(
          (participantId) => participantId !== user?.uid
        );

        if (!otherUserId) {
          return null;
        }

        const fallbackProfile = conversation.participantProfiles?.[otherUserId] || {};
        const otherUserProfile = usersById[otherUserId] || {
          id: otherUserId,
          ...fallbackProfile
        };

        return {
          ...conversation,
          otherUserId,
          otherUserProfile
        };
      })
      .filter(Boolean);
  }, [conversations, user?.uid, usersById]);

  const activeContact = activeContactId ? usersById[activeContactId] : null;
  const activeConversation = enrichedConversations.find(
    (conversation) => conversation.id === activeConversationId
  );

  const markConversationAsRead = (conversationId, timestampValue) => {
    const timestampMs = getTimestampMs(timestampValue);

    if (!conversationId || !timestampMs) {
      return;
    }

    setSeenConversationTimestamps((current) => {
      if ((current[conversationId] || 0) >= timestampMs) {
        return current;
      }

      return {
        ...current,
        [conversationId]: timestampMs
      };
    });
  };

  const unreadConversationIds = useMemo(() => {
    return enrichedConversations.reduce((result, conversation) => {
      const latestMessageMs = getTimestampMs(conversation.updatedAt);
      const seenTimestampMs = seenConversationTimestamps[conversation.id] || 0;
      const hasUnreadMessage =
        conversation.lastMessageSenderId &&
        conversation.lastMessageSenderId !== user?.uid &&
        latestMessageMs > seenTimestampMs;

      if (hasUnreadMessage) {
        result.push(conversation.id);
      }

      return result;
    }, []);
  }, [enrichedConversations, seenConversationTimestamps, user?.uid]);

  const unreadConversationIdSet = useMemo(
    () => new Set(unreadConversationIds),
    [unreadConversationIds]
  );

  const unreadCount = unreadConversationIds.length;

  const conversationRef = activeConversationId
    ? firestore.collection("chatConversations").doc(activeConversationId)
    : null;

  useEffect(() => {
    isOpenRef.current = isOpen;
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId, isOpen]);

  useEffect(() => {
    setEditingMessageId(null);
    setReplyingToMessage(null);
    setDraftMessage("");
    setMessageActionInFlightId(null);
    setActionMenuMessageId(null);
    setSelectedAttachment((currentAttachment) => {
      if (currentAttachment?.previewUrl) {
        window.URL.revokeObjectURL(currentAttachment.previewUrl);
      }

      return null;
    });
  }, [activeConversationId]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target;

      if (
        target instanceof Element &&
        target.closest(".chat-bubble-actions-menu, .chat-composer-editing, [data-chat-bubble-id]")
      ) {
        return;
      }

      setActionMenuMessageId(null);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setActionMenuMessageId(null);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return undefined;
    }

    const unsubscribe = firestore
      .collection("chatConversations")
      .doc(activeConversationId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot(
        (snapshot) => {
          const nextMessages = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));

          setMessages(nextMessages);
        },
        (error) => {
          console.error("Failed to load chat messages:", error);
        }
      );

    return () => unsubscribe();
  }, [activeConversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, activeConversationId]);

  useEffect(() => {
    if (!activeConversationId || !isOpen || !user?.uid) {
      return undefined;
    }

    let isSubscribed = true;

    const syncActiveConversationReadState = () => {
      const latestMessageTimestamp =
        messages[messages.length - 1]?.createdAt || activeConversation?.updatedAt;
      const timestampMs = getTimestampMs(latestMessageTimestamp);
      const remoteReadTimestampMs = getReadStateTimestampMs(
        activeConversation,
        user.uid
      );

      if (!timestampMs) {
        return;
      }

      markConversationAsRead(activeConversationId, latestMessageTimestamp);

      if (remoteReadTimestampMs >= timestampMs) {
        return;
      }

      firestore
        .collection("chatConversations")
        .doc(activeConversationId)
        .set(
          {
            readStates: {
              [user.uid]: firebase.firestore.Timestamp.fromMillis(timestampMs)
            }
          },
          { merge: true }
        )
        .catch((error) => {
          if (!isSubscribed) {
            return;
          }

          console.warn("Failed to sync chat read state:", error);
        });
    };

    syncActiveConversationReadState();

    const handleReadSyncVisibility = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      syncActiveConversationReadState();
    };

    window.addEventListener("focus", handleReadSyncVisibility);
    document.addEventListener("visibilitychange", handleReadSyncVisibility);

    return () => {
      isSubscribed = false;
      window.removeEventListener("focus", handleReadSyncVisibility);
      document.removeEventListener("visibilitychange", handleReadSyncVisibility);
    };
  }, [activeConversation, activeConversationId, isOpen, messages, user?.uid]);

  useEffect(() => {
    if (!activeConversationId || !isOpen || !user?.uid || messages.length === 0) {
      return undefined;
    }

    const syncMessageReadReceipts = () => {
      const unreadIncomingMessages = messages.filter(
        (message) =>
          message.senderId &&
          message.senderId !== user.uid &&
          message.readBy !== user.uid
      );

      if (unreadIncomingMessages.length === 0) {
        return;
      }

      const batch = firestore.batch();
      const messagesCollectionRef = firestore
        .collection("chatConversations")
        .doc(activeConversationId)
        .collection("messages");

      unreadIncomingMessages.forEach((message) => {
        batch.update(messagesCollectionRef.doc(message.id), {
          readAt: firebase.firestore.FieldValue.serverTimestamp(),
          readBy: user.uid
        });
      });

      batch.commit().catch((error) => {
        console.warn("Failed to sync chat message read receipts:", error);
      });
    };

    syncMessageReadReceipts();

    const handleReceiptSyncVisibility = () => {
      if (document.visibilityState === "hidden") {
        return;
      }

      syncMessageReadReceipts();
    };

    window.addEventListener("focus", handleReceiptSyncVisibility);
    document.addEventListener("visibilitychange", handleReceiptSyncVisibility);

    return () => {
      window.removeEventListener("focus", handleReceiptSyncVisibility);
      document.removeEventListener("visibilitychange", handleReceiptSyncVisibility);
    };
  }, [activeConversationId, isOpen, messages, user?.uid]);

  useEffect(() => {
    if (!user?.uid || !hasLoadedConversationsRef.current || enrichedConversations.length === 0) {
      return;
    }

    enrichedConversations.forEach((conversation) => {
      const latestMessageMs = getTimestampMs(conversation.updatedAt);
      const isIncomingMessage =
        conversation.lastMessageSenderId &&
        conversation.lastMessageSenderId !== user.uid;
      const isConversationOpen =
        isOpen && conversation.id === activeConversationId;
      const notificationKey = `${conversation.id}:${latestMessageMs}`;

      if (!isIncomingMessage || !latestMessageMs) {
        return;
      }

      if (isConversationOpen) {
        markConversationAsRead(conversation.id, conversation.updatedAt);
        return;
      }

      if (isSocketConnectedRef.current || notifiedConversationKeysRef.current.has(notificationKey)) {
        return;
      }

      notifiedConversationKeysRef.current.add(notificationKey);

      showBrowserNotification({
        title: getDisplayName(conversation.otherUserProfile),
        body: conversation.lastMessageText || "You have a new message.",
        onClick: () => {
          window.focus();
          setIsOpen(true);
          setActiveContactId(conversation.otherUserId);
        }
      });
    });
  }, [activeConversationId, enrichedConversations, isOpen, user?.uid]);

  useEffect(() => {
    if (!SOCKET_NOTIFICATIONS_ENABLED || !user?.uid || !auth.currentUser) {
      return undefined;
    }

    let isSubscribed = true;

    const initializeSocket = async () => {
      try {
        const token = await auth.currentUser.getIdToken();

        if (!isSubscribed) {
          return;
        }

        const socket = io(SOCKET_URL, {
          transports: ["websocket", "polling"],
          auth: { token }
        });
        socketRef.current = socket;

        const handleConnect = () => {
          isSocketConnectedRef.current = true;
        };

        const handleDisconnect = () => {
          isSocketConnectedRef.current = false;
        };

        const handleConnectError = (error) => {
          isSocketConnectedRef.current = false;
          console.warn("Chat socket connection failed:", error.message);
        };

        const handleNewMessage = (payload = {}) => {
          const {
            conversationId,
            messageId,
            senderId,
            senderName,
            text
          } = payload;

          if (!senderId || senderId === user.uid) {
            return;
          }

          const notificationKey = `${conversationId || senderId}:${messageId || Date.now()}`;

          if (notifiedConversationKeysRef.current.has(notificationKey)) {
            return;
          }

          if (
            isOpenRef.current &&
            activeConversationIdRef.current &&
            conversationId === activeConversationIdRef.current
          ) {
            return;
          }

          notifiedConversationKeysRef.current.add(notificationKey);

          showBrowserNotification({
            title: senderName || "New chat message",
            body: text || "You have a new message.",
            onClick: () => {
              window.focus();
              setIsOpen(true);
              setActiveContactId(senderId);
            }
          });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("connect_error", handleConnectError);
        socket.on("chat:new-message", handleNewMessage);
      } catch (error) {
        console.warn("Failed to initialize chat socket:", error);
      }
    };

    initializeSocket();

    return () => {
      isSubscribed = false;
      isSocketConnectedRef.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.uid]);

  const filteredContacts = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLowerCase();

    return allUsers.filter((candidate) => {
      if (!normalizedSearchTerm) {
        return true;
      }

      const haystack = [
        getDisplayName(candidate),
        candidate.email || "",
        candidate.role || "",
        candidate.country || ""
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearchTerm);
    });
  }, [allUsers, searchTerm]);

  const recentContactIdSet = useMemo(() => {
    return new Set(enrichedConversations.map((conversation) => conversation.otherUserId));
  }, [enrichedConversations]);

  const contactListUsers = useMemo(() => {
    return filteredContacts.filter((contact) => !recentContactIdSet.has(contact.id));
  }, [filteredContacts, recentContactIdSet]);

  const getOwnMessageStatus = (message) => {
    const messageTimestampMs = getTimestampMs(message?.createdAt);
    const directReadTimestampMs = getTimestampMs(message?.readAt);
    const otherParticipantReadTimestampMs = getReadStateTimestampMs(
      activeConversation,
      activeContactId
    );

    if (directReadTimestampMs && message?.readBy === activeContactId) {
      return "read";
    }

    if (messageTimestampMs && otherParticipantReadTimestampMs >= messageTimestampMs) {
      return "read";
    }

    if (isUserOnline(activeContact)) {
      return "delivered";
    }

    return "sent";
  };

  const openConversation = async (contactId) => {
    try {
      await requestBrowserNotificationPermission();
    } catch (error) {
      console.warn("Browser notification permission request failed:", error);
    }

    setIsOpen(true);
    setActiveContactId(contactId);
  };

  const startEditingMessage = (message) => {
    clearSelectedAttachment();
    setReplyingToMessage(null);
    setActionMenuMessageId(null);
    setEditingMessageId(message.id);
    setDraftMessage(message.text || "");
  };

  const cancelEditingMessage = () => {
    setEditingMessageId(null);
    setDraftMessage("");
  };

  const startReplyingToMessage = (message) => {
    if (!message?.id || message.deletedAt) {
      return;
    }

    setEditingMessageId(null);
    setActionMenuMessageId(null);
    setReplyingToMessage({
      messageId: message.id,
      senderId: message.senderId || "",
      senderName:
        message.senderId === user.uid
          ? user.name || user.displayName || user.email || "You"
          : message.senderName || getDisplayName(activeContact),
      previewText: getMessageReplyPreviewText(message)
    });
  };

  const cancelReplyingToMessage = () => {
    setReplyingToMessage(null);
  };

  const clearSelectedAttachment = () => {
    setSelectedAttachment((currentAttachment) => {
      if (currentAttachment?.previewUrl) {
        window.URL.revokeObjectURL(currentAttachment.previewUrl);
      }

      return null;
    });
  };

  const closeImagePreview = () => {
    setActiveImagePreview(null);
  };

  const handleAttachmentSelection = (event, preferredCategory) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
      toast.error("Attachment must be smaller than 15 MB.");
      return;
    }

    const category =
      preferredCategory === "image" || file.type.startsWith("image/")
        ? "image"
        : "file";

    setSelectedAttachment((currentAttachment) => {
      if (currentAttachment?.previewUrl) {
        window.URL.revokeObjectURL(currentAttachment.previewUrl);
      }

      return {
        file,
        category,
        previewUrl: category === "image" ? window.URL.createObjectURL(file) : ""
      };
    });
  };

  const uploadChatAttachment = async (conversationId, messageId, attachment) => {
    const file = attachment?.file;

    if (!file) {
      return null;
    }

    const storagePath = `chat-attachments/${conversationId}/${messageId}/${Date.now()}-${sanitizeAttachmentFileName(file.name)}`;
    const attachmentRef = storage.ref(storagePath);
    const uploadTask = attachmentRef.put(file, {
      contentType: file.type || "application/octet-stream"
    });

    await uploadTask;

    return {
      category: attachment.category,
      downloadUrl: await attachmentRef.getDownloadURL(),
      mimeType: file.type || "application/octet-stream",
      name: file.name,
      size: file.size,
      storagePath
    };
  };

  const saveEditedMessage = async () => {
    const trimmedMessage = draftMessage.trim();
    const editingMessage = messages.find((message) => message.id === editingMessageId);

    if (!conversationRef || !editingMessage?.id || !trimmedMessage || editingMessage.deletedAt) {
      return;
    }

    setMessageActionInFlightId(editingMessage.id);

    try {
      try {
        const headers = await getAuthenticatedRequestHeaders();
        const response = await fetch(
          `${API_URL}/api/chat/conversations/${activeConversationId}/messages/${editingMessage.id}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({ text: trimmedMessage })
          }
        );

        if (response.status === 404) {
          throw new Error("CHAT_API_ROUTE_NOT_FOUND");
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.error || "Failed to edit message");
        }
      } catch (apiError) {
        if (!isMissingChatApiRoute(apiError)) {
          throw apiError;
        }

        await conversationRef.collection("messages").doc(editingMessage.id).update({
          text: trimmedMessage,
          editedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      setEditingMessageId(null);
      setDraftMessage("");
    } catch (error) {
      console.error("Failed to edit chat message:", error);
      toast.error(
        error.message === "CHAT_API_ROUTE_NOT_FOUND"
          ? "Chat edit API is not deployed yet."
          : error.message || "Failed to edit message."
      );
    } finally {
      setMessageActionInFlightId(null);
    }
  };

  const deleteMessage = async (message) => {
    if (!conversationRef || !message?.id || message.deletedAt) {
      return;
    }

    setActionMenuMessageId(null);

    const confirmed = window.confirm("Delete this message?");

    if (!confirmed) {
      return;
    }

    setMessageActionInFlightId(message.id);

    try {
      try {
        const headers = await getAuthenticatedRequestHeaders();
        const response = await fetch(
          `${API_URL}/api/chat/conversations/${activeConversationId}/messages/${message.id}`,
          {
            method: "DELETE",
            headers
          }
        );

        if (response.status === 404) {
          throw new Error("CHAT_API_ROUTE_NOT_FOUND");
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload.error || "Failed to delete message");
        }
      } catch (apiError) {
        if (!isMissingChatApiRoute(apiError)) {
          throw apiError;
        }

        const deletedMessagePayload = {
          text: "",
          attachment: null,
          deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
          deletedBy: user.uid,
          deletedByName:
            user.role === "admin" && message.senderId !== user.uid
              ? "Admin"
              : user.name || user.displayName || user.email || "User",
          deletedByRole: user.role || "user"
        };

        await conversationRef.collection("messages").doc(message.id).update(
          deletedMessagePayload
        );

        if (message.attachment?.storagePath) {
          storage.ref(message.attachment.storagePath).delete().catch(() => {});
        }

        if (messages[messages.length - 1]?.id === message.id) {
          await conversationRef.set(
            {
              lastMessageText: getDeletedMessageSummaryText({
                ...message,
                ...deletedMessagePayload
              }),
              lastMessageSenderId: message.senderId || user.uid,
              updatedAt:
                message.createdAt ||
                firebase.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
          );
        }
      }

      if (editingMessageId === message.id) {
        setEditingMessageId(null);
        setDraftMessage("");
      }

      if (replyingToMessage?.messageId === message.id) {
        setReplyingToMessage((currentReply) =>
          currentReply
            ? {
                ...currentReply,
                previewText: "Deleted message"
              }
            : null
        );
      }
    } catch (error) {
      console.error("Failed to delete chat message:", error);
      toast.error(
        error.message === "CHAT_API_ROUTE_NOT_FOUND"
          ? "Chat delete API is not deployed yet."
          : error.message || "Failed to delete message."
      );
    } finally {
      setMessageActionInFlightId(null);
    }
  };

  const openChatLauncher = async () => {
    try {
      await requestBrowserNotificationPermission();
    } catch (error) {
      console.warn("Browser notification permission request failed:", error);
    }

    if (isMobileViewport) {
      setActiveContactId(null);
    }

    setIsOpen(true);
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const openMessageActionMenu = (messageId) => {
    setActionMenuMessageId((current) => (current === messageId ? null : messageId));
  };

  const handleMessagePointerDown = (messageId) => {
    clearLongPressTimer();

    longPressTimerRef.current = window.setTimeout(() => {
      openMessageActionMenu(messageId);
    }, 420);
  };

  const handleMessagePointerUp = () => {
    clearLongPressTimer();
  };

  const handleMessageContextMenu = (event, messageId) => {
    event.preventDefault();
    clearLongPressTimer();
    openMessageActionMenu(messageId);
  };

  const sendMessage = async () => {
    const trimmedMessage = draftMessage.trim();
    const hasAttachment = Boolean(selectedAttachment?.file);

    if ((!trimmedMessage && !hasAttachment) || !activeContactId || !user?.uid || isSending) {
      return;
    }

    if (editingMessageId) {
      await saveEditedMessage();
      return;
    }

    const conversationId = getConversationId(user.uid, activeContactId);
    const participants = getConversationParticipants(
      user.uid,
      activeContactId,
      activeConversation?.participants
    );
    const sendConversationRef = firestore.collection("chatConversations").doc(conversationId);
    const messageRef = sendConversationRef.collection("messages").doc();
    const batch = firestore.batch();
    const activeRecipient = usersById[activeContactId];
    let attachmentPayload = null;

    if (!activeRecipient) {
      return;
    }

    setIsSending(true);

    try {
      if (hasAttachment) {
        attachmentPayload = await uploadChatAttachment(
          conversationId,
          messageRef.id,
          selectedAttachment
        );
      }

      const lastMessagePreview =
        trimmedMessage ||
        attachmentPayload?.name ||
        (attachmentPayload?.category === "image" ? "Photo" : "Attachment");

      const baseConversationPayload = {
        participants,
        participantProfiles: {
          [user.uid]: {
            id: user.uid,
            name: user.name || user.displayName || user.email || "You",
            email: user.email || "",
            role: user.role || "user",
            country: user.country || ""
          },
          [activeContactId]: {
            id: activeRecipient.id,
            name: getDisplayName(activeRecipient),
            email: activeRecipient.email || "",
            role: activeRecipient.role || "user",
            country: activeRecipient.country || ""
          }
        },
        lastMessageText: lastMessagePreview,
        lastMessageSenderId: user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!activeConversation) {
        baseConversationPayload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      }

      batch.set(sendConversationRef, baseConversationPayload, { merge: true });
      batch.set(messageRef, {
        text: trimmedMessage,
        attachment: attachmentPayload,
        replyTo: replyingToMessage,
        senderId: user.uid,
        senderName: user.name || user.displayName || user.email || "You",
        recipientId: activeContactId,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      batch.set(
        sendConversationRef,
        {
          readStates: {
            [user.uid]: firebase.firestore.FieldValue.serverTimestamp()
          }
        },
        { merge: true }
      );

      await batch.commit();
      setDraftMessage("");
      setReplyingToMessage(null);
      clearSelectedAttachment();
    } catch (error) {
      console.error("Failed to send chat message:", error);
      toast.error("Failed to send message.");

      if (attachmentPayload?.storagePath) {
        storage.ref(attachmentPayload.storagePath).delete().catch(() => {});
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
      return;
    }

    if (event.key === "Escape" && editingMessageId) {
      event.preventDefault();
      cancelEditingMessage();
    }
  };

  const handleMessageKeyDown = (event, messageId) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMessageActionMenu(messageId);
    }
  };

  if (!user?.uid) {
    return null;
  }

  return (
    <div className="chat-widget-root">
      {isOpen && (
        <>
          <button
            type="button"
            className="chat-widget-backdrop"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat overlay"
          />

          <div
            className={`chat-widget-panel ${activeContact ? "thread-active" : ""}`}
            role="dialog"
            aria-label="Team chat"
          >
            <div className="chat-widget-sidebar">
              <div className="chat-widget-header">
                <div>
                  <p className="chat-widget-eyebrow">Messages</p>
                  <h2>Chats</h2>
                  <p className="chat-widget-summary">
                    {enrichedConversations.length} active chats / {allUsers.length} contacts
                  </p>
                </div>

                <button
                  type="button"
                  className="chat-widget-close"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close chat"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              <label className="chat-widget-search">
                <FontAwesomeIcon icon={faMagnifyingGlass} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search or start a new chat"
                />
              </label>

              <div className="chat-widget-tabs" role="tablist" aria-label="Chat sections">
                <button
                  type="button"
                  role="tab"
                  aria-selected={sidebarTab === "chats"}
                  className={`chat-widget-tab ${sidebarTab === "chats" ? "active" : ""}`}
                  onClick={() => setSidebarTab("chats")}
                >
                  Chats
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={sidebarTab === "contacts"}
                  className={`chat-widget-tab ${sidebarTab === "contacts" ? "active" : ""}`}
                  onClick={() => setSidebarTab("contacts")}
                >
                  Contacts
                </button>
              </div>

              {sidebarTab === "chats" ? (
                <div className="chat-widget-section">
                  <div className="chat-widget-list">
                    {enrichedConversations.length === 0 ? (
                      <p className="chat-widget-empty-list">Start a conversation from the Contacts tab.</p>
                    ) : (
                      enrichedConversations.map((conversation) => (
                        <button
                          key={conversation.id}
                          type="button"
                          className={`chat-list-item ${conversation.otherUserId === activeContactId ? "active" : ""}`}
                          onClick={() => openConversation(conversation.otherUserId)}
                        >
                          <span className="chat-list-avatar">
                            {getDisplayName(conversation.otherUserProfile).charAt(0).toUpperCase()}
                          </span>
                          <span className="chat-list-copy">
                            <span className="chat-list-topline">
                              <span className="chat-list-name-group">
                                <strong>{getDisplayName(conversation.otherUserProfile)}</strong>
                                <span className={`chat-presence ${isUserOnline(conversation.otherUserProfile) ? "online" : "offline"}`}>
                                  <span className="chat-presence-dot" />
                                  {formatLastSeen(conversation.otherUserProfile)}
                                </span>
                              </span>
                              <small>{formatConversationTime(conversation.updatedAt)}</small>
                            </span>
                            <span className="chat-list-subline">
                              {conversation.lastMessageText || "No messages yet"}
                            </span>
                          </span>
                          {unreadConversationIdSet.has(conversation.id) && (
                            <span className="chat-unread-pill" aria-label="Unread messages">
                              New
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="chat-widget-section">
                  <div className="chat-widget-list">
                    {contactListUsers.length === 0 ? (
                      <p className="chat-widget-empty-list">No other contacts to show.</p>
                    ) : (
                      contactListUsers.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className={`chat-list-item ${contact.id === activeContactId ? "active" : ""}`}
                          onClick={() => openConversation(contact.id)}
                        >
                          <span className="chat-list-avatar">
                            {getDisplayName(contact).charAt(0).toUpperCase()}
                          </span>
                          <span className="chat-list-copy">
                            <span className="chat-list-topline">
                              <span className="chat-list-name-group">
                                <strong>{getDisplayName(contact)}</strong>
                                <span className={`chat-presence ${isUserOnline(contact) ? "online" : "offline"}`}>
                                  <span className="chat-presence-dot" />
                                  {formatLastSeen(contact)}
                                </span>
                              </span>
                              {contact.role === "admin" && (
                                <small className="chat-admin-pill">
                                  <FontAwesomeIcon icon={faUserShield} />
                                  Admin
                                </small>
                              )}
                            </span>
                            <span className="chat-list-subline">
                              {[contact.role, contact.country].filter(Boolean).join(" / ") || contact.email}
                            </span>
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="chat-widget-thread">
              {activeContact ? (
                <>
                  <div className="chat-thread-header">
                    <div className="chat-thread-person">
                      <button
                        type="button"
                        className="chat-thread-back"
                        onClick={() => setActiveContactId(null)}
                        aria-label="Back to chat list"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>

                      <span className="chat-list-avatar chat-thread-avatar">
                        {getDisplayName(activeContact).charAt(0).toUpperCase()}
                      </span>

                      <div>
                        <h3>{getDisplayName(activeContact)}</h3>
                        <div className={`chat-thread-presence ${isUserOnline(activeContact) ? "online" : "offline"}`}>
                          <span className="chat-presence-dot" />
                          {formatLastSeen(activeContact)}
                        </div>
                      </div>
                    </div>

                    <p className="chat-thread-meta">
                      {[activeContact.role, activeContact.country].filter(Boolean).join(" / ")}
                    </p>
                  </div>

                  <div className="chat-thread-messages">
                    {messages.length === 0 ? (
                      <div className="chat-thread-empty">
                        <strong>No messages yet</strong>
                        <span>Send your first message to start the conversation.</span>
                      </div>
                    ) : (
                      messages.map((message) => {
                        const isOwnMessage = message.senderId === user.uid;
                        const isDeletedMessage = Boolean(message.deletedAt);
                        const isMessageActionPending =
                          messageActionInFlightId === message.id;
                        const isActionMenuOpen = actionMenuMessageId === message.id;
                        const ownMessageStatus = isOwnMessage
                          ? getOwnMessageStatus(message)
                          : null;

                        return (
                          <div
                            key={message.id}
                            className={`chat-bubble-row ${isOwnMessage ? "mine" : "theirs"}`}
                          >
                            <div
                              className={`chat-bubble ${isOwnMessage ? "mine" : "theirs"} ${isActionMenuOpen ? "menu-open" : ""}`}
                              data-chat-bubble-id={message.id}
                              onPointerDown={
                                !editingMessageId && !isDeletedMessage
                                  ? () => handleMessagePointerDown(message.id)
                                  : undefined
                              }
                              onPointerUp={
                                !editingMessageId && !isDeletedMessage
                                  ? handleMessagePointerUp
                                  : undefined
                              }
                              onPointerLeave={
                                !editingMessageId && !isDeletedMessage
                                  ? clearLongPressTimer
                                  : undefined
                              }
                              onPointerCancel={
                                !editingMessageId && !isDeletedMessage
                                  ? clearLongPressTimer
                                  : undefined
                              }
                              onContextMenu={
                                !editingMessageId && !isDeletedMessage
                                  ? (event) => handleMessageContextMenu(event, message.id)
                                  : undefined
                              }
                              onKeyDown={
                                !editingMessageId && !isDeletedMessage
                                  ? (event) => handleMessageKeyDown(event, message.id)
                                  : undefined
                              }
                              tabIndex={
                                !editingMessageId && !isDeletedMessage
                                  ? 0
                                  : undefined
                              }
                            >
                              {message.replyTo?.messageId ? (
                                <div className="chat-reply-snippet">
                                  <span className="chat-reply-snippet-label">
                                    {message.replyTo.senderId === user.uid
                                      ? "You"
                                      : message.replyTo.senderName || "User"}
                                  </span>
                                  <span className="chat-reply-snippet-text">
                                    {message.replyTo.previewText || "Message"}
                                  </span>
                                </div>
                              ) : null}
                              {!isDeletedMessage &&
                                message.attachment &&
                                (isImageAttachment(message.attachment) ? (
                                  <button
                                    type="button"
                                    className="chat-attachment image"
                                    onClick={() =>
                                      setActiveImagePreview({
                                        downloadUrl: message.attachment.downloadUrl,
                                        name: message.attachment.name || "Chat image"
                                      })
                                    }
                                  >
                                    <img
                                      src={message.attachment.downloadUrl}
                                      alt={message.attachment.name || "Chat attachment"}
                                    />
                                  </button>
                                ) : (
                                  <a
                                    className="chat-attachment file"
                                    href={message.attachment.downloadUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <span className="chat-attachment-icon">
                                      <FontAwesomeIcon icon={faFileLines} />
                                    </span>
                                    <span className="chat-attachment-meta">
                                      <strong>{message.attachment.name || "Attachment"}</strong>
                                      <small>
                                        {[formatAttachmentSize(message.attachment.size), message.attachment.mimeType]
                                          .filter(Boolean)
                                          .join(" / ")}
                                      </small>
                                    </span>
                                  </a>
                                ))}
                              {isDeletedMessage ? (
                                <p className="chat-deleted-message">
                                  {getDeletedMessageText(message, user.uid)}
                                </p>
                              ) : message.text ? (
                                <p>{message.text}</p>
                              ) : null}
                              <div className="chat-bubble-footer">
                                <small>
                                  {formatMessageTime(message.createdAt)}
                                  {!isDeletedMessage && message.editedAt ? " / edited" : ""}
                                </small>
                                {ownMessageStatus && (
                                  <span
                                    className={`chat-message-status ${ownMessageStatus} ${
                                      ownMessageStatus === "sent" ? "single" : "double"
                                    }`}
                                    aria-label={ownMessageStatus}
                                    title={ownMessageStatus}
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                    {ownMessageStatus !== "sent" ? (
                                      <FontAwesomeIcon icon={faCheck} />
                                    ) : null}
                                  </span>
                                )}
                              </div>
                              {isActionMenuOpen && !isDeletedMessage && (
                                <div className="chat-bubble-actions-menu" role="menu">
                                  <button
                                    type="button"
                                    className="chat-menu-action"
                                    onClick={() => startReplyingToMessage(message)}
                                    disabled={isMessageActionPending}
                                  >
                                    <FontAwesomeIcon icon={faReply} />
                                    Reply
                                  </button>
                                  {isOwnMessage ? (
                                    <>
                                  <button
                                    type="button"
                                    className="chat-menu-action"
                                    onClick={() => startEditingMessage(message)}
                                    disabled={isMessageActionPending}
                                  >
                                    <FontAwesomeIcon icon={faPenToSquare} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="chat-menu-action danger"
                                    onClick={() => deleteMessage(message)}
                                    disabled={isMessageActionPending}
                                  >
                                    <FontAwesomeIcon icon={faTrashCan} />
                                    Delete
                                  </button>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  <div className={`chat-thread-composer ${editingMessageId || replyingToMessage ? "editing" : ""}`}>
                    {editingMessageId && (
                      <div className="chat-composer-editing">
                        <div className="chat-composer-editing-copy">
                          <span className="chat-composer-editing-label">Editing message</span>
                          <span className="chat-composer-editing-text">{draftMessage || "Update your message"}</span>
                        </div>
                        <button
                          type="button"
                          className="chat-composer-cancel"
                          onClick={cancelEditingMessage}
                          aria-label="Cancel editing message"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    )}
                    {replyingToMessage && !editingMessageId && (
                      <div className="chat-composer-replying">
                        <div className="chat-composer-editing-copy">
                          <span className="chat-composer-reply-label">
                            {replyingToMessage.senderId === user.uid
                              ? "You"
                              : replyingToMessage.senderName || "User"}
                          </span>
                          <span className="chat-composer-reply-text">
                            {replyingToMessage.previewText || "Message"}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="chat-composer-cancel"
                          onClick={cancelReplyingToMessage}
                          aria-label="Cancel reply"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    )}
                    {selectedAttachment && !editingMessageId && (
                      <div className="chat-composer-attachment">
                        {selectedAttachment.category === "image" && selectedAttachment.previewUrl ? (
                          <img
                            className="chat-composer-attachment-preview"
                            src={selectedAttachment.previewUrl}
                            alt={selectedAttachment.file.name}
                          />
                        ) : (
                          <span className="chat-composer-attachment-icon">
                            <FontAwesomeIcon icon={faFileLines} />
                          </span>
                        )}
                        <div className="chat-composer-attachment-copy">
                          <span className="chat-composer-attachment-name">
                            {selectedAttachment.file.name}
                          </span>
                          <span className="chat-composer-attachment-size">
                            {formatAttachmentSize(selectedAttachment.file.size)}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="chat-composer-cancel"
                          onClick={clearSelectedAttachment}
                          aria-label="Remove attachment"
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                    )}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="chat-file-input"
                      onChange={(event) => handleAttachmentSelection(event, "image")}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="chat-file-input"
                      onChange={(event) => handleAttachmentSelection(event, "file")}
                    />
                    {!editingMessageId && (
                      <>
                        <button
                          type="button"
                          className="chat-attach-btn"
                          onClick={() => imageInputRef.current?.click()}
                          aria-label="Send image"
                        >
                          <FontAwesomeIcon icon={faImage} />
                        </button>
                        <button
                          type="button"
                          className="chat-attach-btn"
                          onClick={() => fileInputRef.current?.click()}
                          aria-label="Send file"
                        >
                          <FontAwesomeIcon icon={faPaperclip} />
                        </button>
                      </>
                    )}
                    <textarea
                      value={draftMessage}
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder={
                        editingMessageId
                          ? "Edit your message"
                          : `Message ${getDisplayName(activeContact)}`
                      }
                      rows={1}
                    />

                    <button
                      type="button"
                      className="chat-send-btn"
                      onClick={sendMessage}
                      disabled={(!draftMessage.trim() && !selectedAttachment) || isSending}
                      aria-label={editingMessageId ? "Save edited message" : "Send message"}
                    >
                      <FontAwesomeIcon icon={editingMessageId ? faCheck : faPaperPlane} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="chat-thread-empty chat-thread-empty-main">
                  <strong>Select a chat to start messaging</strong>
                  <span>Pick a recent conversation or choose a contact to begin.</span>
                </div>
              )}
            </div>
          </div>
        </> 
      )}

      {activeImagePreview && (
        <div className="chat-image-viewer" role="dialog" aria-label="Image preview">
          <button
            type="button"
            className="chat-image-viewer-backdrop"
            onClick={closeImagePreview}
            aria-label="Close image preview"
          />
          <div className="chat-image-viewer-panel">
            <button
              type="button"
              className="chat-image-viewer-close"
              onClick={closeImagePreview}
              aria-label="Close image preview"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <img
              src={activeImagePreview.downloadUrl}
              alt={activeImagePreview.name}
            />
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          className="chat-launcher-btn"
          onClick={openChatLauncher}
          aria-label="Open chat"
        >
          <span className="chat-launcher-ping" />
          {unreadCount > 0 && (
            <span className="chat-launcher-badge" aria-label={`${unreadCount} unread chats`}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <FontAwesomeIcon icon={faComments} />
        </button>
      )}
    </div>
  );
};

export default ChatWidget;
