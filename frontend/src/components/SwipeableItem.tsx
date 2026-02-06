import React, { useState, useRef, type TouchEvent } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onDelete: () => void;
}

export default function SwipeableItem({ children, onDelete }: SwipeableItemProps) {
    const [offsetX, setOffsetX] = useState(0);
    const startX = useRef<number | null>(null);
    const currentOffsetX = useRef(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const MAX_SWIPE = -80; // Distance to reveal button

    const handleTouchStart = (e: TouchEvent) => {
        startX.current = e.touches[0].clientX;
        // Disable transition during drag for immediate responsiveness
        if (wrapperRef.current) {
            wrapperRef.current.style.transition = 'none';
        }
    };

    const handleTouchMove = (e: TouchEvent) => {
        if (startX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;

        // Allow swiping left (negative) up to a limit, and slightly right if already open
        let newOffset = currentOffsetX.current + diff;

        // Resistance/Limits
        if (newOffset > 0) newOffset = 0; // Can't swipe right past 0
        if (newOffset < -150) newOffset = -150; // Max swipe limit

        setOffsetX(newOffset);
    };

    const handleTouchEnd = () => {
        if (startX.current === null) return;

        // Re-enable transition for smooth snap back
        if (wrapperRef.current) {
            wrapperRef.current.style.transition = 'transform 0.3s ease-out';
        }

        // Logic to snap open or closed
        if (offsetX < MAX_SWIPE / 2) {
            // Snap Open
            setOffsetX(MAX_SWIPE);
            currentOffsetX.current = MAX_SWIPE;
        } else {
            // Snap Closed
            setOffsetX(0);
            currentOffsetX.current = 0;
        }

        startX.current = null;
    };

    return (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Background Action (Delete) */}
            <div
                style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: '100%',
                    backgroundColor: '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '2rem',
                    color: 'white',
                    zIndex: 0
                }}
            >
                <div onClick={onDelete} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <span style={{ fontWeight: 600 }}>Remove</span> <Trash2 />
                </div>
            </div>

            {/* Foreground Content */}
            <div
                ref={wrapperRef}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{
                    transform: `translateX(${offsetX}px)`,
                    position: 'relative',
                    zIndex: 1,
                    background: 'white' // Ensure content has background to cover action
                }}
            >
                {children}
            </div>
        </div>
    );
}
