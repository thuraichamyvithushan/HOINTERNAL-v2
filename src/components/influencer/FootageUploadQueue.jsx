import React, { useEffect, useRef } from 'react';

const labels = {
    queued: 'Waiting',
    uploading: 'Uploading',
    saving: 'Saving',
    complete: 'Uploaded',
    failed: 'Failed'
};

export default function FootageUploadQueue({ files, items, uploading, inputId, onAdd, onRemove, onRetry, children }) {
    const queueRef = useRef(null);
    const hasStarted = items.length > 0;

    useEffect(() => {
        if (!hasStarted) return;
        queueRef.current.focus({ preventScroll: true });
        queueRef.current.scrollIntoView({ block: 'start' });
    }, [hasStarted]);

    return (
        <div ref={queueRef} tabIndex={hasStarted ? -1 : undefined} role={hasStarted ? 'region' : undefined}
            aria-label={hasStarted ? 'Upload progress' : undefined} className="upload-dropzone footage-upload-queue">
            {children}
            {items.length === 0 && (
                <>
                    <input id={inputId} className="hidden-file-input" type="file" accept="video/*,image/*" multiple
                        onChange={(event) => {
                            onAdd(Array.from(event.target.files));
                            event.target.value = '';
                        }} />
                    <label htmlFor={inputId} className="browse-button">
                        {files.length ? 'Add more photos or videos' : 'Choose photos and videos'}
                    </label>
                </>
            )}
            <ul className="footage-queue-items">
                {items.length === 0 ? files.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                        <span>{file.name}</span>
                        <button type="button" className="change-button" onClick={() => onRemove(index)}
                            aria-label={`Remove ${file.name}`}>Remove</button>
                    </li>
                )) : items.map((item) => (
                    <li key={item.id}>
                        <div className="footage-queue-details">
                            <strong>{item.file.name}</strong>
                            <span>{labels[item.status]} · {item.progress}%</span>
                            <progress value={item.progress} max="100" aria-label={`Upload progress for ${item.file.name}`} />
                            {item.error && <span role="alert">{item.error}</span>}
                        </div>
                        {item.status === 'failed' && (
                            <button type="button" className="change-button" disabled={uploading}
                                onClick={() => onRetry(item.id)}>Retry</button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
