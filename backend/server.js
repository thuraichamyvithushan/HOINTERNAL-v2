const express = require('express');
require('dotenv').config();
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
const admin = require('firebase-admin');

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

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://hointernal-v2.vercel.app',
    'https://hointernal.com',
    'https://www.hointernal.com',
    process.env.ALLOWED_ORIGIN
].filter(Boolean);

// 1. IMPORTANT: CORS must be the absolute FIRST middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
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

// GET All Footage (Global Feed)
app.get('/api/footage/all', async (req, res) => {
    try {
        const { region } = req.query;
        let query = db.collection('footage').where('visibility', '==', 'public');

        const snapshot = await query.limit(500).get(); // Get more to allow filtering
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

        // Sort in-memory and limit to 100
        videos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        videos = videos.slice(0, 100);

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend server listening on port ${PORT}`);
});

// MUST EXPORT EXPRESS APP FOR VERCEL SERVERLESS FUNCTIONS
module.exports = app;
