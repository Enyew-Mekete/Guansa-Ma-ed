import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  maxWidthClass = 'max-w-2xl',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[90dvh] w-full ${maxWidthClass} overflow-y-auto rounded-2xl border-2 border-[#159E37] bg-white text-[#344BC2] shadow-2xl`}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#159E37] bg-white px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </div>,
    document.body,
  );
};
