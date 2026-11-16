import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    open,
    title = 'Are you sure you want to submit?',
    message,
    confirmLabel = 'Yes, Submit',
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
    const [internalBusy, setInternalBusy] = useState(false);
    const isBusy = busy || internalBusy;

    const handleConfirm = async () => {
        if (isBusy) return;
        setInternalBusy(true);
        try {
            await onConfirm?.();
        } finally {
            setInternalBusy(false);
        }
    };

    useEffect(() => {
        cancelHandlerRef.current = onCancel;
    }, [onCancel]);

    useEffect(() => {
        if (!open) return undefined;

        const previousOverflow = document.body.style.overflow;
        const handleKeyDown = (event) => {
            if (event.key === 'Escape' && !isBusy) cancelHandlerRef.current();
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', handleKeyDown);
        cancelButtonRef.current?.focus();

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isBusy, open]);

    if (!open) return null;

    return createPortal(
        <div
            className="confirm-dialog-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isBusy) onCancel();
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
                        disabled={isBusy}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className="confirm-dialog-confirm"
                        onClick={handleConfirm}
                        disabled={isBusy}
                    >
                        {isBusy ? (
                            <span className="confirm-dialog-loading">
                                <span className="confirm-dialog-spinner" aria-hidden="true" />
                                Please wait...
                            </span>
                        ) : confirmLabel}
                    </button>
                </div>
            </section>
        </div>,
        document.body
    );
};

export default ConfirmDialog;
