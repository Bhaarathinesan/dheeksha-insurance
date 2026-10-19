import React from 'react';
import Container from '../layout/Container';
import { ClipboardList, FileText, UserCheck, PhoneCall } from 'lucide-react';
import { useTranslation } from '../../i18n';

const ClaimAssistanceSection = () => {
  const { t } = useTranslation();

  const steps = [
    {
      stepNum: '01',
      icon: <ClipboardList size={32} />,
      title: t('homeClaim.step1Title'),
      desc: t('homeClaim.step1Desc'),
    },
    {
      stepNum: '02',
      icon: <FileText size={32} />,
      title: t('homeClaim.step2Title'),
      desc: t('homeClaim.step2Desc'),
    },
    {
      stepNum: '03',
      icon: <UserCheck size={32} />,
      title: t('homeClaim.step3Title'),
      desc: t('homeClaim.step3Desc'),
    },
    {
      stepNum: '04',
      icon: <PhoneCall size={32} />,
      title: t('homeClaim.step4Title'),
      desc: t('homeClaim.step4Desc'),
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-light dark:bg-brand-darkBg transition-colors duration-300">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-h2 md:text-h1 text-brand-navy dark:text-text-darkPrimary font-bold mb-6">
            {t('homeClaim.title')}
          </h2>
          <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed">
            {t('homeClaim.description')}
          </p>
        </div>
        
        <div className="relative mt-12">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-brand-sky/30 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="group flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="w-24 h-24 bg-white dark:bg-brand-darkSurface rounded-full flex items-center justify-center text-brand-strong dark:text-brand-sky mb-6 shadow-lg border-4 border-brand-light dark:border-brand-darkElevated group-hover:scale-110 group-hover:border-brand-sky transition-all duration-300 relative">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy dark:bg-brand-sky text-white dark:text-brand-navy rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                    {step.stepNum}
                  </div>
                </div>
                <h3 className="text-xl text-brand-navy dark:text-text-darkPrimary font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed text-sm md:text-base">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ClaimAssistanceSection;
