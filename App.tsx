import React from 'react';
import GameRunner from './components/GameRunner';

const App: React.FC = () => {
  return (
    <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-4 left-4 z-10 text-white/50 text-sm pointer-events-none select-none">
        <h1 className="text-xl font-bold text-white">Frostfire Survival</h1>
        <p>Click to move. Gather wood from Green Trees. Return to the Red Furnace.</p>
      </div>
      <GameRunner />
    </div>
  );
};

export default App;