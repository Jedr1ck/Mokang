import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    tone = 'primary',
    icon = 'bi-question-circle',
    busy = false,
    onConfirm,
    onCancel
}) => {
    const cancelButtonRef = useRef(null);
    const cancelHandlerRef = useRef(onCancel);
    const dialogId = useId();

    useEffect(() => {
        cancelHandlerRef.current = onCancel;
    }, [onCancel]);

    useEffect(() => {
        if (!open) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !busy) cancelHandlerRef.current();
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        cancelButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [busy, open]);

    if (!open) return null;

    return createPortal(
        <div
            className="confirm-dialog-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !busy) onCancel();
            }}
        >
            <section
                className={`confirm-dialog confirm-dialog-${tone}`}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby={`${dialogId}-title`}
                aria-describedby={`${dialogId}-message`}
            >
                <span className="confirm-dialog-icon" aria-hidden="true">
                    <i className={`bi ${icon}`} />
                </span>
                <h2 id={`${dialogId}-title`}>{title}</h2>
                <p id={`${dialogId}-message`}>{message}</p>
                <div className="confirm-dialog-actions">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        className="confirm-dialog-cancel"
                        onClick={onCancel}
                        disabled={busy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="confirm-dialog-confirm"
                        onClick={onConfirm}
                        disabled={busy}
                    >
                        {busy ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
