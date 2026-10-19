import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { Phone, MessageCircle, MapPin, Clock, Mail } from 'lucide-react';
import contactInfo from '../config/contactInfo';
import { useTranslation } from '../i18n';

const Contact = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('contactPage.docTitle'));

  return (
    <div className="animate-fade-in">
      <section className="bg-brand-light dark:bg-brand-darkBg transition-colors duration-300 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6 leading-tight">
              {t('contactPage.heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-darkSecondary leading-relaxed">
              {t('contactPage.heroDesc')}
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20 bg-white dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-1/2 space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-brand-navy dark:text-text-darkPrimary mb-8">
                  {t('contactPage.sectionTitle')}
                </h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href={contactInfo.phones[0].tel} className="w-full">
                      <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                        <Phone size={20} />
                        {t('contactPage.callUs')}
                      </Button>
                    </a>
                    <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 transition-colors rounded-xl px-6 py-3 font-semibold">
                        <MessageCircle size={20} />
                        {t('contactPage.chatWhatsapp')}
                      </Button>
                    </a>
                    <a href={contactInfo.email.mailto} className="w-full">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Mail size={20} />
                        {t('contactPage.sendEmail')}
                      </Button>
                    </a>
                    <Link to="/get-in-touch" className="w-full">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <MessageCircle size={20} />
                        {t('contactPage.enquiryForm')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6">
                  {t('contactPage.contactInfoHeading')}
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light dark:bg-brand-darkElevated rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-0.5">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-text-darkPrimary">
                        {t('contactPage.phone')}
                      </h3>
                      {contactInfo.phones.map((phone, idx) => (
                        <p key={idx} className={idx === 0 ? "text-text-secondary dark:text-text-darkSecondary mt-1 leading-relaxed" : "text-text-secondary dark:text-text-darkSecondary leading-relaxed"}>
                          <a href={phone.tel} className="hover:text-brand-strong dark:hover:text-brand-sky transition-colors">{phone.display}</a>
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light dark:bg-brand-darkElevated rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-0.5">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-text-darkPrimary">
                        {t('contactPage.whatsapp')}
                      </h3>
                      <p className="text-text-secondary dark:text-text-darkSecondary mt-1 leading-relaxed">
                        <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-strong dark:hover:text-brand-sky transition-colors">{contactInfo.whatsapp.display}</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light dark:bg-brand-darkElevated rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-0.5">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-text-darkPrimary">
                        {t('contactPage.email')}
                      </h3>
                      <p className="text-text-secondary dark:text-text-darkSecondary mt-1 leading-relaxed">
                        <a href={contactInfo.email.mailto} className="hover:text-brand-strong dark:hover:text-brand-sky transition-colors">{contactInfo.email.display}</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light dark:bg-brand-darkElevated rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-0.5">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-text-darkPrimary">
                        {t('contactPage.businessHours')}
                      </h3>
                      <p className="text-text-secondary dark:text-text-darkSecondary mt-1 leading-relaxed">{contactInfo.workingDays}</p>
                      <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed">{contactInfo.workingHours}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light dark:bg-brand-darkElevated rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong dark:text-brand-sky mt-0.5">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-brand-navy dark:text-text-darkPrimary">
                        {t('contactPage.officeLocation')}
                      </h3>
                      <p className="text-text-secondary dark:text-text-darkSecondary mt-1 max-w-xs leading-relaxed">{contactInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="w-full h-[500px] bg-brand-light dark:bg-brand-darkSurface rounded-3xl overflow-hidden shadow-premium flex items-center justify-center relative border border-ui-border dark:border-brand-darkBorder">
                <div className="absolute inset-0 bg-brand-navy/5 dark:bg-brand-navy/20"></div>
                <div className="text-center p-8 z-10">
                  <MapPin className="w-12 h-12 text-brand-strong dark:text-brand-sky mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary mb-2">
                    {t('contactPage.cityThanjavur')}
                  </h3>
                  <p className="text-text-secondary dark:text-text-darkSecondary mb-6 max-w-sm mx-auto leading-relaxed">
                    {t('contactPage.locationDesc')}
                  </p>
                  <a href={contactInfo.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">{t('contactPage.getDirections')}</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Contact;
