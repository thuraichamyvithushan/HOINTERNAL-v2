import { useRef, useState } from 'react';
import { createFootageBatch, uploadFootageFile } from './uploadFootage';

const MAX_ACTIVE_UPLOADS = 2;

export default function useFootageUpload({ user, metadata, onComplete, onBusyChange }) {
    const [items, setItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const queue = useRef(null);

    const updateItem = (item, changes) => {
        Object.assign(item, changes);
        setItems((current) => current.map((entry) => (
            entry.id === item.id ? { ...entry, ...changes } : entry
        )));
    };

    const fillUploadSlots = (batch) => {
        while (batch.active < MAX_ACTIVE_UPLOADS && batch.pending.length) {
            const item = batch.pending.shift();
            batch.active++;
            uploadFootageFile(item, updateItem).finally(() => {
                batch.active--;
                fillUploadSlots(batch);
                if (batch.active > 0) return;
                setUploading(false);
                onBusyChange?.(false);
                if (batch.items.every((entry) => entry.status === 'complete')) onComplete?.();
            });
        }
    };

    const enqueue = (batch, targets) => {
        if (batch.active === 0) {
            setUploading(true);
            onBusyChange?.(true);
        }
        batch.pending.push(...targets);
        fillUploadSlots(batch);
    };

    const start = (files) => {
        if (queue.current || !files.length) return;
        const batch = { items: createFootageBatch(files, user, metadata), pending: [], active: 0 };
        queue.current = batch;
        setItems(batch.items.map((item) => ({ ...item })));
        enqueue(batch, batch.items);
    };

    const retry = (id) => {
        const batch = queue.current;
        const item = batch?.items.find((entry) => entry.id === id);
        if (item?.status === 'uploading') item.stopTransfer?.(true);
        if (item?.status === 'failed' || item?.status === 'canceled') {
            updateItem(item, { status: 'queued', error: null });
            enqueue(batch, [item]);
        }
    };

    const cancel = (id) => {
        const item = queue.current?.items.find((entry) => entry.id === id);
        if (item?.status === 'uploading') item.stopTransfer?.(false);
    };

    const remainingItems = items.filter((item) => item.status !== 'canceled');
    let transferredBytes = 0;
    let totalBytes = 0;
    for (const item of remainingItems) {
        transferredBytes += item.bytesTransferred;
        totalBytes += item.file.size;
    }
    let progress = 0;
    if (totalBytes > 0) {
        progress = Math.min(100, Math.floor((transferredBytes / totalBytes) * 100));
    } else if (remainingItems.length > 0 && remainingItems.every((item) => item.progress === 100)) {
        progress = 100;
    }

    return { items, uploading, progress, start, retry, cancel };
}
