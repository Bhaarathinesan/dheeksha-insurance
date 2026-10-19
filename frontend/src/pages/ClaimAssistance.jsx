import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import ContactCTA from '../components/home/ContactCTA';
import { PhoneCall, MapPin, FileCheck, Wrench, CheckCircle, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';

const ClaimAssistance = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('claimPage.docTitle'));

  const steps = [
    {
      icon: <AlertIcon />,
      title: t('claimPage.step1Title'),
      description: t('claimPage.step1Desc')
    },
    {
      icon: <PhoneCall className="w-8 h-8 text-brand-strong" />,
      title: t('claimPage.step2Title'),
      description: t('claimPage.step2Desc')
    },
    {
      icon: <MapPin className="w-8 h-8 text-brand-strong" />,
      title: t('claimPage.step3Title'),
      description: t('claimPage.step3Desc')
    },
    {
      icon: <FileCheck className="w-8 h-8 text-brand-strong" />,
      title: t('claimPage.step4Title'),
      description: t('claimPage.step4Desc')
    },
    {
      icon: <Wrench className="w-8 h-8 text-brand-strong" />,
      title: t('claimPage.step5Title'),
      description: t('claimPage.step5Desc')
    },
    {
      icon: <Clock className="w-8 h-8 text-brand-strong" />,
      title: t('claimPage.step6Title'),
      description: t('claimPage.step6Desc')
    }
  ];

  return (
    <div className="animate-fade-in">
      <section className="bg-brand-navy dark:bg-[#07101B] py-16 md:py-24 text-white transition-colors duration-300">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              {t('claimPage.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-brand-light opacity-90 leading-relaxed">
              {t('claimPage.heroDesc')}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 md:py-24 bg-white dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6">
              {t('claimPage.sectionTitle')}
            </h2>
            <p className="text-base md:text-lg text-text-secondary dark:text-text-darkSecondary leading-relaxed">
              {t('claimPage.sectionDesc')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative border-l-4 border-brand-light dark:border-brand-darkBorder ml-6 md:ml-12 space-y-12 pb-12">
              {steps.map((step, index) => (
                <div key={index} className="relative flex items-start">
                  <div className="absolute -left-[44px] bg-white dark:bg-brand-darkSurface border-4 border-brand-light dark:border-brand-darkElevated rounded-full w-20 h-20 flex items-center justify-center">
                    {step.icon}
                  </div>
                  <div className="ml-16 bg-brand-light/30 dark:bg-brand-darkSurface p-8 rounded-2xl w-full border border-ui-border dark:border-brand-darkBorder">
                    <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary mb-3">{step.title}</h3>
                    <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-16 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-2xl p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-start">
            <div className="text-red-500 mt-1 flex-shrink-0">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-brand-navy dark:text-red-200 mb-2">
                {t('claimPage.disclaimerTitle')}
              </h3>
              <p className="text-text-secondary dark:text-gray-300 leading-relaxed">
                {t('claimPage.disclaimerText')}
              </p>
            </div>
          </div>
        </Container>
      </section>

      <ContactCTA />
    </div>
  );
};

// Helper component for the first icon
const AlertIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-strong">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

export default ClaimAssistance;
