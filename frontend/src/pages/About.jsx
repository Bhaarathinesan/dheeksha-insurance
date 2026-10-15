import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import ContactCTA from '../components/home/ContactCTA';
import founderPhoto from '../assets/images/neelkanth_ceo_image.jpeg';

const About = () => {
  useDocumentTitle('About Us');

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="bg-brand-light dark:bg-brand-darkBg transition-colors duration-300 py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6 leading-tight">
              About Dheeksha Insurance
            </h1>
            <p className="text-lg md:text-xl text-text-secondary dark:text-text-darkSecondary leading-relaxed">
              A trusted local partner in Peravurani dedicated to simplifying vehicle insurance and standing by your side during claims.
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
                  <h3 className="text-xl font-bold text-white">Mr. Neelkanth</h3>
                  <p className="text-brand-sky text-sm">Mr. Neelkanth, Founder, Dheeksha Insurance</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="w-12 h-1 bg-brand-sky mb-6 rounded-full"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6 text-left">
                Our Business Approach
              </h2>
              
              <div className="space-y-6 text-text-secondary dark:text-text-darkSecondary text-base md:text-lg leading-relaxed text-left md:text-justify [text-align-last:left]">
                <p>
                  Located in the heart of Peravurani, Thanjavur, Dheeksha Insurance was founded on a simple premise: insurance should be easy to understand and even easier to use when you need it most.
                </p>
                
                <p>
                  Led by Mr. Neelkanth, our business operates on the core values of trust, transparency, and personal support. We understand that buying insurance is just the beginning of the relationship. The real value of an insurance provider is tested during the claim process.
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary pt-6 pb-2 text-left">
                  Customer Support Philosophy
                </h3>
                
                <p>
                  We are not a faceless online portal. We are a local business deeply rooted in our community. When you contact Dheeksha Insurance, you speak directly with our team who knows you and understands your specific situation.
                </p>
                
                <p>
                  Our philosophy is end-to-end assistance. From the moment you purchase a policy, to the critical times when you need to file a claim, we provide hands-on guidance. We liaison with insurance companies, banks, and microfinance institutions to ensure your paperwork is correct and your processes are handled smoothly.
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy dark:text-text-darkPrimary pt-6 pb-2 text-left">
                  Our Office Presence
                </h3>
                
                <p>
                  We welcome our customers to visit our office in Peravurani. Having a physical presence allows us to offer immediate, face-to-face assistance for documentation, policy explanation, and claim filing—giving you complete peace of mind.
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
