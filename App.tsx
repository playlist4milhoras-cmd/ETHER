
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeScreen } from './components/HomeScreen';
import { WritingScreen } from './components/WritingScreen';
import { Story, ViewState } from './types';

function App() {
  const [view, setView] = useState<ViewState>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('ethos_stories');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((s: any) => ({
        ...s,
        lastEdited: new Date(s.lastEdited),
        blocks: (s.blocks || []).map((b: any) => ({ ...b, timestamp: new Date(b.timestamp) })),
      }));
    }
    return [];
  });
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  useEffect(() => {
    localStorage.setItem('ethos_stories', JSON.stringify(stories));
  }, [stories]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const createNewStory = () => {
    const newStory: Story = {
      id: crypto.randomUUID(),
      title: "",
      blocks: [],
      rules: "",
      keyEvents: "",
      characters: [],
      tags: ["Rascunho"],
      lastEdited: new Date(),
      images: [],
      temporalContext: "",
      universe: "Realista",
      primaryTone: "Literário",
      secondaryTones: [],
      referenceType: 'none',
      referenceWork: ""
    };
    setStories([newStory, ...stories]);
    setCurrentStory(newStory);
    setView('writing');
    setIsSidebarOpen(false);
  };

  const selectStory = (story: Story) => {
    setCurrentStory(story);
    setView('writing');
    setIsSidebarOpen(false);
  };

  const updateStory = (updated: Story) => {
    setCurrentStory(updated);
    setStories(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const goToHome = () => {
    setView('home');
    setCurrentStory(null);
    setIsSidebarOpen(false);
  };

  return (
    <div className="relative min-h-screen bg-[#050505]">
      {/* Sistema de Navegação Principal */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        stories={stories}
        onSelectStory={selectStory}
        onCreateNew={createNewStory}
        onGoHome={goToHome}
        currentStoryId={currentStory?.id}
      />

      {/* Tela Inicial Neutra */}
      {view === 'home' && (
        <HomeScreen 
          onMenuClick={toggleSidebar} 
          onCreateNew={createNewStory} 
        />
      )}

      {/* Tela de Escrita Longa */}
      {view === 'writing' && currentStory && (
        <WritingScreen 
          story={currentStory} 
          onUpdateStory={updateStory}
          onMenuClick={toggleSidebar}
        />
      )}
    </div>
  );
}

export default App;
