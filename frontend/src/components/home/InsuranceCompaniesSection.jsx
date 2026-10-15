import React from 'react';
import Container from '../layout/Container';
import { insuranceCompanies } from '../../data/insuranceCompanies';
import InsuranceCompanyCard from './InsuranceCompanyCard';

const InsuranceCompaniesSection = () => {
  return (
    <section className="py-20 md:py-24 bg-white dark:bg-brand-darkBg transition-colors duration-300">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-h2 md:text-h1 text-brand-navy dark:text-text-darkPrimary font-bold mb-4">
            Insurance Companies Available Through Dheeksha
          </h2>
          <p className="text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed">
            Choose from insurance options across leading insurers with guidance from Dheeksha Insurance.
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {insuranceCompanies.map((company) => (
            <InsuranceCompanyCard key={company.id} company={company} />
          ))}
        </div>
      </Container>
    </section>
  );
};

export default InsuranceCompaniesSection;
