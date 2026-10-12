import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import Button from '../ui/Button';
import ownerPhoto from '../../assets/images/neelkanth_photo.png';

const AboutFounder = () => {
  return (
    <section className="py-24 bg-brand-light">
      <Container>
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full md:w-5/12 relative">
            <div className="aspect-square max-w-sm mx-auto md:mx-0 rounded-3xl overflow-hidden shadow-xl border-8 border-white bg-white relative">
              {/* Fallback pattern/color when no photo is available */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-sky to-brand-strong flex items-center justify-center text-white">
                <span className="text-6xl font-bold opacity-30">MN</span>
              </div>
              <img 
                src={ownerPhoto} 
                alt="Mr. Neelkanth - Founder of Dheeksha Insurance" 
                loading="lazy"
                className="relative z-10 w-full h-full object-cover rounded-3xl"
              />
            </div>
            
            {/* Decorative dots */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 text-brand-sky/30 -z-10 hidden md:block">
              <svg viewBox="0 0 100 100" fill="currentColor">
                <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="2"></circle>
                </pattern>
                <rect width="100" height="100" fill="url(#dots)"></rect>
              </svg>
            </div>
          </div>
          
          <div className="w-full md:w-7/12">
            <SectionHeading 
              title="Meet the Founder" 
              subtitle="" 
            />
            <h3 className="text-2xl font-bold text-brand-navy mb-1">Mr. Neelkanth</h3>
            <p className="text-brand-strong font-medium mb-6">Founder, Dheeksha Insurance</p>
            
            <div className="prose prose-lg text-text-secondary">
              <p className="mb-6">
                At Dheeksha Insurance, customers receive personal guidance for vehicle insurance, renewals and claim-related support.
              </p>
              <p className="mb-8">
                Mr. Neelkanth works directly with customers to help them understand the process, prepare documentation and follow up when assistance is needed.
              </p>
              
              <Button variant="primary">Get in Touch</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default AboutFounder;
