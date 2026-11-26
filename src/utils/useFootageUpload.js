import { useRef, useState } from 'react';
import { createFootageBatch, runFootageQueue } from './uploadFootage';

export default function useFootageUpload({ user, metadata, onComplete, onBusyChange }) {
    const [items, setItems] = useState([]);
    const [uploading, setUploading] = useState(false);
    const running = useRef(false);

    const run = async (queue, targets) => {
        if (running.current) return;
        running.current = true;
        setUploading(true);
        onBusyChange?.(true);

        try {
            await runFootageQueue(targets, (item, changes) => {
                setItems((current) => current.map((entry) => (
                    entry.id === item.id ? { ...entry, ...changes } : entry
                )));
            });
            if (queue.every((item) => item.status === 'complete')) onComplete?.();
        } finally {
            running.current = false;
            setUploading(false);
            onBusyChange?.(false);
        }
    };

    const queue = useRef(null);
    const start = (files) => {
        if (running.current || queue.current) return;
        queue.current = createFootageBatch(files, user, metadata);
        setItems(queue.current.map((item) => ({ ...item })));
        return run(queue.current, queue.current);
    };

    const retry = (id) => {
        const item = queue.current?.find((entry) => entry.id === id && entry.status === 'failed');
        if (item) return run(queue.current, [item]);
    };

    let transferredBytes = 0;
    let totalBytes = 0;
    for (const item of items) {
        transferredBytes += item.bytesTransferred;
        totalBytes += item.file.size;
    }
    let progress = 0;
    if (totalBytes > 0) {
        progress = Math.min(100, Math.floor((transferredBytes / totalBytes) * 100));
    } else if (items.length > 0 && items.every((item) => item.progress === 100)) {
        progress = 100;
    }

    return { items, uploading, progress, start, retry };
}
