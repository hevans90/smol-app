import {
  autoUpdate,
  FloatingOverlay,
  offset,
  useFloating,
} from '@floating-ui/react';
import React, { useEffect, useRef } from 'react';

interface FullScreenDrawerProps {
  isOpen: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

export const ModalDrawer: React.FC<FullScreenDrawerProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    placement: 'bottom', // Drawer slides up from the bottom
    middleware: [offset(0)], // No additional offset
    whileElementsMounted: autoUpdate,
  });

  const drawerRef = useRef<HTMLDivElement | null>(null);

  const handleOverlayClick = (event: React.MouseEvent) => {
    // Close drawer only if the click is on the overlay (not the drawer itself)
    if (
      onClose &&
      drawerRef.current &&
      !drawerRef.current.contains(event.target as Node)
    ) {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Modal Drawer */}
      {isOpen && (
        <FloatingOverlay
          onClick={handleOverlayClick}
          lockScroll
          className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70"
        >
          <div
            ref={(node) => {
              refs.setFloating(node);
              drawerRef.current = node;
            }}
            className="absolute bottom-0 flex h-1/2 w-full flex-col overflow-hidden bg-gray-800 shadow-lg md:max-w-7xl md:rounded-t-xl"
          >
            {/* Close Button */}
            <div className="absolute right-0 flex justify-end p-6">
              <button
                onClick={onClose}
                className="rounded bg-primary-800 px-4 py-2 text-white hover:bg-primary-900"
              >
                Close
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex flex-1 items-center justify-between p-6">
              {children}
            </div>
          </div>
        </FloatingOverlay>
      )}
    </>
  );
};
