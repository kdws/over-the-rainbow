import { useRef, useEffect, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './game/types';
import { createGameData, update } from './game/engine';
import { render } from './game/renderer';
import { initAudio } from './game/audio';
import type { GameData } from './game/types';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameData>(createGameData());
  const keysRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number>(0);

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    gameRef.current = update(gameRef.current, keysRef.current);
    render(ctx, gameRef.current);

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'a', 'd', 'w'].includes(e.key)) {
        e.preventDefault();
        keysRef.current.add(e.key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mobile touch controls
    const canvas = canvasRef.current;
    let touchId: number | null = null;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      initAudio();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      touchStartX = touch.clientX;

      // Tap top half = jump
      const rect = canvas!.getBoundingClientRect();
      const touchY = touch.clientY - rect.top;
      if (touchY < rect.height * 0.5) {
        keysRef.current.add(' ');
        setTimeout(() => keysRef.current.delete(' '), 50);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - touchStartX;
          keysRef.current.delete('ArrowLeft');
          keysRef.current.delete('ArrowRight');
          if (dx > 20) {
            keysRef.current.add('ArrowRight');
          } else if (dx < -20) {
            keysRef.current.add('ArrowLeft');
          }
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          keysRef.current.delete('ArrowLeft');
          keysRef.current.delete('ArrowRight');
          touchId = null;
        }
      }
    };

    if (canvas) {
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (canvas) {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a1a',
      gap: '16px',
      touchAction: 'none',
      userSelect: 'none',
    }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          border: '3px solid #FFD700',
          borderRadius: '8px',
          imageRendering: 'pixelated',
          maxWidth: '100%',
          cursor: 'pointer',
          touchAction: 'none',
        }}
        tabIndex={0}
      />
      <p style={{
        color: '#aaa',
        fontFamily: 'monospace',
        fontSize: '14px',
        margin: 0,
      }}>
        Arrows/WASD to move  |  SPACE to jump  |  Stomp all enemies to unlock the gold!
      </p>
    </div>
  );
}
