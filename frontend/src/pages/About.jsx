import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import ContactCTA from '../components/home/ContactCTA';
import founderPhoto from '../assets/images/neelkanth_ceo_image.jpeg';
import { useTranslation } from '../i18n';

const About = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('aboutPage.docTitle'));

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="bg-brand-light dark:bg-brand-darkBg transition-colors duration-300 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6 leading-tight">
              {t('aboutPage.title')}
            </h1>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-darkSecondary leading-relaxed">
              {t('aboutPage.subtitle')}
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-16 md:py-24 bg-white dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="flex flex-col md:flex-row gap-12 lg:gap-16 items-start">
            <div className="w-full md:w-1/2 md:sticky md:top-28">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square max-w-md mx-auto md:mx-0 border border-transparent dark:border-brand-darkBorder">
                <img 
                  src={founderPhoto} 
                  alt="Mr. Neelkanth, founder of Dheeksha Insurance" 
                  loading="lazy"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-brand-navy/95 dark:bg-brand-darkElevated/95 text-white p-6">
                  <h3 className="text-xl font-bold text-white">{t('aboutPage.founderName')}</h3>
                  <p className="text-brand-sky text-sm">{t('aboutPage.founderCaption')}</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="w-12 h-1 bg-brand-sky mb-6 rounded-full"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6 text-left">
                {t('aboutPage.approachTitle')}
              </h2>
              
              <div className="space-y-6 text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed text-left md:text-justify [text-align-last:left]">
                <p>
                  {t('aboutPage.p1')}
                </p>
                
                <p>
                  {t('aboutPage.p2')}
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary pt-6 pb-2 text-left">
                  {t('aboutPage.philosophyTitle')}
                </h3>
                
                <p>
                  {t('aboutPage.p3')}
                </p>
                
                <p>
                  {t('aboutPage.p4')}
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary pt-6 pb-2 text-left">
                  {t('aboutPage.presenceTitle')}
                </h3>
                
                <p>
                  {t('aboutPage.p5')}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <ContactCTA />
    </div>
  );
};

export default About;
