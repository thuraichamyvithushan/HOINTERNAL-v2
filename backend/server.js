const express = require('express');
require('dotenv').config();
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');
const crypto = require('crypto');
const http = require('http');
const { Server } = require('socket.io');

// Initialize Firebase Admin SDK
let credential;
try {
    // Try local file for development
    const serviceAccount = require('./serviceAccountKey.json');
    credential = admin.credential.cert(serviceAccount);
} catch (error) {
    // Fallback to Environment Variables for Production (Vercel)
    console.log("serviceAccountKey.json not found. Using Environment Variables for Firebase.");
    credential = admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace literal string "\n" with actual line breaks for the private key to work correctly
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    });
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: credential,
        storageBucket: 'huntsman-optics.firebasestorage.app'
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const app = express();
const supportsSocketServer = !process.env.VERCEL;
const httpServer = supportsSocketServer ? http.createServer(app) : null;

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://hointernal-v2.vercel.app',
    'https://hointernal.com',
    'https://www.hointernal.com',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);

const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true;
    }

    return allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*');
};

const socketCorsOrigin = (origin, callback) => {
    if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
    }

    console.log("Socket.IO CORS blocked origin:", origin);
    callback(null, true);
};

const getSocketUserRoom = (uid) => `user:${uid}`;
const CHAT_NOTIFICATION_TOKENS_FIELD = 'chatNotificationTokens';
const CHAT_PRESENCE_STALE_MS = 90000;
const CHAT_PUSH_FALLBACK_LINK =
    process.env.CHAT_PUSH_LINK_URL || 'https://www.hointernal.com/#/';

const getStableParticipants = (firstUserId, secondUserId) =>
    [firstUserId, secondUserId].sort();

const getConversationId = (firstUserId, secondUserId) =>
    getStableParticipants(firstUserId, secondUserId).join('__');

const getTimestampMs = (value) => {
    if (!value) {
        return Date.now();
    }

    if (typeof value.toMillis === 'function') {
        return value.toMillis();
    }

    if (value.seconds) {
        return value.seconds * 1000;
    }

    const parsedValue = new Date(value).getTime();
    return Number.isNaN(parsedValue) ? Date.now() : parsedValue;
};

const getChatPushLink = (origin) => {
    if (origin && isAllowedOrigin(origin)) {
        return `${origin.replace(/\/$/, '')}/#/`;
    }

    return CHAT_PUSH_FALLBACK_LINK;
};

const shouldSendChatPushNotification = (userData = {}) => {
    const presence = userData.chatPresence || {};
    const lastSeenMs = getTimestampMs(presence.lastSeen);

    return !(
        presence.state === 'online' &&
        lastSeenMs > Date.now() - CHAT_PRESENCE_STALE_MS
    );
};

const getChatPushBodyText = (messageData = {}) => {
    const trimmedText = `${messageData.text || ''}`.trim();

    if (trimmedText) {
        return trimmedText;
    }

    if (messageData.attachment?.category === 'image') {
        return 'Sent you a photo';
    }

    if (messageData.attachment?.name) {
        return `Sent ${messageData.attachment.name}`;
    }

    return 'You have a new message.';
};

const sendChatPushNotification = async ({
    recipientId,
    conversationId,
    senderId,
    senderName,
    text,
    attachment,
    requestOrigin
}) => {
    if (!recipientId || !senderId || recipientId === senderId) {
        return;
    }

    const recipientSnapshot = await db.collection('users').doc(recipientId).get();

    if (!recipientSnapshot.exists) {
        return;
    }

    const recipientData = recipientSnapshot.data() || {};

    if (!shouldSendChatPushNotification(recipientData)) {
        return;
    }

    const tokens = Array.from(
        new Set(
            Array.isArray(recipientData[CHAT_NOTIFICATION_TOKENS_FIELD])
                ? recipientData[CHAT_NOTIFICATION_TOKENS_FIELD].filter(
                    (token) => typeof token === 'string' && token
                )
                : []
        )
    );

    if (tokens.length === 0) {
        return;
    }

    const link = getChatPushLink(requestOrigin);
    const invalidTokens = [];

    await Promise.all(tokens.map(async (token) => {
        try {
            await admin.messaging().send({
                token,
                notification: {
                    title: senderName || 'New chat message',
                    body: getChatPushBodyText({ text, attachment })
                },
                data: {
                    conversationId: conversationId || '',
                    senderId: senderId || '',
                    recipientId: recipientId || '',
                    link
                },
                webpush: {
                    fcmOptions: {
                        link
                    },
                    notification: {
                        tag: `chat-${conversationId || senderId || recipientId}`,
                        renotify: false
                    }
                }
            });
        } catch (error) {
            console.warn('Failed to send chat push notification:', error.message);

            if (
                error?.code === 'messaging/registration-token-not-registered' ||
                error?.code === 'messaging/invalid-registration-token'
            ) {
                invalidTokens.push(token);
            }
        }
    }));

    if (invalidTokens.length > 0) {
        await db.collection('users').doc(recipientId).set(
            {
                [CHAT_NOTIFICATION_TOKENS_FIELD]:
                    admin.firestore.FieldValue.arrayRemove(...invalidTokens)
            },
            { merge: true }
        );
    }
};

