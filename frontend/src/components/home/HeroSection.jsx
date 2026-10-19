import React from 'react';
import Container from '../layout/Container';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { Phone, ArrowRight } from 'lucide-react';
import heroVehicle from '../../assets/images/hero-vehicle.jpg';
import contactInfo from '../../config/contactInfo';
import { useTranslation } from '../../i18n';

const HeroSection = () => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-brand-light dark:bg-brand-darkBg transition-colors duration-300">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="w-full md:w-1/2 z-10 animate-slide-up">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-sky/20 text-brand-strong dark:text-brand-sky font-semibold text-sm mb-6 uppercase tracking-wider">
              {t('hero.badge')}
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] text-brand-navy dark:text-text-darkPrimary font-bold leading-tight mb-6">
              {t('hero.titlePart1')} <br className="hidden lg:block" />
              {t('hero.titlePart2')}{' '}
              <span className="text-brand-strong dark:text-brand-sky">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed mb-4 max-w-lg">
              {t('hero.description')}
            </p>
            <p className="text-sm text-text-secondary/80 dark:text-text-darkSecondary/80 font-medium leading-relaxed mb-8 max-w-lg">
              {t('hero.vehiclesList')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/get-in-touch">
                <Button variant="primary" size="lg" className="gap-2">
                  {t('hero.getInTouch')} <ArrowRight size={18} />
                </Button>
              </Link>
              <a href={contactInfo.phones[0].tel}>
                <Button variant="outline" size="lg" className="gap-2 bg-white dark:bg-brand-darkElevated dark:border-brand-darkBorder dark:text-text-darkPrimary hover:border-brand-sky hover:text-brand-navy dark:hover:text-brand-sky">
                  <Phone size={18} /> {t('hero.callUs')}
                </Button>
              </a>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 z-10 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-sky rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
              <img 
                src={heroVehicle} 
                alt="Dheeksha Insurance vehicle assistance" 
                className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
