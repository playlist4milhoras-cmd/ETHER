
import React from 'react';
import { Plus, Menu } from 'lucide-react';

interface HomeScreenProps {
  onMenuClick: () => void;
  onCreateNew: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onMenuClick, onCreateNew }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-100 selection:bg-zinc-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 flex items-center px-4 z-10">
        <button 
          onClick={onMenuClick}
          className="p-2 text-zinc-500 hover:text-white transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="flex-1 flex justify-center md:justify-start md:pl-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lg tracking-tight uppercase tracking-widest text-zinc-300">Éthos</span>
          </div>
        </div>
      </header>

      {/* Main Content - Neutral Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full animate-in fade-in zoom-in-95 duration-700">
          <button 
            onClick={onCreateNew}
            className="group relative flex flex-col items-center justify-center p-16 w-full bg-[#0A0A0A] border border-zinc-900 rounded-[2.5rem] hover:border-zinc-700 hover:bg-[#0D0D0D] transition-all active:scale-[0.98] shadow-2xl"
          >
            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-8 group-hover:bg-zinc-100 group-hover:text-black transition-all duration-300 shadow-inner">
              <Plus size={36} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-medium text-zinc-200 mb-3 tracking-tight">Nova História</h1>
            <p className="text-zinc-500 text-sm font-light">Crie uma nova história ou escolha uma existente</p>
          </button>
          
          <div className="mt-12 text-zinc-800 text-[10px] tracking-[0.3em] uppercase font-bold select-none">
            Minimalismo literário
          </div>
        </div>
      </main>
    </div>
  );
};
