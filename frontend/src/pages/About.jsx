import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import ContactCTA from '../components/home/ContactCTA';

const About = () => {
  useDocumentTitle('About Us');

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <section className="bg-brand-light py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy mb-6">
              About Dheeksha Insurance
            </h1>
            <p className="text-lg md:text-xl text-text-secondary">
              A trusted local partner in Peravurani dedicated to simplifying vehicle insurance and standing by your side during claims.
            </p>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <Container>
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="w-full md:w-1/2">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square max-w-md mx-auto md:mx-0">
                <img 
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Mr. Neelkanth - Founder" 
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-brand-navy text-white p-6">
                  <h3 className="text-xl font-bold">Mr. Neelkanth</h3>
                  <p className="text-brand-sky">Founder, Dheeksha Insurance</p>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/2">
              <div className="w-12 h-1 bg-brand-sky mb-8 rounded-full"></div>
              
              <h2 className="text-3xl font-bold text-brand-navy mb-6">
                Our Business Approach
              </h2>
              
              <div className="space-y-6 text-text-secondary text-lg">
                <p>
                  Located in the heart of Peravurani, Thanjavur, Dheeksha Insurance was founded on a simple premise: insurance should be easy to understand and even easier to use when you need it most.
                </p>
                
                <p>
                  Led by Mr. Neelkanth, our business operates on the core values of trust, transparency, and personal support. We understand that buying insurance is just the beginning of the relationship. The real value of an insurance provider is tested during the claim process.
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy pt-4 pb-2">
                  Customer Support Philosophy
                </h3>
                
                <p>
                  We are not a faceless online portal. We are a local business deeply rooted in our community. When you contact Dheeksha Insurance, you speak directly with our team who knows you and understands your specific situation.
                </p>
                
                <p>
                  Our philosophy is end-to-end assistance. From the moment you purchase a policy, to the critical times when you need to file a claim, we provide hands-on guidance. We liaison with insurance companies, banks, and microfinance institutions to ensure your paperwork is correct and your processes are handled smoothly.
                </p>
                
                <h3 className="text-2xl font-bold text-brand-navy pt-4 pb-2">
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
