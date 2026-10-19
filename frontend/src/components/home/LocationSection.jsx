import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import { MapPin, Clock, Phone } from 'lucide-react';
import contactInfo from '../../config/contactInfo';
import { useTranslation } from '../../i18n';

const LocationSection = () => {
  const { t } = useTranslation();

  return (
    <section className="py-20 bg-brand-light/50 dark:bg-brand-darkBg border-t border-ui-border dark:border-brand-darkBorder transition-colors duration-300">
      <Container>
        <SectionHeading 
          title={t('location.title')} 
          subtitle={t('location.subtitle')} 
          centered={true} 
        />
        
        <div className="flex flex-col lg:flex-row gap-12 mt-12 bg-white dark:bg-brand-darkSurface rounded-3xl overflow-hidden shadow-sm border border-ui-border dark:border-brand-darkBorder p-2">
          
          {/* Map Placeholder / Interactive Google Maps Link */}
          <a
            href={contactInfo.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${contactInfo.businessName} - ${t('location.openInGoogleMaps')}`}
            className="w-full lg:w-7/12 h-80 lg:h-auto min-h-[400px] bg-slate-100 dark:bg-brand-darkElevated rounded-2xl relative overflow-hidden group block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 dark:focus-visible:ring-offset-brand-darkSurface cursor-pointer"
          >
            <div className="absolute inset-0 bg-brand-navy/5 dark:bg-brand-navy/20 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-brand-navy/10 group-focus-visible:bg-brand-navy/10">
              <div className="w-16 h-16 bg-white dark:bg-brand-darkSurface rounded-full flex items-center justify-center shadow-lg mb-4 text-brand-strong dark:text-brand-sky group-hover:scale-105 transition-transform duration-200">
                <MapPin size={32} />
              </div>
              <h4 className="font-bold text-brand-navy dark:text-text-darkPrimary text-lg">{contactInfo.businessName}</h4>
              <p className="text-text-secondary dark:text-text-darkSecondary text-sm max-w-[80%] text-center">{contactInfo.address}</p>
              <span className="text-xs text-brand-strong dark:text-brand-sky mt-2 font-medium bg-white dark:bg-brand-darkElevated px-3 py-1 rounded-full border border-brand-sky/30">
                {t('location.mapPlaceholder')}
              </span>
            </div>
          </a>
          
          {/* Contact Details */}
          <div className="w-full lg:w-5/12 p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">{contactInfo.businessName}</h3>
              <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed">{t('location.serviceTag')}</p>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand-darkElevated flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-1">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy dark:text-text-darkPrimary mb-1">{t('location.officeAddress')}</h4>
                  <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed">{contactInfo.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand-darkElevated flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-1">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy dark:text-text-darkPrimary mb-1">{t('location.contact')}</h4>
                  {contactInfo.phones.map((phone, idx) => (
                    <p key={idx} className={idx === 0 ? "text-text-secondary dark:text-text-darkSecondary mb-1 leading-relaxed" : "text-text-secondary dark:text-text-darkSecondary leading-relaxed"}>
                      {t('location.mobile')}{' '}
                      <a href={phone.tel} className="hover:text-brand-strong dark:hover:text-brand-sky transition-colors">{phone.display}</a>
                    </p>
                  ))}
                  <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed">
                    <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-strong dark:hover:text-brand-sky transition-colors">
                      {t('location.whatsappAvailable')}
                    </a>
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light dark:bg-brand-darkElevated flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-1">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy dark:text-text-darkPrimary mb-1">{t('location.businessHours')}</h4>
                  <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed">
                    {contactInfo.workingDays}: {contactInfo.workingHours}<br />
                    {t('location.sundayClosed')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </Container>
    </section>
  );
};

export default LocationSection;
