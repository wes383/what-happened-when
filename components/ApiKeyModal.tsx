import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle } from 'lucide-react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onSave: (key: string, provider: 'gemini' | 'openai', modelName?: string, baseURL?: string) => void;
    onClose: () => void;
    initialKey?: string;
    initialProvider?: 'gemini' | 'openai';
    initialModelName?: string;
    initialBaseURL?: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
    isOpen,
    onSave,
    onClose,
    initialKey = '',
    initialProvider = 'gemini',
    initialModelName = '',
    initialBaseURL = ''
}) => {
    const [apiKey, setApiKey] = useState(initialKey);
    const [provider, setProvider] = useState<'gemini' | 'openai'>(initialProvider);
    const [modelName, setModelName] = useState(initialModelName);
    const [baseURL, setBaseURL] = useState(initialBaseURL);
    const [error, setError] = useState('');

    useEffect(() => {
        setApiKey(initialKey);
        setProvider(initialProvider);
        setModelName(initialModelName);
        setBaseURL(initialBaseURL);
    }, [initialKey, initialProvider, initialModelName, initialBaseURL]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apiKey.trim()) {
            setError('API Key is required');
            return;
        }
        onSave(apiKey.trim(), provider, modelName.trim(), baseURL.trim());
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                            <Key size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Enter API Key</h2>
                            <p className="text-sm text-slate-500">Required to generate timelines</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Provider Selection */}
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => setProvider('gemini')}
                            className={`flex-1 py-3 px-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${provider === 'gemini'
                                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            <span className="font-medium">Google Gemini</span>
                            <span className="text-xs opacity-75">gemini-2.5-flash</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setProvider('openai')}
                            className={`flex-1 py-3 px-4 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${provider === 'openai'
                                    ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-500'
                                    : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                }`}
                        >
                            <span className="font-medium">OpenAI Compatible</span>
                            <span className="text-xs opacity-75">gpt-5-mini</span>
                        </button>
                    </div>

                    <div>
                        <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
                            {provider === 'gemini' ? 'Google Gemini API Key' : 'API Key'}
                        </label>
                        <input
                            id="apiKey"
                            type="password"
                            value={apiKey}
                            onChange={(e) => {
                                setApiKey(e.target.value);
                                setError('');
                            }}
                            placeholder={provider === 'gemini' ? "AIzaSy..." : "sk-..."}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                            autoFocus
                        />
                        {error && (
                            <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-slate-400">
                            Your key is stored locally in your browser. We do not save it on any server.
                        </p>
                    </div>

                    {provider === 'openai' && (
                        <div>
                            <label htmlFor="baseURL" className="block text-sm font-medium text-slate-700 mb-1">
                                Base URL (Optional)
                            </label>
                            <input
                                id="baseURL"
                                type="text"
                                value={baseURL}
                                onChange={(e) => setBaseURL(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="modelName" className="block text-sm font-medium text-slate-700 mb-1">
                            Model Name (Optional)
                        </label>
                        <input
                            id="modelName"
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            placeholder={provider === 'gemini' ? "gemini-2.5-flash" : "gpt-5-mini"}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition-all text-slate-800 placeholder:text-slate-400"
                        />
                        <p className="mt-2 text-xs text-slate-400">
                            Leave blank to use default. Custom models have a 1M character context limit.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        {initialKey && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!apiKey.trim()}
                            className="flex items-center gap-2 px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20"
                        >
                            <Save size={18} />
                            Save Key
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
