import React from 'react';
import { Link } from 'react-router-dom';
import Container from './Container';
import { Logo } from '../ui/Logo';
import contactInfo from '../../config/contactInfo';
import { useTranslation } from '../../i18n';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-brand-navy dark:bg-[#07101B] dark:border-t dark:border-brand-darkBorder text-white pt-16 pb-8 transition-colors duration-300">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6 bg-white inline-block px-4 py-2 rounded-xl shadow-sm">
              <Logo />
            </div>
            <p className="text-brand-light font-medium text-lg mb-2">
              {t('footer.tagline')}
            </p>
            <p className="text-brand-light opacity-80 max-w-sm mb-6 leading-relaxed">
              {t('footer.description')}
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-sky">{t('footer.navigation')}</h4>
            <ul className="space-y-2 text-brand-light opacity-80">
              <li><Link to="/" className="hover:text-white hover:underline transition-all">{t('nav.home')}</Link></li>
              <li><Link to="/services" className="hover:text-white hover:underline transition-all">{t('nav.services')}</Link></li>
              <li><Link to="/vehicles" className="hover:text-white hover:underline transition-all">{t('nav.vehicles')}</Link></li>
              <li><Link to="/about" className="hover:text-white hover:underline transition-all">{t('nav.about')}</Link></li>
              <li><Link to="/claim-assistance" className="hover:text-white hover:underline transition-all">{t('nav.claimAssistance')}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-sky">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-brand-light opacity-80">
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">{t('footer.location')}</span> 
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">{t('footer.phone')}</span> 
                <div className="flex flex-col">
                  {contactInfo.phones.map((phone, idx) => (
                    <a key={idx} href={phone.tel} className="hover:text-white transition-colors">{phone.display}</a>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">{t('footer.whatsapp')}</span> 
                <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{contactInfo.whatsapp.display}</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">{t('footer.email')}</span> 
                <a href={contactInfo.email.mailto} className="hover:text-white transition-colors break-all">{contactInfo.email.display}</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-brand-light opacity-60">
          <p>&copy; {CURRENT_YEAR} Dheeksha Insurance. {t('footer.rights')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <span className="text-brand-light opacity-75">{t('footer.privacyPolicy')}</span>
            <span className="text-brand-light opacity-75">{t('footer.terms')}</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
