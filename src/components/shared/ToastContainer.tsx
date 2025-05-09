import React, { useState, useCallback, useEffect } from 'react';
import { Toast, ToastType } from './Toast';
import styles from './ToastContainer.module.css';

export interface ToastData {
  id: string;
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxToasts?: number;
}

type ToastContainerRef = {
  addToast: (toast: Omit<ToastData, 'id'>) => string;
};

let toastContainer: ToastContainerRef | null = null;

export const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (toast: Omit<ToastData, 'id'>) => {
      const id = crypto.randomUUID();
      setToasts(current => {
        const newToasts = [{ ...toast, id }, ...current];
        return newToasts.slice(0, maxToasts);
      });
      return id;
    },
    [maxToasts]
  );

  const removeToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id));
  }, []);

  // Register this instance as the global toast container
  useEffect(() => {
    toastContainer = { addToast };
    return () => {
      toastContainer = null;
    };
  }, [addToast]);

  return (
    <div className={`${styles.container} ${styles[position]}`}>
      {toasts.map(toast => (
        <Toast key={toast.id} {...toast} onDismiss={removeToast} />
      ))}
    </div>
  );
};

export const toast = {
  show: (message: string, type: ToastType = 'info', duration = 5000) => {
    if (!toastContainer) return;
    return toastContainer.addToast({ message, type, duration });
  },
  success: (message: string, duration?: number) => {
    return toast.show(message, 'success', duration);
  },
  error: (message: string, duration?: number) => {
    return toast.show(message, 'error', duration);
  },
  warning: (message: string, duration?: number) => {
    return toast.show(message, 'warning', duration);
  },
  info: (message: string, duration?: number) => {
    return toast.show(message, 'info', duration);
  },
  withAction: (
    message: string,
    action: { label: string; onClick: () => void },
    type: ToastType = 'info'
  ) => {
    if (!toastContainer) return;
    return toastContainer.addToast({ message, type, action, duration: 0 });
  },
};
