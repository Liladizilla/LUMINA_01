import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface Collaborator {
  userId: string;
  cursor?: { x: number; y: number; frame?: number };
  selection?: string[];
  lastSeen?: number;
}

interface CollaborationState {
  playheadFrame: number;
  clips: any[];
  collaborators: Collaborator[];
}

export function useCollaboration(projectId: string | null, userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<CollaborationState>({
    playheadFrame: 0,
    clips: [],
    collaborators: [],
  });

  // Reference to store latest cursor/frame for emission
  const cursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const frameToPixelsRef = useRef<(frame: number) => number>(() => 0);

  // Initialize socket connection
  useEffect(() => {
    if (!projectId) return;

    const socketInstance = io({
      path: '/ws',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('join-project', { projectId, userId });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('playhead-update', ({ frame, userId: remoteUserId }) => {
      setState(prev => ({
        ...prev,
        playheadFrame: frame,
        collaborators: prev.collaborators.map(c =>
          c.userId === remoteUserId ? { ...c, cursor: { ...c.cursor, frame } } : c
        ),
      }));
    });

    socketInstance.on('cursor-update', ({ userId: remoteUserId, cursor }) => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.map(c =>
          c.userId === remoteUserId ? { ...c, cursor, lastSeen: Date.now() } : c
        ),
      }));
    });

    socketInstance.on('clip-updated', ({ clip, userId: remoteUserId }) => {
      setState(prev => ({
        ...prev,
        clips: [...prev.clips.filter(c => c.id !== clip.id), clip],
      }));
    });

    socketInstance.on('collaborator-joined', ({ userId: remoteUserId }) => {
      setState(prev => ({
        ...prev,
        collaborators: [...prev.collaborators.filter(c => c.userId !== remoteUserId), { userId: remoteUserId }],
      }));
    });

    socketInstance.on('collaborator-left', ({ userId: remoteUserId }) => {
      setState(prev => ({
        ...prev,
        collaborators: prev.collaborators.filter(c => c.userId !== remoteUserId),
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [projectId, userId]);

  // Track mouse/cursor movement on timeline for position sharing
  const trackCursor = useCallback((x: number, y: number, frame?: number) => {
    cursorRef.current = { x, y };
    if (socket && projectId && isConnected) {
      socket.emit('cursor-move', {
        projectId,
        userId,
        cursor: { x, y, frame },
      });
    }
  }, [socket, projectId, userId, isConnected]);

  const updatePlayhead = useCallback((frame: number) => {
    if (socket && projectId && isConnected) {
      socket.emit('playhead-move', { projectId, frame, userId });
    }
  }, [socket, projectId, userId, isConnected]);

  const updateClip = useCallback((clip: any) => {
    if (socket && projectId && isConnected) {
      socket.emit('clip-update', { projectId, clip, userId });
    }
  }, [socket, projectId, userId, isConnected]);

  return {
    isConnected,
    state,
    trackCursor,
    updatePlayhead,
    updateClip,
  };
}

// Hook to get collaborators excluding self
export function useCollaborators(projectId: string | null, myUserId: string) {
  const { state } = useCollaboration(projectId, myUserId);
  return state.collaborators.filter(c => c.userId !== myUserId);
}