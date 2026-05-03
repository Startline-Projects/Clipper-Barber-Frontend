import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  show: (type: ToastType, message: string, duration?: number) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION = 3500;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  show: (type, message, duration = DEFAULT_DURATION) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message, duration }] }));
    return id;
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().show('success', message, duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().show('error', message, duration ?? 4500),
  info: (message: string, duration?: number) =>
    useToastStore.getState().show('info', message, duration),
};
