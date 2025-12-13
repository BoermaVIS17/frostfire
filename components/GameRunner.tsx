import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import MainScene from '../game/scenes/MainScene';

const GameRunner: React.FC = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Phaser Config
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: '#e6f3f5', // Snow white/blue tint
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    // Initialize Game
    gameRef.current = new Phaser.Game(config);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={gameContainerRef} 
      className="rounded-lg shadow-2xl overflow-hidden border-4 border-slate-700"
      style={{ width: '800px', height: '600px' }}
    />
  );
};

export default GameRunner;