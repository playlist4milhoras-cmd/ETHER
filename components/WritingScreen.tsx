
import React, { useState, useRef, useEffect } from 'react';
import { Menu, Settings, Send, Wand2, RefreshCw, Layers, X, UserPlus, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Share2, MousePointer2, Edit3, Bookmark, Scale } from 'lucide-react';
import { marked } from 'marked';
import { Story, Character, StoryBlock } from '../types';
import { generateStorySupport } from '../services/gemini';

interface WritingScreenProps {
  story: Story;
  onUpdateStory: (updated: Story) => void;
  onMenuClick: () => void;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

const NarrativeContent: React.FC<{ content: string }> = ({ content }) => {
  const htmlContent = marked.parse(content);
  return (
    <div 
      className="font-narrative prose prose-invert prose-zinc max-w-none text-lg md:text-xl leading-[1.8] text-zinc-200 whitespace-pre-wrap selection:bg-zinc-800 selection:text-white antialiased"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

const VersionSwitcher: React.FC<{ 
  block: StoryBlock, 
  onSwitch: (index: number) => void 
}> = ({ block, onSwitch }) => {
  if (block.versions.length <= 1) return null;
  return (
    <div className="flex items-center gap-4 mt-6 mb-8 text-[10px] tracking-widest uppercase text-zinc-800 select-none">
      <button 
        onClick={() => onSwitch(Math.max(0, block.activeVersionIndex - 1))}
        disabled={block.activeVersionIndex === 0}
        className="p-1 hover:text-zinc-500 disabled:opacity-10 transition-all"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="font-bold opacity-40">{block.activeVersionIndex + 1} / {block.versions.length}</span>
      <button 
        onClick={() => onSwitch(Math.min(block.versions.length - 1, block.activeVersionIndex + 1))}
        disabled={block.activeVersionIndex === block.versions.length - 1}
        className="p-1 hover:text-zinc-500 disabled:opacity-10 transition-all"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
};

export const WritingScreen: React.FC<WritingScreenProps> = ({ 
  story, 
  onUpdateStory, 
  onMenuClick 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [expandedChar, setExpandedChar] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [floatingMenu, setFloatingMenu] = useState<{ x: number, y: number, blockId: string } | null>(null);
  
  const longPressTimer = useRef<number | null>(null);
  const scrollEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleUpdate = (updates: Partial<Story>) => {
    onUpdateStory({ ...story, ...updates, lastEdited: new Date() });
  };

  const handleAISupport = async (action: 'continue' | 'rewrite' | 'new_chapter', customPrompt?: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const promptToUse = customPrompt || (inputValue.trim() || 'continue');
    let updatedContextBlocks = [...story.blocks];

    if (editingBlockId) {
      // Logic for editing: Replace the user block and regenerate subsequent AI response
      const blockIndex = story.blocks.findIndex(b => b.id === editingBlockId);
      if (blockIndex !== -1) {
        const editedBlock = {
          ...story.blocks[blockIndex],
          versions: [...story.blocks[blockIndex].versions, promptToUse],
          activeVersionIndex: story.blocks[blockIndex].versions.length,
        };
        updatedContextBlocks[blockIndex] = editedBlock;
        // Keep blocks up to the edit point
        updatedContextBlocks = updatedContextBlocks.slice(0, blockIndex + 1);
        setEditingBlockId(null);
      }
    } else {
      // Normal flow: add new user block if prompt is not empty or "continue"
      if (inputValue.trim()) {
        const userBlock: StoryBlock = {
          id: crypto.randomUUID(),
          type: 'user',
          versions: [promptToUse],
          activeVersionIndex: 0,
          timestamp: new Date()
        };
        updatedContextBlocks.push(userBlock);
      }
    }

    setInputValue('');
    // Clear height of textarea
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Update locally before API call for feedback
    onUpdateStory({ ...story, blocks: updatedContextBlocks, lastEdited: new Date() });

    const result = await generateStorySupport(promptToUse, story, action, updatedContextBlocks);
    
    if (result) {
      const aiBlock: StoryBlock = {
        id: crypto.randomUUID(),
        type: 'ai',
        versions: [result],
        activeVersionIndex: 0,
        timestamp: new Date()
      };
      onUpdateStory({ ...story, blocks: [...updatedContextBlocks, aiBlock], lastEdited: new Date() });
    }
    
    setIsProcessing(false);
  };

  const handleEditMessage = (blockId: string) => {
    const block = story.blocks.find(b => b.id === blockId);
    if (block) {
      setInputValue(block.versions[block.activeVersionIndex]);
      setEditingBlockId(blockId);
      textareaRef.current?.focus();
    }
  };

  const regenerateBlock = async (blockId: string) => {
    setFloatingMenu(null);
    if (isProcessing) return;
    
    const blockIndex = story.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;

    setIsProcessing(true);
    const contextBlocks = story.blocks.slice(0, blockIndex);
    const lastUserBlock = [...contextBlocks].reverse().find(b => b.type === 'user');
    const prompt = lastUserBlock ? lastUserBlock.versions[lastUserBlock.activeVersionIndex] : "Continue a narrativa.";

    const result = await generateStorySupport(prompt, story, 'continue', contextBlocks);

    if (result) {
      const updatedBlocks = story.blocks.map(b => {
        if (b.id === blockId) {
          return {
            ...b,
            versions: [...b.versions, result],
            activeVersionIndex: b.versions.length
          };
        }
        return b;
      });
      onUpdateStory({ ...story, blocks: updatedBlocks, lastEdited: new Date() });
    }
    setIsProcessing(false);
  };

  const updateBlockVersion = (blockId: string, versionIndex: number) => {
    const updatedBlocks = story.blocks.map(b => 
      b.id === blockId ? { ...b, activeVersionIndex: versionIndex } : b
    );
    handleUpdate({ blocks: updatedBlocks });
  };

  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, blockId: string) => {
    const coords = 'touches' in e ? e.touches[0] : e;
    const x = coords.clientX;
    const y = coords.clientY;
    longPressTimer.current = window.setTimeout(() => {
      setFloatingMenu({ x, y, blockId });
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    const updatedChars = story.characters.map(c => c.id === id ? { ...c, ...updates } : c);
    handleUpdate({ characters: updatedChars });
  };

  const removeCharacter = (id: string) => {
    const updatedChars = story.characters.filter(c => c.id !== id);
    handleUpdate({ characters: updatedChars });
    if (expandedChar === id) setExpandedChar(null);
  };

  useEffect(() => {
    if (scrollEndRef.current && !isProcessing) {
      scrollEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [story.blocks.length]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleAISupport('continue');
      }
      // Se não houver Ctrl/Meta, o comportamento padrão (quebra de linha) ocorre.
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-zinc-300 selection:bg-zinc-800">
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#050505]/95 backdrop-blur-xl border-b border-zinc-900 flex items-center px-4 z-30">
        <button onClick={onMenuClick} className="p-2 text-zinc-600 hover:text-white transition-colors">
          <Menu size={24} />
        </button>
        <div className="flex-1 flex justify-center px-4 overflow-hidden">
          <input 
            type="text"
            value={story.title}
            onChange={(e) => handleUpdate({ title: e.target.value })}
            placeholder="Título da História"
            className="w-full max-w-[200px] md:max-w-md text-center bg-transparent border-none focus:outline-none text-white font-medium text-sm md:text-base placeholder:text-zinc-800 truncate"
          />
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-600 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Biblical Panel */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
          <aside className="relative w-full max-w-md bg-[#080808] h-full border-l border-zinc-900 flex flex-col animate-in slide-in-from-right duration-500">
             <div className="p-8 border-b border-zinc-900 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">Bíblia da História</h2>
                <p className="text-[10px] text-zinc-700 uppercase tracking-widest font-black">Fundamentos Narrativos</p>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-2 text-zinc-600 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <Scale size={14} className="text-zinc-700" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Leis da História</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 font-black">Época</label>
                    <input type="text" value={story.temporalContext} onChange={(e) => handleUpdate({ temporalContext: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700"/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 font-black">Universo</label>
                    <input type="text" value={story.universe} onChange={(e) => handleUpdate({ universe: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none focus:border-zinc-700"/>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-6">Regras Absolutas</h3>
                <textarea 
                  value={story.rules}
                  onChange={(e) => handleUpdate({ rules: e.target.value })}
                  placeholder="Ex: Sem redenção, dinâmica aberta..."
                  className="w-full h-32 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-sm text-zinc-400 focus:outline-none focus:border-zinc-700 resize-none"
                />
              </section>

              <section>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700">Personagens</h3>
                  <button onClick={() => {
                    const newChar: Character = { id: crypto.randomUUID(), name: "Novo Personagem", appearance: "", personality: "", dynamics: "", relations: "" };
                    handleUpdate({ characters: [...story.characters, newChar] });
                    setExpandedChar(newChar.id);
                  }} className="text-zinc-600 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><UserPlus size={14}/> Novo</button>
                </div>
                <div className="space-y-4">
                  {story.characters.map(char => (
                    <div key={char.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                      <div className="p-5 flex justify-between items-center cursor-pointer" onClick={() => setExpandedChar(expandedChar === char.id ? null : char.id)}>
                        <span className="text-sm font-semibold text-zinc-400">{char.name || "Inominado"}</span>
                        <div className="flex items-center gap-4">
                          <button onClick={(e) => { e.stopPropagation(); removeCharacter(char.id); }} className="text-zinc-800 hover:text-red-900 transition-colors"><Trash2 size={16}/></button>
                          {expandedChar === char.id ? <ChevronUp size={18} className="text-zinc-800"/> : <ChevronDown size={18} className="text-zinc-800"/>}
                        </div>
                      </div>
                      {expandedChar === char.id && (
                        <div className="p-5 pt-0 space-y-4">
                          <input value={char.name} onChange={(e) => updateCharacter(char.id, { name: e.target.value })} placeholder="Nome" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs focus:outline-none"/>
                          <textarea value={char.personality} onChange={(e) => updateCharacter(char.id, { personality: e.target.value })} placeholder="POV/Personalidade..." className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs h-20 focus:outline-none resize-none"/>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      )}

      <main className="flex-1 mt-16 pb-64 px-6 md:px-12 lg:px-0 max-w-2xl mx-auto w-full overflow-y-auto scroll-smooth custom-scrollbar">
        <div className="py-20 space-y-10">
          {story.blocks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 text-center opacity-30">
              <p className="font-narrative text-3xl italic text-zinc-800">Sua história começa aqui...</p>
            </div>
          )}
          
          {story.blocks.map((block) => (
            <div 
              key={block.id} 
              className={`relative group animate-in fade-in duration-700`}
              onMouseDown={(e) => block.type === 'ai' && handleLongPress(e, block.id)}
              onTouchStart={(e) => block.type === 'ai' && handleLongPress(e, block.id)}
            >
              {block.type === 'user' ? (
                <div className="flex flex-col items-center my-16 group/user">
                  <div className="relative flex flex-col items-center text-center px-8">
                    <div className="w-px h-10 bg-zinc-900 mb-6" />
                    <div 
                      onClick={() => handleEditMessage(block.id)}
                      className="text-zinc-600 text-[10px] font-black tracking-[0.3em] uppercase bg-[#080808] px-8 py-3 rounded-full border border-zinc-900 cursor-pointer hover:border-zinc-500 hover:text-zinc-400 transition-all flex items-center gap-3"
                    >
                      {block.versions[block.activeVersionIndex]}
                      <Edit3 size={12} className="opacity-0 group-hover/user:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <NarrativeContent content={block.versions[block.activeVersionIndex]} />
                  <VersionSwitcher block={block} onSwitch={(idx) => updateBlockVersion(block.id, idx)} />
                </div>
              )}
            </div>
          ))}
          <div ref={scrollEndRef} />
        </div>
      </main>

      {/* Input Base Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-40">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Quick Commands */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-center md:justify-start">
            <button onClick={() => handleAISupport('continue')} disabled={isProcessing} className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shrink-0"><Wand2 size={14} /> Continuar</button>
            <button onClick={() => handleAISupport('rewrite')} disabled={isProcessing} className="flex items-center gap-2 px-6 py-3 bg-[#0D0D0D] text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-900 border border-zinc-900 transition-all active:scale-95 shadow-lg shrink-0"><RefreshCw size={14} /> Reescrever</button>
            <button onClick={() => handleAISupport('new_chapter')} disabled={isProcessing} className="flex items-center gap-2 px-6 py-3 bg-[#0D0D0D] text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-zinc-900 border border-zinc-900 transition-all active:scale-95 shadow-lg shrink-0"><Layers size={14} /> Novo Capítulo</button>
          </div>

          {/* Command Multi-line Textarea */}
          <div className="relative">
            {editingBlockId && (
              <div className="absolute -top-10 left-4 px-3 py-1 bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-t-lg border-x border-t border-zinc-700 flex items-center gap-2">
                Editando comando <button onClick={() => { setEditingBlockId(null); setInputValue(''); }}><X size={10} /></button>
              </div>
            )}
            <div className="relative flex items-end bg-[#080808] border border-zinc-900 rounded-[1.8rem] px-6 py-3 shadow-2xl focus-within:border-zinc-700 transition-all overflow-hidden">
              <textarea 
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={handleTextareaChange}
                onKeyDown={handleKeyDown}
                placeholder={isProcessing ? "Narrador compondo..." : (editingBlockId ? "Substitua o comando..." : "Escreva um comando ou trecho longo... (Ctrl+Enter p/ enviar)")}
                disabled={isProcessing}
                className="flex-1 bg-transparent py-3 text-sm md:text-base focus:outline-none text-zinc-200 placeholder:text-zinc-800 font-medium resize-none max-h-[200px] overflow-y-auto"
              />
              <button 
                onClick={() => handleAISupport('continue')} 
                disabled={isProcessing} 
                className="mb-1 p-2 text-zinc-700 hover:text-white disabled:opacity-10 transition-all"
                title="Enviar (Ctrl+Enter)"
              >
                <Send size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Menu for AI blocks */}
      {floatingMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setFloatingMenu(null)}>
          <div 
            className="absolute bg-[#111] border border-zinc-800 rounded-2xl shadow-2xl py-2 w-56 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            style={{ top: Math.min(window.innerHeight - 200, floatingMenu.y), left: Math.min(window.innerWidth - 240, floatingMenu.x) }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="w-full flex items-center gap-4 px-5 py-4 text-sm hover:bg-zinc-900 transition-colors">
              <MousePointer2 size={16} className="text-zinc-600" /> Selecionar texto
            </button>
            <button onClick={() => regenerateBlock(floatingMenu.blockId)} className="w-full flex items-center gap-4 px-5 py-4 text-sm hover:bg-zinc-900 transition-colors">
              <RefreshCw size={16} className="text-zinc-600" /> Regenerar trecho
            </button>
            <div className="border-t border-zinc-900 mt-1 pt-1">
              <button onClick={() => setFloatingMenu(null)} className="w-full flex items-center gap-4 px-5 py-4 text-sm text-zinc-600 hover:bg-zinc-900 transition-colors">
                <X size={16} /> Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
