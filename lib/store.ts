import { create } from 'zustand';
import { Extension, TimeRange } from './types';

interface AppState {
  extensions: Extension[];
  selectedTimeRange: TimeRange;
  setExtensions: (extensions: Extension[]) => void;
  addExtension: (extension: Extension) => void;
  removeExtension: (id: string) => void;
  setTimeRange: (range: TimeRange) => void;
}

export const useStore = create<AppState>((set) => ({
  extensions: [],
  selectedTimeRange: 'week',
  setExtensions: (extensions) => set({ extensions }),
  addExtension: (extension) =>
    set((state) => ({ extensions: [...state.extensions, extension] })),
  removeExtension: (id) =>
    set((state) => ({
      extensions: state.extensions.filter((ext) => ext.id !== id),
    })),
  setTimeRange: (range) => set({ selectedTimeRange: range }),
}));