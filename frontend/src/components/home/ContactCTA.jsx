import React from 'react';
import { Link } from 'react-router-dom';
import Container from '../layout/Container';
import Button from '../ui/Button';
import { Phone, MessageCircle } from 'lucide-react';
import contactInfo from '../../config/contactInfo';
import { useTranslation } from '../../i18n';

const ContactCTA = () => {
  const { t } = useTranslation();

  return (
    <section className="py-16 bg-white dark:bg-brand-darkBg relative overflow-hidden transition-colors duration-300">
      <Container>
        <div className="bg-brand-navy dark:bg-brand-darkSurface border dark:border-brand-darkBorder rounded-3xl p-8 md:p-12 relative overflow-hidden text-center max-w-5xl mx-auto shadow-2xl">
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-sky opacity-20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-strong opacity-20 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
          
          <div className="relative z-10">
            <h2 className="text-h2 md:text-h1 text-white font-bold mb-6">
              {t('contactCTA.title')}
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-brand-light opacity-90 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('contactCTA.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/get-in-touch">
                <Button variant="primary" size="lg" className="px-8 shadow-lg shadow-brand-sky/20">
                  {t('contactCTA.getInTouch')}
                </Button>
              </Link>
              <a href={contactInfo.phones[0].tel}>
                <Button variant="outline" size="lg" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white">
                  <Phone size={20} /> {t('contactCTA.call')}
                </Button>
              </a>
              <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="lg" className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white">
                  <MessageCircle size={20} /> {t('contactCTA.whatsapp')}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ContactCTA;
