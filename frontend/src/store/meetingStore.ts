import { create } from 'zustand';

interface MeetingUIState {
  isChatOpen: boolean;
  isScreenSharing: boolean;
  isTranscriptOn: boolean;
  showScreenSharePicker: boolean;
  showCancelSharePopover: boolean;
  showLeaveDialog: boolean;

  toggleChat: () => void;
  setScreenSharing: (v: boolean) => void;
  setTranscript: (v: boolean) => void;
  setShowScreenSharePicker: (v: boolean) => void;
  setShowCancelSharePopover: (v: boolean) => void;
  setShowLeaveDialog: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  isChatOpen: true,
  isScreenSharing: false,
  isTranscriptOn: false,
  showScreenSharePicker: false,
  showCancelSharePopover: false,
  showLeaveDialog: false,
};

export const useMeetingStore = create<MeetingUIState>((set) => ({
  ...initialState,

  toggleChat: () => set((s) => ({ isChatOpen: !s.isChatOpen })),
  setScreenSharing: (v) => set({ isScreenSharing: v }),
  setTranscript: (v) => set({ isTranscriptOn: v }),
  setShowScreenSharePicker: (v) => set({ showScreenSharePicker: v }),
  setShowCancelSharePopover: (v) => set({ showCancelSharePopover: v }),
  setShowLeaveDialog: (v) => set({ showLeaveDialog: v }),
  reset: () => set(initialState),
}));
