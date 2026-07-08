import firebase, { firestore, storage } from '../firebase';

const buildUploaderName = (user) =>
  user?.displayName || user?.email?.split('@')[0] || 'Influencer';

const uploadFileToStorage = ({ file, storagePath, onProgressDelta }) =>
  new Promise((resolve, reject) => {
    const storageRef = storage.ref(storagePath);
    const uploadTask = storageRef.put(file, {
      contentType: file.type || 'video/mp4'
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
          const videoUrl = await uploadTask.snapshot.ref.getDownloadURL();
          resolve({ videoUrl, storagePath });
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

  const updateProgress = (delta) => {
    uploadedBytes += delta;

    if (totalSize > 0) {
      onProgress(Math.min(100, Math.round((uploadedBytes / totalSize) * 100)));
    }
  };

  for (const file of files) {
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storagePath = `videos/${user.uid}/${fileName}`;
    let uploadedFile = null;

    try {
      uploadedFile = await uploadFileToStorage({
        file,
        storagePath,
        onProgressDelta: updateProgress
      });

      await saveFootageMetadata({
        ...metadata,
        userId: user.uid,
        userName: buildUploaderName(user),
        userPhoto: user.photoURL || '',
        originalFileName: file.name,
        videoUrl: uploadedFile.videoUrl,
        storagePath: uploadedFile.storagePath
      });

      onFileComplete(file);
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
