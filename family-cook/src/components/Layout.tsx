import { useState } from 'react';
import { BookOpen, Home, ShoppingCart, Settings, Menu, X, ChefHat, Plus } from 'lucide-react';
import { translations } from '../lib/i18n';

type Page = 'home' | 'recipes' | 'shopping' | 'settings';

interface LayoutProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onAddRecipe: () => void;
  children: React.ReactNode;
  appIcon?: string;
}

const navItems: { key: Page; label: string; icon: React.ElementType }[] = [
  { key: 'home', label: translations.uk.home, icon: Home },
  { key: 'recipes', label: translations.uk.recipes, icon: BookOpen },
  { key: 'shopping', label: translations.uk.shopping, icon: ShoppingCart },
  { key: 'settings', label: translations.uk.settings, icon: Settings },
];

export default function Layout({ currentPage, onNavigate, onAddRecipe, children, appIcon }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Desktop sidebar */}
      <aside
        className="fixed top-0 left-0 h-full w-60 hidden lg:flex flex-col z-30"
        style={{
          background: 'var(--color-card)',
          borderRight: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Logo */}
        <div className="px-6 py-6 flex items-center gap-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-accent)' }}>
            {appIcon ? (
              <img src={appIcon} alt="icon" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={18} color="white" />
            )}
          </div>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
              {translations.uk.familyKitchen}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{translations.uk.ourRecipeBook}</div>
          </div>
        </div>

        {/* Add Recipe button */}
        <div className="px-4 py-4">
          <button className="btn-primary w-full justify-center" onClick={onAddRecipe}>
            <Plus size={15} />
            {translations.uk.addRecipe}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 pb-6">
          {navItems.map(({ key, label, icon: Icon }) => {
            const active = currentPage === key;
            return (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--color-accent-light)' : 'transparent',
                  color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  fontWeight: active ? 600 : 400,
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile top bar */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: 'var(--color-card)',
          borderBottom: '1px solid var(--color-border-light)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-accent)' }}>
            {appIcon ? (
              <img src={appIcon} alt="icon" className="w-full h-full object-cover" />
            ) : (
              <ChefHat size={15} color="white" />
            )}
          </div>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
            {translations.uk.familyKitchen}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary py-1.5 px-3 text-xs" onClick={onAddRecipe}>
            <Plus size={13} />
            {translations.uk.add}
          </button>
          <button
            className="btn-ghost p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: 'var(--color-card)' }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border-light)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden" style={{ background: 'var(--color-accent)' }}>
                {appIcon ? (
                  <img src={appIcon} alt="icon" className="w-full h-full object-cover" />
                ) : (
                  <ChefHat size={15} color="white" />
                )}
              </div>
              <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                {translations.uk.familyKitchen}
              </span>
            </div>
            <button className="btn-ghost p-2" onClick={() => setMenuOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="flex-1 px-4 pt-4">
            {navItems.map(({ key, label, icon: Icon }) => {
              const active = currentPage === key;
              return (
                <button
                  key={key}
                  onClick={() => { onNavigate(key); setMenuOpen(false); }}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl mb-2 text-base font-medium transition-all"
                  style={{
                    background: active ? 'var(--color-accent-light)' : 'transparent',
                    color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  <Icon size={20} />
                  {label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex"
        style={{
          background: 'var(--color-card)',
          borderTop: '1px solid var(--color-border-light)',
          boxShadow: '0 -4px 12px rgba(61,44,30,0.06)',
        }}
      >
        {navItems.map(({ key, label, icon: Icon }) => {
          const active = currentPage === key;
          return (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 px-2 text-xs transition-colors"
              style={{ color: active ? 'var(--color-accent)' : 'var(--color-text-muted)', fontWeight: active ? 600 : 400 }}
            >
              <Icon size={19} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main content */}
      <main className="lg:ml-60 pb-20 lg:pb-0 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
