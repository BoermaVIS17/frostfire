import React from 'react';
import GameRunner from './components/GameRunner';

const App: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '1rem',
        left: '1rem',
        zIndex: 10,
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '0.875rem',
        pointerEvents: 'none',
        userSelect: 'none'
      }}>
        <h1 style={{
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '0.5rem'
        }}>Frozen Fortune</h1>
        <p>WASD to move. Space to gather. Click to attack.</p>
      </div>
      <GameRunner />
    </div>
  );
};

export default App;