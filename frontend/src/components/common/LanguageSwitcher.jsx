import React from 'react';
import { useLanguage } from '../../i18n';

/**
 * LanguageSwitcher component for Dheeksha Insurance.
 * Displays "English | தமிழ்" as selectable options with accessible controls,
 * smooth state transition, and dark mode support.
 */
const LanguageSwitcher = ({ 
  id = 'navbar-language-switcher',
  className = '',
  size = 'md',
}) => {
  const { language, changeLanguage } = useLanguage();

  const isEn = language === 'en';
  const isTa = language === 'ta';

  // Compact size styling for mobile headers vs standard desktop
  const sizeClasses = size === 'sm' 
    ? 'text-[11px] py-1 px-1.5' 
    : 'text-xs sm:text-sm py-1 px-2';

  const btnPadding = size === 'sm'
    ? 'px-1.5 py-0.5'
    : 'px-2 py-0.5';

  return (
    <div
      id={id}
      role="group"
      aria-label="Language selection / மொழி தேர்வு"
      className={`inline-flex items-center rounded-lg border border-ui-border dark:border-brand-darkBorder bg-white/90 dark:bg-brand-darkElevated/90 backdrop-blur-xs shadow-2xs transition-colors duration-200 select-none ${sizeClasses} ${className}`}
    >
      {/* English Option */}
      <button
        type="button"
        lang="en"
        onClick={() => changeLanguage('en')}
        aria-pressed={isEn}
        aria-current={isEn ? 'true' : undefined}
        aria-label="Switch to English"
        className={`rounded-md font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky ${btnPadding} ${
          isEn
            ? 'bg-brand-light dark:bg-brand-darkSurface text-brand-strong dark:text-brand-sky font-semibold shadow-2xs ring-1 ring-brand-sky/30 dark:ring-brand-sky/20'
            : 'text-text-secondary dark:text-text-darkSecondary hover:text-brand-strong dark:hover:text-brand-sky'
        }`}
      >
        English
      </button>

      {/* Visual Separator */}
      <span 
        className="text-ui-border dark:text-brand-darkBorder mx-1 text-xs select-none opacity-80" 
        aria-hidden="true"
      >
        |
      </span>

      {/* Tamil Option */}
      <button
        type="button"
        lang="ta"
        onClick={() => changeLanguage('ta')}
        aria-pressed={isTa}
        aria-current={isTa ? 'true' : undefined}
        aria-label="தமிழுக்கு மாறவும் (Switch to Tamil)"
        className={`rounded-md font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky ${btnPadding} ${
          isTa
            ? 'bg-brand-light dark:bg-brand-darkSurface text-brand-strong dark:text-brand-sky font-semibold shadow-2xs ring-1 ring-brand-sky/30 dark:ring-brand-sky/20'
            : 'text-text-secondary dark:text-text-darkSecondary hover:text-brand-strong dark:hover:text-brand-sky'
        }`}
      >
        தமிழ்
      </button>
    </div>
  );
};

export default LanguageSwitcher;
