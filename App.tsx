import React, { useState, useMemo, useEffect } from 'react';
import { InputArea } from './components/InputArea';
import { TimelineView } from './components/TimelineView';
import { FilterBar } from './components/FilterBar';
import { generateTimeline } from './services/geminiService';
import { generateTimelineOpenAI } from './services/openaiService';
import { TimelineEvent, EntityConfig, ProgressInfo } from './types';
import { ENTITY_COLORS } from './constants';
import { ArrowLeft, Settings } from 'lucide-react';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Language, getTranslations } from './i18n';

const App: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [entities, setEntities] = useState<string[]>([]);
  const [hiddenEntities, setHiddenEntities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[][]>([]);
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'openai'>('gemini');
  const [modelName, setModelName] = useState('');
  const [baseURL, setBaseURL] = useState('');
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [wikiSources, setWikiSources] = useState<string[]>([]);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);

  useEffect(() => {
    const storedProvider = localStorage.getItem('timeline_provider') as 'gemini' | 'openai' | null;
    const currentProvider = storedProvider || 'gemini';
    setProvider(currentProvider);

    const storedKey = localStorage.getItem(`${currentProvider}_api_key`);
    const storedModelName = localStorage.getItem(`${currentProvider}_model_name`);
    const storedBaseURL = localStorage.getItem(`${currentProvider}_base_url`);
    const storedLanguage = localStorage.getItem('timeline_language') as Language | null;

    if (storedKey) {
      setApiKey(storedKey);
      setModelName(storedModelName || '');
      setBaseURL(storedBaseURL || '');
    } else {
      setIsApiKeyModalOpen(true);
    }

    if (storedLanguage) {
      setLanguage(storedLanguage);
    }
  }, []);

  const handleSaveApiKey = (key: string, newProvider: 'gemini' | 'openai' | 'qwen', newModelName?: string, newBaseURL?: string) => {
    setApiKey(key);
    setProvider(newProvider);
    const model = newModelName || '';
    const url = newBaseURL || '';
    setModelName(model);
    setBaseURL(url);

    localStorage.setItem(`${newProvider}_api_key`, key);
    localStorage.setItem('timeline_provider', newProvider);
    localStorage.setItem(`${newProvider}_model_name`, model);
    localStorage.setItem(`${newProvider}_base_url`, url);

    setIsApiKeyModalOpen(false);
  };

  const handleGenerate = async (items: string[]) => {
    setIsLoading(true);
    setError(null);
    setHiddenEntities(new Set());
    setProgressInfo(null);

    try {
      let result;
      if (provider === 'openai') {
        result = await generateTimelineOpenAI(
          apiKey, 
          items, 
          modelName, 
          baseURL || undefined, 
          language,
          (info) => setProgressInfo(info)
        );
      } else {
        result = await generateTimeline(
          apiKey, 
          items, 
          modelName, 
          language,
          (info) => setProgressInfo(info)
        );
      }
      setEntities(items);
      setEvents(result.events);
      setWikiSources(result.wikiSources);

      setSearchHistory(prev => {
        const newKey = JSON.stringify([...items].sort());
        const filtered = prev.filter(item => JSON.stringify([...item].sort()) !== newKey);
        return [items, ...filtered].slice(0, 50);
      });
    } catch (err) {
      setError(t.errorGenerate);
    } finally {
      setIsLoading(false);
      setProgressInfo(null);
    }
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('timeline_language', newLang);
  };

  const handleBack = () => {
    setEvents([]);
    setEntities([]);
    setWikiSources([]);
  };

  const toggleEntityVisibility = (name: string) => {
    const newHidden = new Set(hiddenEntities);
    if (newHidden.has(name)) {
      newHidden.delete(name);
    } else {
      newHidden.add(name);
    }
    setHiddenEntities(newHidden);
  };

  const entityConfigs: EntityConfig[] = useMemo(() => {
    return entities.map((name, index) => ({
      name,
      color: ENTITY_COLORS[index % ENTITY_COLORS.length],
      isVisible: !hiddenEntities.has(name)
    }));
  }, [entities, hiddenEntities]);

  const showTimeline = events.length > 0;
  const t = getTranslations(language);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onSave={handleSaveApiKey}
        onClose={() => setIsApiKeyModalOpen(false)}
        initialKey={apiKey}
        initialProvider={provider}
        initialModelName={modelName}
        initialBaseURL={baseURL}
        language={language}
      />

      {/* Top Right Buttons */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
          title={t.language}
        >
          {language === 'en' ? 'EN' : '中文'}
        </button>
        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          title={t.settings}
        >
          <Settings size={20} />
        </button>
      </div>

      {!showTimeline ? (
        /* Input View - Centered */
        <div className="h-full overflow-y-auto flex flex-col items-center justify-center p-4 animate-fade-in">
          <InputArea
            onGenerate={handleGenerate}
            isLoading={isLoading}
            defaultItems={entities}
            recentSearches={searchHistory}
            language={language}
            progressInfo={progressInfo}
          />
          {error && (
            <div className="max-w-2xl w-full mt-4 p-4 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 shadow-sm animate-fade-in">
              {error}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="flex-none z-40 bg-slate-50/80 backdrop-blur-sm transition-all relative">
            <div className="flex items-center justify-center px-4 py-4 relative min-h-[60px]">
              {/* Back Button - Absolute Left */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-50">
                <button
                  onClick={handleBack}
                  className="p-2.5 rounded-full bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all duration-200 shadow-sm border border-slate-200 group"
                  aria-label={t.backToSearch}
                  title={t.backToSearch}
                >
                  <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Filters - Centered */}
              <div className="flex-1 overflow-x-auto no-scrollbar flex justify-center px-16">
                <FilterBar entityConfigs={entityConfigs} onToggle={toggleEntityVisibility} />
              </div>
            </div>
          </div>

          {/* Main Timeline Canvas */}
          <div className="flex-1 overflow-hidden relative animate-fade-in-up">
            <TimelineView events={events} entityConfigs={entityConfigs} wikiSources={wikiSources} language={language} />
          </div>
        </>
      )}

      {/* Global Animations & Utilities */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;