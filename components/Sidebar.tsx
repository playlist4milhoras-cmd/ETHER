
import React, { useState } from 'react';
import { Plus, Search, Book, Settings, X, ChevronRight, History, Home, Tag } from 'lucide-react';
import { Story } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onCreateNew: () => void;
  onGoHome: () => void;
  currentStoryId?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  stories, 
  onSelectStory, 
  onCreateNew,
  onGoHome,
  currentStoryId 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Backdrop for mobile interaction */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`} 
        onClick={onClose}
      />

      {/* Main Draggable-style Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-[320px] bg-[#080808] border-r border-zinc-900 z-50 transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-6 flex justify-between items-center">
          <span className="text-[10px] font-black tracking-[0.5em] text-zinc-600 uppercase">Éthos</span>
          <button onClick={onClose} className="p-2 -mr-2 text-zinc-600 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Primary Action: Nova História */}
        <div className="px-6 pb-6">
          <button 
            onClick={() => { onCreateNew(); onClose(); }}
            className="w-full flex items-center justify-center gap-3 bg-zinc-100 text-black py-4 rounded-2xl font-bold text-sm hover:bg-white transition-all active:scale-[0.97] shadow-lg"
          >
            <Plus size={18} strokeWidth={3} />
            Nova História
          </button>
        </div>

        {/* Search Input */}
        <div className="px-6 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
            <input 
              type="text" 
              placeholder="Buscar em seus rascunhos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-zinc-900 rounded-xl py-3 pl-12 pr-4 text-xs focus:outline-none focus:border-zinc-700 text-zinc-300 placeholder:text-zinc-800 transition-all"
            />
          </div>
        </div>

        {/* Story List Section */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
          <div className="px-4 mb-4 flex items-center gap-2">
             <History size={12} className="text-zinc-800" />
             <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-800">Suas Histórias</h3>
          </div>
          
          <div className="space-y-1 pb-10">
            {filteredStories.length === 0 ? (
              <div className="px-4 py-12 text-center opacity-20">
                <Book size={32} className="mx-auto mb-3" />
                <p className="text-zinc-400 text-xs italic">O vazio aguarda a criação</p>
              </div>
            ) : (
              filteredStories.map((story) => (
                <button
                  key={story.id}
                  onClick={() => { onSelectStory(story); onClose(); }}
                  className={`w-full text-left p-5 rounded-2xl group transition-all relative overflow-hidden border ${
                    currentStoryId === story.id 
                      ? 'bg-zinc-900 border-zinc-800 text-white shadow-xl translate-x-1' 
                      : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/40 hover:border-zinc-900'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold truncate pr-4 leading-tight">
                      {story.title || "Sem título"}
                    </span>
                    <ChevronRight size={14} className={`mt-0.5 transition-all duration-300 ${currentStoryId === story.id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {story.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-zinc-800/50 rounded border border-zinc-800/50 flex items-center gap-1 uppercase tracking-tighter">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>

                  <div className="text-[9px] text-zinc-800 font-bold uppercase tracking-widest">
                    <span>Editado em {new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(story.lastEdited)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Fixed Footer */}
        <div className="mt-auto p-4 border-t border-zinc-900 bg-[#060606]">
          <div className="grid grid-cols-3 gap-1">
            <button 
              onClick={() => { onGoHome(); onClose(); }}
              className="flex flex-col items-center justify-center gap-2 p-3 text-zinc-600 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all"
            >
              <Home size={18} />
              <span className="text-[8px] uppercase font-black tracking-widest">Início</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 text-zinc-600 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all">
              <Book size={18} />
              <span className="text-[8px] uppercase font-black tracking-widest">Biblioteca</span>
            </button>
            <button className="flex flex-col items-center justify-center gap-2 p-3 text-zinc-600 hover:text-white hover:bg-zinc-900/50 rounded-xl transition-all">
              <Settings size={18} />
              <span className="text-[8px] uppercase font-black tracking-widest">Ajustes</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