let io = null;

if (supportsSocketServer) {
    io = new Server(httpServer, {
        cors: {
            origin: socketCorsOrigin,
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            next(new Error('Authentication required'));
            return;
        }

        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            socket.user = { uid: decodedToken.uid };
            next();
        } catch (error) {
            console.error('Socket authentication failed:', error.message);
            next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const uid = socket.user?.uid;

        if (!uid) {
            socket.disconnect(true);
            return;
        }

        socket.join(getSocketUserRoom(uid));
        socket.emit('chat:socket-ready', { uid });

        socket.on('chat:messages-read', (payload = {}) => {
            const conversationId = payload.conversationId || null;
            const senderId = payload.senderId || null;
            const readAtMs = Number(payload.readAtMs) || Date.now();
            const messageIds = Array.isArray(payload.messageIds)
                ? payload.messageIds.filter((messageId) => typeof messageId === 'string' && messageId)
                : [];

            if (!senderId) {
                return;
            }

            io.to(getSocketUserRoom(senderId)).emit('chat:messages-read', {
                conversationId,
                readerId: uid,
                messageIds,
                readAtMs
            });
        });

        socket.on('disconnect', () => {
            socket.leave(getSocketUserRoom(uid));
        });
    });

    let hasProcessedInitialMessageSnapshot = false;

    db.collectionGroup('messages').onSnapshot(
        (snapshot) => {
            if (!hasProcessedInitialMessageSnapshot) {
                hasProcessedInitialMessageSnapshot = true;
                return;
            }

            snapshot.docChanges().forEach((change) => {
                if (change.type !== 'added') {
                    return;
                }

                const message = change.doc.data();
                const recipientId = message.recipientId;
                const conversationId = change.doc.ref.parent.parent?.id || null;

                if (!recipientId) {
                    return;
                }

                io.to(getSocketUserRoom(recipientId)).emit('chat:new-message', {
                    conversationId,
                    messageId: change.doc.id,
                    senderId: message.senderId || null,
                    senderName: message.senderName || 'Someone',
                    recipientId,
                    text: message.text || '',
                    createdAtMs: getTimestampMs(message.createdAt)
                });
            });
        },
        (error) => {
            console.error('Chat notification snapshot listener failed:', error);
        }
    );
}

// 1. IMPORTANT: CORS must be the absolute FIRST middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            console.log("CORS blocked origin:", origin);
            // Instead of error, we can allow for now to debug or strictly block
            callback(null, true); // Temporarily allow all for debugging or use strict: callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}));

app.use(express.json());

// Root Endpoint for Vercel Browser Testing
app.get('/', (req, res) => {
    res.status(200).send('Huntsman Optics Backend is Live and Running!');
});

// Healthcheck Endpoint for Deployment Monitoring
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    });
});

const resolveFootageStoragePath = (footage = {}) => {
    if (footage.storagePath) {
        return footage.storagePath;
    }

    if (typeof footage.videoUrl === 'string' && footage.videoUrl.startsWith('http')) {
        try {
            const url = new URL(footage.videoUrl);
            const encodedPath = url.pathname.split('/o/')[1];

            if (encodedPath) {
                return decodeURIComponent(encodedPath);
            }
        } catch (error) {
            console.warn('Failed to parse storage path from video URL:', error.message);
        }
    }

    return '';
};

const getBearerToken = (req) => {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice(7).trim();
};

const requireAdminRequest = async (req, res) => {
    const token = getBearerToken(req);

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return null;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const storedRole = userDoc.exists ? userDoc.data()?.role : null;
        const effectiveRole = storedRole || decodedToken.role || null;

        if (effectiveRole !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return null;
        }

        return {
            uid: decodedToken.uid,
            role: effectiveRole
        };
    } catch (error) {
        console.error('Admin auth verification failed:', error);
        res.status(401).json({ error: 'Invalid or expired authentication token' });
        return null;
    }
};

const requireAuthenticatedRequest = async (req, res) => {
    const token = getBearerToken(req);

    if (!token) {
        res.status(401).json({ error: 'Authentication required' });
        return null;
    }

    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const storedUserData = userDoc.exists ? userDoc.data() || {} : {};

        return {
            uid: decodedToken.uid,
            role: storedUserData.role || decodedToken.role || null,
            name: storedUserData.name || decodedToken.name || '',
            email: storedUserData.email || decodedToken.email || '',
            country: storedUserData.country || '',
            displayName:
                storedUserData.displayName ||
                storedUserData.name ||
                decodedToken.name ||
                decodedToken.email ||
                'User'
        };
    } catch (error) {
        console.error('User auth verification failed:', error);
        res.status(401).json({ error: 'Invalid or expired authentication token' });
        return null;
    }
};

