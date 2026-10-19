import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import HeroSection from '../components/home/HeroSection';
import VehicleCategories from '../components/home/VehicleCategories';
import SupportSteps from '../components/home/SupportSteps';
import WhyDheeksha from '../components/home/WhyDheeksha';
import InsuranceCompaniesSection from '../components/home/InsuranceCompaniesSection';
import AboutFounder from '../components/home/AboutFounder';
import ServicesSection from '../components/home/ServicesSection';
import ClaimAssistanceSection from '../components/home/ClaimAssistanceSection';
import ContactCTA from '../components/home/ContactCTA';
import { useTranslation } from '../i18n';

const Home = () => {
  const { t } = useTranslation();
  useDocumentTitle(t('footer.tagline'));
  
  return (
    <main>
      <HeroSection />
      <VehicleCategories />
      <SupportSteps />
      <WhyDheeksha />
      <InsuranceCompaniesSection />
      <AboutFounder />
      <ServicesSection />
      <ClaimAssistanceSection />
      <ContactCTA />
    </main>
  );
};

export default Home;
