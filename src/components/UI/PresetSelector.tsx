import { useState, useEffect, useCallback } from 'react';
import { GlassCard } from '@/components/common/GlassCard';
import { useEcosystemStore } from '@/store/useEcosystemStore';
import {
  PRESET_ECOSYSTEMS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
} from '@/data/presets';
import { getSpeciesById } from '@/data/species';
import { BookOpen, ChevronDown, ChevronUp, Sparkles, X, Lightbulb, Check } from 'lucide-react';

function Toast({ message, emoji, visible }: { message: string; emoji: string; visible: boolean }) {
  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
    >
      <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/90 backdrop-blur-xl 
                      border border-emerald-300/30 rounded-2xl shadow-2xl shadow-emerald-500/30">
        <span className="text-2xl">{emoji}</span>
        <span className="text-white font-bold text-lg">{message}</span>
        <Check size={20} className="text-white" />
      </div>
    </div>
  );
}

export function PresetSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastEmoji, setToastEmoji] = useState('');
  const loadPreset = useEcosystemStore((s) => s.loadPreset);
  const currentPresetId = useEcosystemStore((s) => s.currentPresetId);

  const selectedPreset = selectedPresetId
    ? PRESET_ECOSYSTEMS.find((p) => p.id === selectedPresetId)
    : null;

  const showToast = useCallback((message: string, emoji: string) => {
    setToastMessage(message);
    setToastEmoji(emoji);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }, []);

  const handleLoadPreset = useCallback((presetId: string) => {
    const preset = PRESET_ECOSYSTEMS.find((p) => p.id === presetId);
    if (!preset) return;

    loadPreset(presetId);
    setIsOpen(false);
    setSelectedPresetId(null);
    setShowInfo(false);
    showToast(`已加载「${preset.name}」`, preset.emoji);
  }, [loadPreset, showToast]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-preset-panel]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const categories = ['freshwater', 'rainforest', 'polluted', 'marine', 'custom'] as const;

  return (
    <>
      <Toast message={toastMessage} emoji={toastEmoji} visible={toastVisible} />

      <div className="absolute top-4 right-4 z-40" data-preset-panel>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 
                     backdrop-blur-md border border-white/20 rounded-xl text-white font-medium
                     hover:from-cyan-500/50 hover:to-purple-500/50 transition-all duration-300
                     shadow-lg hover:shadow-cyan-500/25"
        >
          <Sparkles size={18} className="text-cyan-300" />
          <span>预设场景</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {currentPresetId && (
          <div className="mt-2 px-3 py-1.5 bg-emerald-500/30 backdrop-blur-md 
                          border border-emerald-400/30 rounded-lg text-emerald-200 text-sm
                          flex items-center gap-2 transition-all duration-500
                          animate-[fadeIn_0.5s_ease-out]">
            <span className="text-lg">
              {PRESET_ECOSYSTEMS.find((p) => p.id === currentPresetId)?.emoji}
            </span>
            <span>
              {PRESET_ECOSYSTEMS.find((p) => p.id === currentPresetId)?.name}
            </span>
          </div>
        )}

        {isOpen && (
          <div className="mt-2 w-80 max-h-[70vh] overflow-y-auto animate-[slideDown_0.3s_ease-out]">
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <BookOpen size={20} className="text-cyan-300" />
                  选择预设生态场景
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-white/70 text-sm mb-4">
                一键加载预设生态系统，观察不同环境下的生物演化规律
              </p>

              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryPresets = PRESET_ECOSYSTEMS.filter((p) => p.category === category);
                  if (categoryPresets.length === 0) return null;

                  return (
                    <div key={category}>
                      <div
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: CATEGORY_COLORS[category] }}
                      >
                        {CATEGORY_LABELS[category]}
                      </div>
                      <div className="space-y-2">
                        {categoryPresets.map((preset) => (
                          <div
                            key={preset.id}
                            className={`p-3 rounded-xl cursor-pointer transition-all duration-200
                              ${selectedPresetId === preset.id
                                ? 'bg-white/20 border-2 border-cyan-400'
                                : 'bg-white/5 hover:bg-white/10 border-2 border-transparent'
                              }`}
                            onClick={() => {
                              setSelectedPresetId(preset.id);
                              setShowInfo(true);
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-3xl">{preset.emoji}</span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-medium">{preset.name}</span>
                                  <span
                                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: `${DIFFICULTY_COLORS[preset.difficulty]}30`,
                                      color: DIFFICULTY_COLORS[preset.difficulty],
                                    }}
                                  >
                                    {DIFFICULTY_LABELS[preset.difficulty]}
                                  </span>
                                </div>
                                <p className="text-white/60 text-sm line-clamp-2">
                                  {preset.description}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {preset.species.slice(0, 5).map((s) => {
                                    const species = getSpeciesById(s.speciesId);
                                    return species ? (
                                      <span
                                        key={s.speciesId}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 
                                                   bg-white/10 rounded-full text-xs text-white/80"
                                      >
                                        <span>{species.emoji}</span>
                                        <span>×{s.count}</span>
                                      </span>
                                    ) : null;
                                  })}
                                  {preset.species.length > 5 && (
                                    <span className="px-2 py-0.5 text-xs text-white/50">
                                      +{preset.species.length - 5}种
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        )}

        {showInfo && selectedPreset && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4
                          animate-[fadeIn_0.3s_ease-out]">
            <GlassCard className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6
                                  animate-[scaleIn_0.3s_ease-out]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-6xl">{selectedPreset.emoji}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedPreset.name}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[selectedPreset.category]}30`,
                          color: CATEGORY_COLORS[selectedPreset.category],
                        }}
                      >
                        {CATEGORY_LABELS[selectedPreset.category]}
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${DIFFICULTY_COLORS[selectedPreset.difficulty]}30`,
                          color: DIFFICULTY_COLORS[selectedPreset.difficulty],
                        }}
                      >
                        {DIFFICULTY_LABELS[selectedPreset.difficulty]}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowInfo(false);
                    setSelectedPresetId(null);
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <p className="text-white/80 mb-6">{selectedPreset.description}</p>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <BookOpen size={18} className="text-cyan-300" />
                  生态知识
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {selectedPreset.educationalInfo}
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb size={18} className="text-amber-300" />
                  观察要点
                </h3>
                <ul className="space-y-2">
                  {selectedPreset.expectedObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-white/70">
                      <span className="text-cyan-400 font-bold mt-0.5">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 rounded-xl p-4 mb-6">
                <h3 className="text-white font-semibold mb-3">包含物种</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPreset.species.map((s) => {
                    const species = getSpeciesById(s.speciesId);
                    return species ? (
                      <div
                        key={s.speciesId}
                        className="flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                      >
                        <span className="text-xl">{species.emoji}</span>
                        <div className="flex-1">
                          <div className="text-white text-sm">{species.name}</div>
                          <div className="text-white/50 text-xs">×{s.count}</div>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowInfo(false);
                    setSelectedPresetId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 
                             rounded-xl text-white font-medium transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleLoadPreset(selectedPreset.id)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 
                             hover:from-cyan-400 hover:to-purple-400 rounded-xl text-white 
                             font-bold transition-all duration-300 shadow-lg shadow-cyan-500/25
                             flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  加载此场景
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </>
  );
}
