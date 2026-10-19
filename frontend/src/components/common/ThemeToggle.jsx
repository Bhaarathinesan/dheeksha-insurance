import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../i18n';

const ThemeToggle = ({ className = '', id = 'theme-toggle-btn' }) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === 'dark';

  const label = isDark ? t('common.switchToLight') : t('common.switchToDark');

  return (
    <button
      id={id}
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-sky border ${
        isDark
          ? 'bg-brand-darkElevated border-brand-darkBorder text-amber-300 hover:text-amber-200 hover:bg-brand-darkElevated/80 shadow-sm'
          : 'bg-white border-ui-border text-brand-navy hover:text-brand-strong hover:bg-brand-light shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
      <span className="sr-only">
        {label}
      </span>
    </button>
  );
};

export default ThemeToggle;
