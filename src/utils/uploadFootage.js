import firebase, { firestore, storage } from '../firebase';

const buildUploaderName = (user) =>
  user?.name || user?.displayName || user?.email?.split('@')[0] || 'Influencer';

const IMAGE_FILE_PATTERN = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|webp)$/i;
const VIDEO_FILE_PATTERN = /\.(3gp|avi|m4v|mkv|mov|mp4|mpeg|mpg|webm)$/i;

export const detectFootageKind = (fileLike = {}) => {
  const mediaType = fileLike.mediaType || fileLike.contentType || fileLike.type || '';

  if (mediaType.startsWith('image/')) {
    return 'image';
  }

  if (mediaType.startsWith('video/')) {
    return 'video';
  }

  const fileName = (
    fileLike.originalFileName ||
    fileLike.name ||
    fileLike.mediaUrl ||
    fileLike.videoUrl ||
    ''
  ).toLowerCase();

  if (IMAGE_FILE_PATTERN.test(fileName)) {
    return 'image';
  }

  if (VIDEO_FILE_PATTERN.test(fileName)) {
    return 'video';
  }

  return 'video';
};

const getFallbackContentType = (fileKind) =>
  fileKind === 'image' ? 'image/jpeg' : 'video/mp4';

const uploadFileToStorage = async (item, update) => {
  let restartRequested;
  do {
    restartRequested = false;
    update({ status: 'uploading', progress: 0, bytesTransferred: 0, error: null });
    try {
      return await new Promise((resolve, reject) => {
        const task = storage.ref(item.storagePath).put(item.file, {
          contentType: item.file.type || getFallbackContentType(item.fileKind)
        });

        let stopping = false;
        const stopTransfer = (restart) => {
          if (!task.cancel()) return;
          stopping = true;
          restartRequested = restart;
          update({ status: restart ? 'retrying' : 'canceling' });
        };
        item.stopTransfer = stopTransfer;
        task.on('state_changed', ({ bytesTransferred, totalBytes }) => {
          if (stopping || item.stopTransfer !== stopTransfer) return;
          const progress = totalBytes ? Math.round((bytesTransferred / totalBytes) * 100) : 0;
          update({ bytesTransferred, progress });
        }, reject, () => resolve(task.snapshot.ref));
      });
    } catch (error) {
      if (!restartRequested) throw error;
    } finally {
      delete item.stopTransfer;
    }
  } while (restartRequested);
};

export const createFootageBatch = (files, user, metadata) => {
  const collection = firestore.collection('footage');
  const uploadBatchId = collection.doc().id;
  const kinds = files.map(detectFootageKind);
  const uploadBatchImageCount = kinds.filter((kind) => kind === 'image').length;

  return files.map((file, index) => {
    const doc = collection.doc();
    const fileKind = kinds[index];
    const folder = fileKind === 'image' ? 'images' : 'videos';
    const safeName = file.name.replace(/[\\/\s]+/g, '_');
    const storagePath = `${folder}/${user.uid}/${doc.id}_${safeName}`;

    return {
      id: doc.id, doc, file, fileKind, storagePath, status: 'queued', progress: 0, bytesTransferred: 0,
      metadata: {
        ...metadata,
        userId: user.uid,
        userName: buildUploaderName(user),
        userPhoto: user.photoURL || user.profilePicture || '',
        originalFileName: file.name,
        mediaType: file.type || getFallbackContentType(fileKind),
        fileKind,
        uploadBatchId,
        uploadBatchTotal: files.length,
        uploadBatchImageCount,
        uploadBatchVideoCount: files.length - uploadBatchImageCount,
        storagePath
      }
    };
  });
};

const saveFootageMetadata = async (item) => {
  try {
    await item.doc.set({
      ...item.metadata,
      videoUrl: item.mediaUrl,
      mediaUrl: item.mediaUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    // A previous attempt may have committed before the client lost its connection.
    const existing = await item.doc.get({ source: 'server' }).catch(() => null);
    if (existing?.data()?.storagePath !== item.storagePath) throw error;
  }
};

export const uploadFootageFile = async (item, onChange) => {
  const update = (changes) => onChange(item, changes);

  try {
    if (!item.storageRef) item.storageRef = await uploadFileToStorage(item, update);
    update({ status: 'saving', progress: 100, bytesTransferred: item.file.size, error: null });
    item.mediaUrl ||= await item.storageRef.getDownloadURL();
    await saveFootageMetadata(item);
    update({ status: 'complete' });
  } catch (error) {
    if (item.status === 'canceling' && error?.code === 'storage/canceled') {
      update({ status: 'canceled', progress: 0, bytesTransferred: 0 });
      return;
    }
    update({ status: 'failed', error: getUploadErrorMessage(error) });
  }
};

export const getUploadErrorMessage = (error) => {
  if (error?.code === 'storage/unauthorized') {
    return 'Upload blocked by Firebase Storage rules. Please sign in again or contact an admin.';
  }

  if (error?.code === 'storage/canceled') {
    return 'Upload canceled before it finished.';
  }

  if (error?.code === 'permission-denied') {
    return 'Upload saved to storage, but Firestore blocked the footage record. Please check Firestore rules.';
  }

  if (error?.message) {
    return error.message;
  }

  return 'One or more uploads failed. Please try again.';
};
