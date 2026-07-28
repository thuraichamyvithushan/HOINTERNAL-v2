import firebase, { firestore, storage } from '../firebase';

const buildUploaderName = (user) =>
  user?.displayName || user?.email?.split('@')[0] || 'Influencer';

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

const uploadFileToStorage = ({ file, storagePath, fileKind, onProgressDelta }) =>
  new Promise((resolve, reject) => {
    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(file, {
      contentType: file.type || getFallbackContentType(fileKind)
    });

    let previousBytesTransferred = 0;

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const delta = snapshot.bytesTransferred - previousBytesTransferred;
        previousBytesTransferred = snapshot.bytesTransferred;
        onProgressDelta(delta);
      },
      reject,
      async () => {
        try {
          const mediaUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve({ mediaUrl, storagePath, mediaType: file.type || '', fileKind });
        } catch (error) {
          reject(error);
        }
      }
    );
  });

const saveFootageMetadata = async (payload) => {
  await firestore.collection('footage').add({
    ...payload,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
};

export const uploadFootageFiles = async ({
  files,
  user,
  metadata,
  onProgress = () => {},
  onFileComplete = () => {}
}) => {
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  let uploadedBytes = 0;
  const uploadBatchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const uploadBatchImageCount = files.filter((file) => detectFootageKind(file) === 'image').length;
  const uploadBatchVideoCount = files.length - uploadBatchImageCount;
  const uploadBatchTotal = files.length;

  const updateProgress = (delta) => {
    uploadedBytes += delta;

    if (totalSize > 0) {
      onProgress(Math.min(100, Math.round((uploadedBytes / totalSize) * 100)));
    }
  };

  for (const file of files) {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fileKind = detectFootageKind(file);
    const storagePath = `${fileKind === 'image' ? 'images' : 'videos'}/${user.uid}/${fileName}`;
    let uploadedFile = null;

    try {
      uploadedFile = await uploadFileToStorage({
        file,
        storagePath,
        fileKind,
        onProgressDelta: updateProgress
      });

      await saveFootageMetadata({
        ...metadata,
        userId: user.uid,
        userName: buildUploaderName(user),
        userPhoto: user.photoURL || '',
        originalFileName: file.name,
        videoUrl: uploadedFile.mediaUrl,
        mediaUrl: uploadedFile.mediaUrl,
        mediaType: uploadedFile.mediaType || file.type || '',
        fileKind: uploadedFile.fileKind || fileKind,
        uploadBatchId,
        uploadBatchTotal,
        uploadBatchImageCount,
        uploadBatchVideoCount,
        storagePath: uploadedFile.storagePath
      });

      onFileComplete(file, { fileKind });
    } catch (error) {
      if (uploadedFile?.storagePath) {
        await storage.ref(uploadedFile.storagePath).delete().catch(() => {});
      }

      throw error;
    }
  }

  onProgress(100);
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
