import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Key, Cpu, Database, Check, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { getSettings, updateSettings, getHealth } from '../services/api';

export default function Settings() {
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [provider, setProvider] = useState('deterministic');
  const [statusInfo, setStatusInfo] = useState(null);
  const [backendHealth, setBackendHealth] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSettings();
    checkHealth();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await getSettings();
      setStatusInfo(res.data);
      setProvider(res.data.provider || 'deterministic');
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await getHealth();
      setBackendHealth(res.data);
    } catch (err) {
      setBackendHealth({ status: 'unreachable' });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);

    try {
      await updateSettings({
        gemini_api_key: geminiKey ? geminiKey : undefined,
        openai_api_key: openaiKey ? openaiKey : undefined,
        provider: provider,
      });
      setSaveSuccess(true);
      setGeminiKey('');
      setOpenaiKey('');
      await loadSettings();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5 text-left">
      <div>
        <h1 className="text-[26px] font-bold text-primaryText tracking-tight">
          System Settings & API Keys
        </h1>
        <p className="text-[13px] text-secondaryText mt-0.5">
          Configure language model backends, environment parameters, and analytical engines.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center gap-2.5 text-[13px] text-successGreen font-medium">
          <Check className="w-4 h-4" />
          <span>Settings successfully persisted to server environment!</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center gap-2.5 text-[13px] text-dangerRed">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        {/* LLM Engine Selection */}
        <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-primaryBlue" />
            <div>
              <h3 className="text-[15px] font-bold text-primaryText">AI Intelligence Provider</h3>
              <p className="text-[12px] text-secondaryText">
                Choose the natural language reasoning and explanation driver.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              {
                id: 'deterministic',
                name: 'Deterministic NLP Engine',
                desc: 'Zero-key, 100% offline heuristic parser & explanation engine.',
                badge: 'Default / Instant',
              },
              {
                id: 'gemini',
                name: 'Google Gemini 2.5 Flash',
                desc: 'Deep reasoning, rich takeaways, powered by Google GenAI.',
                badge: statusInfo?.gemini_api_key_set ? 'Key Configured' : 'Needs Key',
              },
              {
                id: 'openai',
                name: 'OpenAI GPT-4o Mini',
                desc: 'High-precision structured JSON schema generation.',
                badge: statusInfo?.openai_api_key_set ? 'Key Configured' : 'Needs Key',
              },
            ].map((p) => (
              <div
                key={p.id}
                onClick={() => setProvider(p.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  provider === p.id
                    ? 'border-primaryBlue bg-lightBlue/20 ring-1 ring-primaryBlue'
                    : 'border-borderGrey bg-[#F8FAFC] hover:bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-bold text-primaryText">{p.name}</span>
                    <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-white border border-borderGrey text-secondaryText">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondaryText leading-relaxed">{p.desc}</p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-primaryBlue">
                  {provider === p.id ? 'Active Engine' : 'Click to Select'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-4">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-primaryBlue" />
            <div>
              <h3 className="text-[15px] font-bold text-primaryText">Environment API Keys</h3>
              <p className="text-[12px] text-secondaryText">
                Stored securely in backend environment variables.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[12px] font-semibold text-primaryText mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={statusInfo?.gemini_key_masked || "Enter AIzaSy..."}
                className="w-full bg-[#F8FAFC] border border-borderGrey rounded-xl px-3.5 py-2 text-[12px] text-primaryText focus:outline-none focus:border-primaryBlue"
              />
              <span className="text-[10px] text-secondaryText mt-1 block">
                {statusInfo?.gemini_api_key_set ? "Currently active in backend." : "Not configured. Using deterministic fallback."}
              </span>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-primaryText mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder={statusInfo?.openai_key_masked || "Enter sk-..."}
                className="w-full bg-[#F8FAFC] border border-borderGrey rounded-xl px-3.5 py-2 text-[12px] text-primaryText focus:outline-none focus:border-primaryBlue"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl bg-primaryBlue hover:bg-blue-600 text-white font-medium text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Settings & Configuration</span>}
          </button>
        </div>

        {/* System & Database Health */}
        <div className="bg-white border border-borderGrey rounded-card p-5 shadow-subtle space-y-3">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-primaryBlue" />
            <h3 className="text-[15px] font-bold text-primaryText">Infrastructure Status</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12px]">
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-borderGrey">
              <span className="text-secondaryText block">Backend API:</span>
              <span className="font-semibold text-successGreen flex items-center gap-1 mt-0.5">
                <Check className="w-3.5 h-3.5" /> {backendHealth?.status === 'healthy' ? 'Online & Healthy' : 'Connecting...'}
              </span>
            </div>
            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-borderGrey">
              <span className="text-secondaryText block">Database Engine:</span>
              <span className="font-semibold text-primaryText mt-0.5 block">SQLite via SQLAlchemy 2.1</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

/* Security: client-side key preview masking */