const syncChatConversationSummary = async (conversationRef) => {
    const latestMessageSnapshot = await conversationRef
        .collection('messages')
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

    if (latestMessageSnapshot.empty) {
        await conversationRef.set(
            {
                lastMessageId: '',
                lastMessageText: '',
                lastMessageSenderId: '',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
        );
        return;
    }

    const latestMessage = latestMessageSnapshot.docs[0].data();
    const lastMessageText = latestMessage.deletedAt
        ? getDeletedMessageSummaryText(latestMessage)
        : latestMessage.text || '';

    await conversationRef.set(
        {
            lastMessageId: latestMessageSnapshot.docs[0].id,
            lastMessageText,
            lastMessageSenderId: latestMessage.senderId || '',
            updatedAt: latestMessage.createdAt || admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
    );
};

const getDeletedMessageSummaryText = (messageData = {}) => {
    if (messageData.deletedByRole === 'admin' && messageData.deletedBy !== messageData.senderId) {
        return 'Admin deleted this message';
    }

    if (messageData.deletedByName) {
        return `${messageData.deletedByName} deleted this message`;
    }

    return 'User deleted this message';
};

const resolveMessageOwnerId = (conversationData = {}, messageData = {}) => {
    if (messageData.senderId) {
        return messageData.senderId;
    }

    const participants = Array.isArray(conversationData.participants)
        ? conversationData.participants
        : [];

    if (messageData.recipientId) {
        const inferredSenderId = participants.find(
            (participantId) => participantId !== messageData.recipientId
        );

        if (inferredSenderId) {
            return inferredSenderId;
        }
    }

    return null;
};

const fs = require('fs');
const os = require('os');

// Set up Multer using disk storage instead of RAM to prevent server crashes on large videos
// On Vercel, the only writable directory is /tmp, which os.tmpdir() maps to automatically.
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 2000 * 1024 * 1024 }, // 2GB limit
});

