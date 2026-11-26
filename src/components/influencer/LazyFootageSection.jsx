import React, { useEffect, useRef, useState } from 'react';

export default function LazyFootageSection({ children }) {
    const element = useRef(null);
    const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

    useEffect(() => {
        if (visible) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '200px' });
        observer.observe(element.current);
        return () => observer.disconnect();
    }, [visible]);

    return <div ref={element}>{visible ? children : null}</div>;
}
