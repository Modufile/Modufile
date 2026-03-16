'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFThumbnail } from './PDFThumbnail';

interface SortablePageProps {
    id: string;
    file: File;
    pageIndex: number;
    rotation: number;
    onRotate: () => void;
    onDelete: () => void;
    label?: string;
    size?: number;
}

export function SortablePage({
    id,
    file,
    pageIndex,
    rotation,
    onRotate,
    onDelete,
    label,
    size,
}: SortablePageProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 50 : 'auto' as const,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="touch-none select-none"
        >
            <PDFThumbnail
                file={file}
                pageIndex={pageIndex}
                rotation={rotation}
                onRotate={onRotate}
                onDelete={onDelete}
                label={label}
                size={size}
            />
        </div>
    );
}