app.post('/api/upload', upload.single('video'), async (req, res) => {
    try {
        console.log('1. Parsing body complete:', req.body.originalFileName);
        console.log('Incoming region:', req.body.region);

        const { deviceName, species, activityType, description, location, ausState, userId, userName, userPhoto, originalFileName, visibility, region } = req.body;

        const fileName = `${Date.now()}_${originalFileName}`;
        const storagePath = `videos/${userId}/${fileName}`;
        const file = bucket.file(storagePath);

        console.log(`2. Attempting to save file to bucket (Bucket: ${bucket.name}, Path: ${storagePath})`);

        await bucket.upload(req.file.path, {
            destination: storagePath,
            metadata: {
                contentType: req.file.mimetype,
            },
        });

        // Delete the temporary local file to save disk space
        fs.unlinkSync(req.file.path);

        console.log('3. File saved to bucket successfully. Getting signed URL...');

        // Skip makePublic() because it often causes 500 errors on Uniform Bucket Level Access policies
        // Instead of publicUrl(), we can generate a very long-lived signed URL, or rely on Firebase Storage Token
        const [videoUrl] = await file.getSignedUrl({
            action: 'read',
            expires: '01-01-2099'
        });

        console.log('4. URL obtained:', videoUrl);

        const newDoc = {
            deviceName,
            species,
            activityType,
            description,
            location,
            ausState: ausState || 'Unknown',
            userId,
            userName: userName || 'Anonymous',
            userPhoto: userPhoto || '',
            videoUrl: videoUrl,
            storagePath,
            visibility: visibility || 'public',
            region: region || 'AU', // Default to AU for legacy support
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            originalFileName
        };

        console.log('5. Saving metadata to Firestore...');
        await db.collection('footage').add(newDoc);

        console.log('6. Operation completely finished. Returning 200.');
        res.status(200).json({ success: true, videoUrl });
    } catch (error) {
        console.error('------- BACKEND ERROR TRACE -------');
        console.error(error);
        console.error('-----------------------------------');
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

app.post('/api/chat/conversations/:conversationId/messages', async (req, res) => {
    const requester = await requireAuthenticatedRequest(req, res);

    if (!requester) {
        return;
    }

    try {
        const { conversationId } = req.params;
        const recipientId = `${req.body?.recipientId || ''}`.trim();
        const messageId = `${req.body?.messageId || ''}`.trim();
        const text = `${req.body?.text || ''}`.trim();
        const attachment =
            req.body?.attachment && typeof req.body.attachment === 'object'
                ? req.body.attachment
                : null;
        const replyTo =
            req.body?.replyTo && typeof req.body.replyTo === 'object'
                ? req.body.replyTo
                : null;

        if (!recipientId) {
            return res.status(400).json({ error: 'Recipient is required' });
        }

        if (recipientId === requester.uid) {
            return res.status(400).json({ error: 'You cannot message yourself' });
        }

        if (!text && !attachment) {
            return res.status(400).json({ error: 'Message text or attachment is required' });
        }

        const expectedConversationId = getConversationId(requester.uid, recipientId);

        if (conversationId !== expectedConversationId) {
            return res.status(400).json({ error: 'Conversation ID does not match participants' });
        }

        const recipientSnapshot = await db.collection('users').doc(recipientId).get();

        if (!recipientSnapshot.exists) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const recipientData = recipientSnapshot.data() || {};
        const conversationRef = db.collection('chatConversations').doc(conversationId);
        const conversationSnapshot = await conversationRef.get();
        const existingConversationData = conversationSnapshot.exists
            ? conversationSnapshot.data() || {}
            : {};
        const participants = Array.isArray(existingConversationData.participants) &&
            existingConversationData.participants.includes(requester.uid) &&
            existingConversationData.participants.includes(recipientId)
            ? existingConversationData.participants
            : getStableParticipants(requester.uid, recipientId);
        const finalMessageRef = messageId
            ? conversationRef.collection('messages').doc(messageId)
            : conversationRef.collection('messages').doc();
        const lastMessageText =
            text ||
            attachment?.name ||
            (attachment?.category === 'image' ? 'Photo' : 'Attachment');
        const batch = db.batch();

        batch.set(conversationRef, {
            participants,
            participantProfiles: {
                ...(existingConversationData.participantProfiles || {}),
                [requester.uid]: {
                    id: requester.uid,
                    name: requester.displayName,
                    email: requester.email || '',
                    role: requester.role || 'user',
                    country: requester.country || ''
                },
                [recipientId]: {
                    id: recipientId,
                    name:
                        recipientData.name ||
                        recipientData.displayName ||
                        recipientData.email ||
                        'User',
                    email: recipientData.email || '',
                    role: recipientData.role || 'user',
                    country: recipientData.country || ''
                }
            },
            lastMessageId: finalMessageRef.id,
            lastMessageText,
            lastMessageSenderId: requester.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        if (!conversationSnapshot.exists) {
            batch.set(conversationRef, {
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }

        batch.set(finalMessageRef, {
            clientMessageId: `${req.body?.clientMessageId || ''}`.trim() || null,
            text,
            attachment,
            replyTo,
            senderId: requester.uid,
            senderName: requester.displayName,
            recipientId,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        batch.set(conversationRef, {
            readStates: {
                [requester.uid]: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true });

        await batch.commit();
        await sendChatPushNotification({
            recipientId,
            conversationId,
            senderId: requester.uid,
            senderName: requester.displayName,
            text,
            attachment,
            requestOrigin: req.headers.origin || ''
        });

        res.status(200).json({
            success: true,
            messageId: finalMessageRef.id
        });
    } catch (error) {
        console.error('Failed to send chat message via API:', error);
        res.status(500).json({ error: error.message || 'Failed to send message' });
    }
});

app.patch('/api/chat/conversations/:conversationId/messages/:messageId', async (req, res) => {
    const requester = await requireAuthenticatedRequest(req, res);

    if (!requester) {
        return;
    }

    try {
        const { conversationId, messageId } = req.params;
        const nextText = `${req.body?.text || ''}`.trim();

        if (!nextText) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        const conversationRef = db.collection('chatConversations').doc(conversationId);
        const messageRef = conversationRef.collection('messages').doc(messageId);
        const [conversationSnapshot, messageSnapshot] = await Promise.all([
            conversationRef.get(),
            messageRef.get()
        ]);

        if (!conversationSnapshot.exists || !messageSnapshot.exists) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const conversationData = conversationSnapshot.data() || {};
        const messageData = messageSnapshot.data() || {};
        const participants = Array.isArray(conversationData.participants)
            ? conversationData.participants
            : [];

        if (!participants.includes(requester.uid)) {
            return res.status(403).json({ error: 'Conversation access denied' });
        }

        const ownerId = resolveMessageOwnerId(conversationData, messageData);
        const canManageMessage = requester.role === 'admin' || ownerId === requester.uid;

        if (!canManageMessage) {
            return res.status(403).json({ error: 'You cannot edit this message' });
        }

        if (messageData.deletedAt) {
            return res.status(400).json({ error: 'Deleted messages cannot be edited' });
        }

        const updatePayload = {
            text: nextText,
            editedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        if (!messageData.senderId && ownerId) {
            updatePayload.senderId = ownerId;
        }

        await messageRef.update(updatePayload);
        await syncChatConversationSummary(conversationRef);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to edit chat message via API:', error);
        res.status(500).json({ error: error.message || 'Failed to edit message' });
    }
});

app.delete('/api/chat/conversations/:conversationId/messages/:messageId', async (req, res) => {
    const requester = await requireAuthenticatedRequest(req, res);

    if (!requester) {
        return;
    }

    try {
        const { conversationId, messageId } = req.params;
        const conversationRef = db.collection('chatConversations').doc(conversationId);
        const messageRef = conversationRef.collection('messages').doc(messageId);
        const [conversationSnapshot, messageSnapshot] = await Promise.all([
            conversationRef.get(),
            messageRef.get()
        ]);

        if (!conversationSnapshot.exists || !messageSnapshot.exists) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const conversationData = conversationSnapshot.data() || {};
        const messageData = messageSnapshot.data() || {};
        const participants = Array.isArray(conversationData.participants)
            ? conversationData.participants
            : [];

        if (!participants.includes(requester.uid)) {
            return res.status(403).json({ error: 'Conversation access denied' });
        }

        const ownerId = resolveMessageOwnerId(conversationData, messageData);
        const canManageMessage = requester.role === 'admin' || ownerId === requester.uid;

        if (!canManageMessage) {
            return res.status(403).json({ error: 'You cannot delete this message' });
        }

        if (messageData.deletedAt) {
            return res.status(200).json({ success: true });
        }

        if (messageData.attachment?.storagePath) {
            await bucket.file(messageData.attachment.storagePath).delete({ ignoreNotFound: true }).catch((error) => {
                console.warn('Failed to delete chat attachment from storage:', error.message);
            });
        }

        const deletePayload = {
            text: '',
            attachment: null,
            deletedAt: admin.firestore.FieldValue.serverTimestamp(),
            deletedBy: requester.uid,
            deletedByName:
                requester.role === 'admin' && requester.uid !== ownerId
                    ? 'Admin'
                    : requester.name || requester.email || 'User',
            deletedByRole: requester.role || 'user'
        };

        if (!messageData.senderId && ownerId) {
            deletePayload.senderId = ownerId;
        }

        await messageRef.update(deletePayload);
        await syncChatConversationSummary(conversationRef);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to delete chat message via API:', error);
        res.status(500).json({ error: error.message || 'Failed to delete message' });
    }
});

app.post('/api/chat/conversations/:conversationId/clear', async (req, res) => {
    const requester = await requireAuthenticatedRequest(req, res);

    if (!requester) {
        return;
    }

    try {
        const { conversationId } = req.params;
        const conversationRef = db.collection('chatConversations').doc(conversationId);
        const conversationSnapshot = await conversationRef.get();

        if (!conversationSnapshot.exists) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        const conversationData = conversationSnapshot.data() || {};
        const participants = Array.isArray(conversationData.participants)
            ? conversationData.participants
            : [];

        if (!participants.includes(requester.uid)) {
            return res.status(403).json({ error: 'Conversation access denied' });
        }

        await conversationRef.set(
            {
                clearStates: {
                    [requester.uid]: admin.firestore.FieldValue.serverTimestamp()
                }
            },
            { merge: true }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Failed to clear chat conversation via API:', error);
        res.status(500).json({ error: error.message || 'Failed to clear chat' });
    }
});

app.post('/api/footage', async (req, res) => {
    try {
        const {
            deviceName,
            species,
            activityType,
            description,
            location,
            ausState,
            userId,
            userName,
            userPhoto,
            originalFileName,
            visibility,
            region,
            videoUrl,
            storagePath
        } = req.body;

        if (!userId || !videoUrl || !storagePath || !originalFileName) {
            return res.status(400).json({
                error: 'userId, videoUrl, storagePath, and originalFileName are required'
            });
        }

        const newDoc = {
            deviceName: deviceName || '',
            species: species || '',
            activityType: activityType || 'hunting',
            description: description || '',
            location: location || '',
            ausState: ausState || 'Unknown',
            userId,
            userName: userName || 'Anonymous',
            userPhoto: userPhoto || '',
            videoUrl,
            storagePath,
            visibility: visibility || 'public',
            region: region || 'AU',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            originalFileName
        };

        await db.collection('footage').add(newDoc);

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error saving footage metadata:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET All Footage (Global Feed)
app.get('/api/footage/all', async (req, res) => {
    try {
        const { region } = req.query;
        let query = db.collection('footage').where('visibility', '==', 'public');

        const snapshot = await query.get();
        console.log(`Initial fetched ${snapshot.size} public videos`);

        let videos = snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = null;
            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate().toISOString();
                } else {
                    createdAt = new Date(data.createdAt).toISOString();
                }
            }
            return {
                id: doc.id,
                ...data,
                createdAt
            };
        });

        // In-memory regional filtering to support legacy data (where region is missing)
        if (region === 'AU') {
            videos = videos.filter(v => v.region === 'AU' || !v.region);
        } else if (region === 'NZ') {
            videos = videos.filter(v => v.region === 'NZ');
        }

        console.log(`Returning ${videos.length} videos after regional filtering`);

        // Sort in-memory to avoid extra index requirements while returning the full public feed.
        videos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching global footage:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET Footage by UserId
app.get('/api/footage/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { visibility } = req.query;

        let query = db.collection('footage').where('userId', '==', userId);

        if (visibility) {
            query = query.where('visibility', '==', visibility);
        }

        const snapshot = await query.get();

        const videos = snapshot.docs.map(doc => {
            const data = doc.data();
            let createdAt = null;
            if (data.createdAt) {
                if (typeof data.createdAt.toDate === 'function') {
                    createdAt = data.createdAt.toDate().toISOString();
                } else {
                    createdAt = new Date(data.createdAt).toISOString();
                }
            }
            return {
                id: doc.id,
                ...data,
                createdAt
            };
        });

        // Sort in-memory to avoid index requirement
        videos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching footage:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/footage/download/:id', async (req, res) => {
    try {
        const adminUser = await requireAdminRequest(req, res);

        if (!adminUser) {
            return;
        }

        const { id } = req.params;
        const { downloadName } = req.query;
        const docRef = db.collection('footage').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Footage not found' });
        }

        const data = doc.data();
        const storagePath = resolveFootageStoragePath(data);

        if (!storagePath) {
            return res.status(400).json({ error: 'Storage path not available for this file' });
        }

        const storageFile = bucket.file(storagePath);
        const [exists] = await storageFile.exists();

        if (!exists) {
            return res.status(404).json({ error: 'Storage file not found' });
        }

        const [metadata] = await storageFile.getMetadata();
        const resolvedDownloadName = typeof downloadName === 'string' && downloadName.trim()
            ? downloadName.trim()
            : (data.originalFileName || storagePath.split('/').pop() || `footage-${id}`);

        res.setHeader('Content-Disposition', `attachment; filename="${resolvedDownloadName.replace(/"/g, '')}"`);
        res.setHeader('Content-Type', metadata.contentType || 'application/octet-stream');
        if (metadata.size) {
            res.setHeader('Content-Length', metadata.size);
        }

        storageFile.createReadStream()
            .on('error', (error) => {
                console.error('Storage download stream error:', error);

                if (!res.headersSent) {
                    res.status(500).json({ error: 'Failed to stream file download' });
                } else {
                    res.destroy(error);
                }
            })
            .pipe(res);
    } catch (error) {
        console.error('Error downloading footage:', error);
        res.status(500).json({ error: error.message });
    }
});

// Check if user exists by email (For Forgot Password)
app.get('/api/check-user', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        try {
            await admin.auth().getUserByEmail(email);
            res.status(200).json({ exists: true });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                res.status(200).json({ exists: false });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error checking user:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET All Users for Admin Console
app.get('/api/users', async (req, res) => {
    try {
        const snapshot = await db.collection('users').get();
        const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE User from Auth and Firestore
app.delete('/api/users/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        console.log(`[DELETE USER REQUEST] Attempting to delete user UID: ${uid}`);

        // 1. Delete from Firebase Auth
        try {
            await admin.auth().deleteUser(uid);
            console.log(`[DELETE USER INFO] Deleted user ${uid} from Auth.`);
        } catch (authErr) {
            // If user doesn't exist in Auth, we might still want to delete from Firestore if it exists there
            if (authErr.code === 'auth/user-not-found') {
                console.warn(`[DELETE USER WARNING] User ${uid} not found in Auth, continuing to Firestore deletion.`);
            } else {
                console.error(`[DELETE USER ERROR] Auth deletion failed for ${uid}:`, authErr.message);
                throw authErr;
            }
        }

        // 2. Delete from Firestore
        await db.collection('users').doc(uid).delete();
        console.log(`[DELETE USER INFO] Deleted user ${uid} from Firestore.`);

        res.status(200).json({ success: true, message: 'User deleted from Auth and Firestore successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET Network Summary (Grouped by State)
app.get('/api/network-summary', async (req, res) => {
    try {
        const { region } = req.query;
        let query = db.collection('footage').where('visibility', '==', 'public');

        const footageSnapshot = await query.get();
        let footageList = footageSnapshot.docs.map(doc => doc.data());

        // In-memory regional filtering for legacy data
        if (region === 'AU') {
            footageList = footageList.filter(v => v.region === 'AU' || !v.region);
        } else if (region === 'NZ') {
            footageList = footageList.filter(v => v.region === 'NZ');
        }

        // Group by State
        const stateGroups = {};

        // 1. Find all unique UIDs that are missing userName
        const missingUids = [...new Set(footageList.filter(v => !v.userName || v.userName === 'Anonymous').map(v => v.userId))];

        // 2. Resolve these UIDs from Firebase Auth
        const resolvedMap = {};
        await Promise.all(missingUids.map(async (uid) => {
            try {
                const userRec = await admin.auth().getUser(uid);
                resolvedMap[uid] = {
                    name: userRec.displayName || userRec.email?.split('@')[0] || 'Influencer',
                    photo: userRec.photoURL || ''
                };
            } catch (e) {
                resolvedMap[uid] = { name: 'Anonymous Influencer', photo: '' };
            }
        }));

        footageList.forEach(video => {
            const state = video.ausState || 'Unknown';
            if (!stateGroups[state]) {
                stateGroups[state] = {
                    stateName: state,
                    videoCount: 0,
                    influencers: {}
                };
            }
            stateGroups[state].videoCount++;

            const uid = video.userId;
            if (!stateGroups[state].influencers[uid]) {
                const hasName = video.userName && video.userName !== 'Anonymous';
                stateGroups[state].influencers[uid] = {
                    name: hasName ? video.userName : (resolvedMap[uid]?.name || 'Anonymous'),
                    photo: hasName ? video.userPhoto : (resolvedMap[uid]?.photo || ''),
                    posts: 0
                };
            }
            stateGroups[state].influencers[uid].posts++;
        });

        const summaryData = Object.values(stateGroups).map(group => ({
            stateName: group.stateName,
            videoCount: group.videoCount,
            influencerCount: Object.keys(group.influencers).length,
            activeUsers: Object.values(group.influencers).sort((a, b) => b.posts - a.posts)
        }));

        summaryData.sort((a, b) => b.videoCount - a.videoCount);
        res.status(200).json(summaryData);
    } catch (error) {
        console.error('Error fetching summary:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE Footage
app.delete('/api/footage/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`[DELETE REQUEST] Attempting to delete footage ID: ${id}`);
        const docRef = db.collection('footage').doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.error(`[DELETE ERROR] Footage ID ${id} does not exist in Firestore`);
            return res.status(404).json({ error: 'Footage not found' });
        }

        const data = doc.data();
        console.log(`[DELETE INFO] Found document. Video URL: ${data.videoUrl}`);

        // 1. Delete from Storage if videoUrl exists and is internal
        if (data.videoUrl && typeof data.videoUrl === 'string' && data.videoUrl.startsWith('http')) {
            try {
                const url = new URL(data.videoUrl);
                // The pathname for a storage URL usually looks like /v0/b/BUCKET/o/PATH
                const pathParts = url.pathname.split('/o/')[1]?.split('?')[0];
                if (pathParts) {
                    const filePath = decodeURIComponent(pathParts);
                    console.log(`Attempting to delete storage file: ${filePath}`);
                    await bucket.file(filePath).delete();
                }
            } catch (storageErr) {
                console.warn('Non-critical: Could not delete storage file:', storageErr.message);
                // We don't fail the whole request if storage delete fails
            }
        } else if (data.storagePath) {
            // Fallback to storagePath if it was stored directly
            try {
                await bucket.file(data.storagePath).delete();
            } catch (err) {
                console.warn('Non-critical: Could not delete via storagePath:', err.message);
            }
        }

        // 2. Delete from Firestore
        await docRef.delete();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error deleting footage:', error);
        res.status(500).json({ error: error.message });
    }
});

// PATCH (Edit) Footage
app.patch('/api/footage/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const docRef = db.collection('footage').doc(id);
        await docRef.update({
            ...updates,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error updating footage:', error);
        res.status(500).json({ error: error.message });
    }
});


// POST Service Request Email
app.post('/api/service-request', async (req, res) => {
    try {
        const { fullName, email, phone, serviceType, message, country } = req.body;

        console.log(`[SERVICE REQUEST] New request from ${fullName} (${email}) for ${serviceType}`);

        // Create a transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Email contents
        const mailOptions = {
            from: `"Huntsman Portal" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
            replyTo: email,
            subject: `New Service Request: ${serviceType} from ${fullName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; line-height: 1.6; color: #333;">
                    <div style="background: #1a1a1a; padding: 20px; text-align: center;">
                        <h2 style="color: #c21b29; margin: 0;">New Service Request</h2>
                    </div>
                    <div style="padding: 20px; border: 1px solid #eee;">
                        <p><strong>Customer Details:</strong></p>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Name:</strong> ${fullName}</li>
                            <li><strong>Email:</strong> ${email}</li>
                            <li><strong>Phone:</strong> ${phone}</li>
                            <li><strong>Region:</strong> ${country || 'N/A'}</li>
                        </ul>
                        <hr style="border: none; border-top: 1px solid #eee;" />
                        <p><strong>Service Requested:</strong> <span style="color: #c21b29; font-weight: bold;">${serviceType}</span></p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #c21b29;">
                            ${message}
                        </div>
                    </div>
                    <div style="padding: 10px; font-size: 12px; color: #777; text-align: center;">
                        This request was sent from the Huntsman Optics Internal Portal.
                    </div>
                </div>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        console.log('[SERVICE REQUEST] Email sent successfully');
        res.status(200).json({ success: true, message: 'Request sent successfully' });

    } catch (error) {
        console.error('Error handling service request:', error);
        res.status(500).json({ error: 'Failed to send service request. Please try again later.' });
    }
});

//new codes by mn
// CREATE INVITE LINK
// app.post('/api/invites', async (req, res) => {
//     try {
//         const { email, role, country } = req.body;

//         if (!email || !role || !country) {
//             return res.status(400).json({
//                 error: 'Email, role, and country are required'
//             });
//         }

//         const normalizedEmail = email.toLowerCase().trim();

//         const token = crypto.randomBytes(32).toString('hex');
//         const tokenHash = crypto
//             .createHash('sha256')
//             .update(token)
//             .digest('hex');

//         const expiresAt = new Date();
//         expiresAt.setDate(expiresAt.getDate() + 7);

//         const inviteRef = await db.collection('invites').add({
//             email: normalizedEmail,
//             role,
//             country,
//             tokenHash,
//             status: 'pending',
//             createdAt: admin.firestore.FieldValue.serverTimestamp(),
//             expiresAt,
//             usedBy: null,
//             usedAt: null
//         });

//         const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

//         const inviteLink = `${frontendUrl}/#/accept-invite?inviteId=${inviteRef.id}&token=${token}`;

//         res.status(200).json({
//             success: true,
//             inviteLink
//         });

//     } catch (error) {
//         console.error('Error creating invite:', error);
//         res.status(500).json({ error: error.message });
//     }
// });

// CREATE INVITE LINK + SEND EMAIL
app.post('/api/invites', async (req, res) => {
    try {
        const { email, role, country } = req.body;

        if (!email || !role || !country) {
            return res.status(400).json({
                error: 'Email, role, and country are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const inviteRef = await db.collection('invites').add({
            email: normalizedEmail,
            role,
            country,
            tokenHash,
            status: 'pending',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
            usedBy: null,
            usedAt: null
        });

        const frontendUrl = process.env.FRONTEND_URL || 'https://hointernal.com';

        // Important: HashRouter needs /#/
        const inviteLink = `${frontendUrl}/#/accept-invite?inviteId=${inviteRef.id}&token=${token}`;

        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Huntsman Optics Portal" <${process.env.EMAIL_USER}>`,
            to: normalizedEmail,
            subject: 'You are invited to Huntsman Optics Internal Portal',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #333;">
                    <div style="background: #1a1a1a; padding: 24px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0;">Huntsman Optics</h2>
                        <p style="color: #c21b29; margin: 8px 0 0;">Internal Portal Invitation</p>
                    </div>

                    <div style="padding: 28px; border: 1px solid #eee;">
                        <h3 style="margin-top: 0;">You have been invited</h3>

                        <p>
                            You have been invited to join the Huntsman Optics Internal Portal.
                        </p>

                        <p>
                            Your assigned role is <strong>${role}</strong> and your region is <strong>${country}</strong>.
                        </p>

                        <p>
                            Please click the button below to create your account.
                        </p>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${inviteLink}"
                               style="background: #c21b29; color: #ffffff; padding: 14px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                                Accept Invite
                            </a>
                        </div>

                        <p style="font-size: 13px; color: #777;">
                            This invitation will expire in 7 days.
                        </p>

                        <p style="font-size: 13px; color: #777;">
                            If the button does not work, copy and paste this link into your browser:
                        </p>

                        <p style="font-size: 13px; word-break: break-all;">
                            ${inviteLink}
                        </p>
                    </div>

                    <div style="padding: 14px; font-size: 12px; color: #777; text-align: center;">
                        This email was sent from the Huntsman Optics Internal Portal.
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            inviteLink,
            message: 'Invite created and email sent successfully'
        });

    } catch (error) {
        console.error('Error creating invite:', error);
        res.status(500).json({ error: error.message });
    }
});


// ACCEPT INVITE
app.post('/api/invites/accept', async (req, res) => {
    try {
        const { inviteId, token, uid, name } = req.body;

        if (!inviteId || !token || !uid) {
            return res.status(400).json({
                error: 'Invite ID, token, and UID are required'
            });
        }

        const inviteRef = db.collection('invites').doc(inviteId);
        const inviteSnap = await inviteRef.get();

        if (!inviteSnap.exists) {
            return res.status(404).json({ error: 'Invite not found' });
        }

        const invite = inviteSnap.data();

        if (invite.status !== 'pending') {
            return res.status(400).json({ error: 'Invite already used' });
        }

        if (invite.expiresAt.toDate() < new Date()) {
            return res.status(400).json({ error: 'Invite expired' });
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        if (tokenHash !== invite.tokenHash) {
            return res.status(400).json({ error: 'Invalid invite token' });
        }

        const userRecord = await admin.auth().getUser(uid);

        if (
            !userRecord.email ||
            userRecord.email.toLowerCase() !== invite.email.toLowerCase()
        ) {
            return res.status(403).json({
                error: 'This invite is only valid for the invited email address'
            });
        }

        await admin.auth().setCustomUserClaims(uid, {
            role: invite.role,
            country: invite.country
        });

        await db.collection('users').doc(uid).set(
            {
                name: name || userRecord.displayName || '',
                email: invite.email,
                role: invite.role,
                country: invite.country,
                status: 'active',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            },
            { merge: true }
        );

        await inviteRef.update({
            status: 'used',
            usedBy: uid,
            usedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            success: true,
            message: 'Invite accepted successfully'
        });

    } catch (error) {
        console.error('Error accepting invite:', error);
        res.status(500).json({ error: error.message });
    }
});


// GET ALL INVITES
app.get('/api/invites', async (req, res) => {
    try {
        const snapshot = await db
            .collection('invites')
            .orderBy('createdAt', 'desc')
            .get();

        const invites = snapshot.docs.map(doc => {
            const data = doc.data();

            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.().toISOString() || null,
                expiresAt: data.expiresAt?.toDate?.().toISOString() || null,
                usedAt: data.usedAt?.toDate?.().toISOString() || null
            };
        });

        res.status(200).json(invites);

    } catch (error) {
        console.error('Error fetching invites:', error);
        res.status(500).json({ error: error.message });
    }
});


// CANCEL INVITE
app.patch('/api/invites/:inviteId/cancel', async (req, res) => {
    try {
        const { inviteId } = req.params;

        await db.collection('invites').doc(inviteId).update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json({
            success: true,
            message: 'Invite cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling invite:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
    const server = httpServer || app;
    server.listen(PORT, () => {
        const socketState = supportsSocketServer ? ' with Socket.IO enabled' : '';
        console.log(`Backend server listening on port ${PORT}${socketState}`);
    });
}

// MUST EXPORT EXPRESS APP FOR VERCEL SERVERLESS FUNCTIONS
module.exports = app;
