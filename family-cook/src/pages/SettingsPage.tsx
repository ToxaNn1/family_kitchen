import { useEffect, useState } from 'react';
import { Settings, Send, Eye, EyeOff, CheckCircle, Upload } from 'lucide-react';
import { getAllSettings, setSetting, uploadRecipeImage } from '../lib/api';
import { sendToTelegram } from '../lib/telegram';
import { translations, getSetupSteps } from '../lib/i18n';

interface SettingsPageProps {
  addToast: (msg: string, type?: 'success' | 'error') => void;
  onSettingsChange?: () => void;
}

export default function SettingsPage({ addToast, onSettingsChange }: SettingsPageProps) {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [appIcon, setAppIcon] = useState('');
  const [appIconPreview, setAppIconPreview] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    getAllSettings().then((s) => {
      setBotToken(s['telegram_bot_token'] ?? '');
      setChatId(s['telegram_chat_id'] ?? '');
      const icon = s['app_icon'];
      setAppIcon(icon ?? '');
      setAppIconPreview(icon ?? '');
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        setSetting('telegram_bot_token', botToken.trim()),
        setSetting('telegram_chat_id', chatId.trim()),
        setSetting('app_icon', appIcon.trim()),
      ]);
      addToast(translations.uk.settingsSaved);
      onSettingsChange?.();
    } catch {
      addToast(translations.uk.failedToSaveSettings, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      addToast(translations.uk.fillBothFields, 'error');
      return;
    }
    setTesting(true);
    try {
      await sendToTelegram(botToken.trim(), chatId.trim(), '✅ Сімейна кухня під\'єднана до Telegram. Інтеграція працює.');
      addToast(translations.uk.testMessageSent);
    } catch (error) {
      console.error('Telegram test error:', error);
      addToast(translations.uk.testFailed, 'error');
    } finally {
      setTesting(false);
    }
  };

  const handleIconUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const preview = URL.createObjectURL(file);
    setAppIconPreview(preview);
    setUploadingIcon(true);
    try {
      const url = await uploadRecipeImage(file);
      setAppIcon(url);
    } catch {
      addToast(translations.uk.uploadIconFailed, 'error');
      setAppIconPreview('');
      setAppIcon('');
    } finally {
      setUploadingIcon(false);
    }
  };

  const setupSteps = getSetupSteps('uk');

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
          {translations.uk.settingsTitle}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{translations.uk.configureAppPreferences}</p>
      </div>

      {/* App Icon section */}
      <section className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
            <Upload size={18} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
              {translations.uk.appIcon}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{translations.uk.uploadCustomIcon}</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {translations.uk.appIcon}
          </label>
          <div
            className="relative rounded-xl overflow-hidden cursor-pointer"
            style={{
              height: 120,
              border: '2px dashed var(--color-border)',
              background: 'var(--color-surface)',
              transition: 'all 0.15s',
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) handleIconUpload(file);
              };
              input.click();
            }}
          >
            {appIconPreview ? (
              <>
                <img src={appIconPreview} alt={translations.uk.appIconAlt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(61,44,30,0.4)' }}>
                  <Upload size={20} color="white" />
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Upload size={20} style={{ color: 'var(--color-text-muted)' }} />
                <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  {uploadingIcon ? translations.uk.uploading : translations.uk.dropIconOrClick}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Telegram section */}
      <section className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#e8f0fe' }}>
            <Send size={18} style={{ color: '#2563eb' }} />
          </div>
          <div>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
              {translations.uk.telegramIntegration}
            </h2>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{translations.uk.sendRecipesAndShoppingLists}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {translations.uk.botToken}
            </label>
            <div className="relative">
              <input
                className="input-base pr-10"
                type={showToken ? 'text' : 'password'}
                placeholder="1234567890:ABCdef..."
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 btn-ghost p-0"
                onClick={() => setShowToken(!showToken)}
                type="button"
              >
                {showToken ? <EyeOff size={15} style={{ color: 'var(--color-text-muted)' }} /> : <Eye size={15} style={{ color: 'var(--color-text-muted)' }} />}
              </button>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>
              {translations.uk.getFromBotFather}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              {translations.uk.chatId}
            </label>
            <input
              className="input-base"
              placeholder={translations.uk.chatIdPlaceholder}
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-light)' }}>
              {translations.uk.yourChatIdOrGroupId}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              className="btn-secondary flex-1 justify-center"
              onClick={handleTest}
              disabled={testing}
              style={{ opacity: testing ? 0.7 : 1 }}
            >
              <CheckCircle size={14} />
              {testing ? translations.uk.testing : translations.uk.testConnection}
            </button>
            <button
              className="btn-primary flex-1 justify-center"
              onClick={handleSave}
              disabled={saving}
              style={{ opacity: saving ? 0.7 : 1 }}
            >
              {saving ? translations.uk.saving : translations.uk.saveSettings}
            </button>
          </div>
        </div>
      </section>

      {/* How to setup */}
      <section className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
            <Settings size={18} style={{ color: 'var(--color-accent)' }} />
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
            {translations.uk.howToSetupTelegram}
          </h2>
        </div>
        <ol className="space-y-3">
          {setupSteps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: 'var(--color-accent)', color: 'white', marginTop: 1 }}
              >
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
