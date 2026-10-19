import React from 'react';
import Container from '../layout/Container';
import { useTranslation } from '../../i18n';

const SupportSteps = () => {
  const { t } = useTranslation();

  const steps = [
    {
      number: "01",
      title: t('supportSteps.step1Title'),
      description: t('supportSteps.step1Desc'),
      align: "start"
    },
    {
      number: "02",
      title: t('supportSteps.step2Title'),
      description: t('supportSteps.step2Desc'),
      align: "end"
    },
    {
      number: "03",
      title: t('supportSteps.step3Title'),
      description: t('supportSteps.step3Desc'),
      align: "start"
    },
    {
      number: "04",
      title: t('supportSteps.step4Title'),
      description: t('supportSteps.step4Desc'),
      align: "end"
    }
  ];

  return (
    <section className="py-24 bg-brand-navy dark:bg-[#07101B] dark:border-y dark:border-brand-darkBorder text-white relative overflow-hidden transition-colors duration-300">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-strong opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-sky opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      
      <Container className="relative z-10">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-h2 md:text-h1 font-bold leading-tight mb-4 text-white">
            {t('supportSteps.title')}
          </h2>
          <p className="text-brand-light/90 text-base md:text-lg leading-relaxed">
            {t('supportSteps.description')}
          </p>
          <div className="w-16 h-1 bg-brand-sky mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1px] bg-brand-sky/20 z-0"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="relative z-10 group p-8 rounded-3xl bg-brand-navy dark:bg-brand-darkSurface border border-white/5 dark:border-brand-darkBorder shadow-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-brand-sky/10 flex items-center justify-center mb-6 group-hover:bg-brand-sky/20 transition-colors">
                <span className="text-3xl font-bold text-brand-sky">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
              <p className="text-brand-light/70 leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default SupportSteps;
