import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { Shield, RefreshCw, FileText, Briefcase, Headphones, AlertTriangle } from 'lucide-react';
import contactInfo from '../config/contactInfo';

const Services = () => {
  useDocumentTitle('Dheeksha Insurance | Insurance Services & Claim Assistance');

  const services = [
    {
      title: 'Vehicle Insurance Assistance',
      icon: <Shield className="w-8 h-8 text-brand-strong" />,
      description: 'Guidance for customers looking for vehicle insurance options through available insurers.',
    },
    {
      title: 'Insurance Renewal Assistance',
      icon: <RefreshCw className="w-8 h-8 text-brand-strong" />,
      description: 'Support with understanding and completing vehicle insurance renewal requirements.',
    },
    {
      title: 'Claim Assistance',
      icon: <AlertTriangle className="w-8 h-8 text-brand-strong" />,
      description: 'Personal guidance through claim-related documentation, communication and follow-up.',
    },
    {
      title: 'Policy Assistance',
      icon: <Briefcase className="w-8 h-8 text-brand-strong" />,
      description: 'Help understanding policy-related information and requirements.',
    },
    {
      title: 'Documentation Guidance',
      icon: <FileText className="w-8 h-8 text-brand-strong" />,
      description: 'Guidance on the documents and information required for insurance or claim-related processes.',
    },
    {
      title: 'Customer Support',
      icon: <Headphones className="w-8 h-8 text-brand-strong" />,
      description: 'Direct communication and personal assistance when customers need help.',
    }
  ];

  const claimSteps = [
    { num: '01', title: 'Understand' },
    { num: '02', title: 'Prepare' },
    { num: '03', title: 'Guide' },
    { num: '04', title: 'Follow Up' }
  ];

  const howWeHelpSteps = [
    { num: '01', title: 'Understand Your Need' },
    { num: '02', title: 'Guide You Through the Process' },
    { num: '03', title: 'Help With Documentation' },
    { num: '04', title: 'Follow Up When Assistance Is Needed' }
  ];

  return (
    <div className="animate-fade-in bg-white dark:bg-brand-darkBg transition-colors duration-300">
      {/* Page Hero */}
      <section className="bg-brand-navy dark:bg-[#07101B] pt-16 pb-16 md:pt-20 md:pb-24 text-white relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-strong/10 skew-x-12 transform origin-top-right"></div>
        <Container className="relative z-10">
          <div className="max-w-3xl">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-sky/20 text-brand-sky text-sm font-semibold tracking-wider mb-6">
              OUR SERVICES
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
              Insurance Support That Stays With You
            </h1>
            <p className="text-lg md:text-xl text-brand-light opacity-90 leading-relaxed max-w-2xl">
              From vehicle insurance assistance to claim guidance, Dheeksha Insurance provides personal support throughout the process.
            </p>
          </div>
        </Container>
      </section>

      {/* Services Grid */}
      <section className="py-12 md:py-20 bg-brand-light dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 items-stretch">
            {services.map((service, index) => (
              <div 
                key={index} 
                className="bg-white dark:bg-brand-darkSurface p-6 md:p-8 rounded-[24px] shadow-sm hover:shadow-lg border border-ui-border dark:border-brand-darkBorder hover:border-brand-sky dark:hover:border-brand-sky hover:-translate-y-1 transition-all duration-300 flex flex-col h-full group"
              >
                <div className="w-14 h-14 bg-brand-light dark:bg-brand-darkElevated rounded-2xl flex items-center justify-center mb-6 group-hover:bg-brand-sky/10 transition-colors flex-shrink-0">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-brand-navy dark:text-text-darkPrimary mb-3 text-left leading-snug min-h-[3.25rem] md:min-h-[3.5rem] flex items-start">
                  {service.title}
                </h3>
                <p className="text-text-secondary dark:text-text-darkSecondary leading-relaxed text-sm md:text-base text-left flex-grow">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured Claim Section */}
      <section className="py-12 md:py-20 bg-white dark:bg-brand-darkBg border-b border-ui-border dark:border-brand-darkBorder transition-colors duration-300">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6">
                Support Beyond the Policy
              </h2>
              <p className="text-lg text-text-secondary dark:text-text-darkSecondary leading-relaxed mb-10 max-w-lg">
                When a claim arises, understanding the next steps can make the process easier. Dheeksha Insurance provides personal guidance with documentation, communication and follow-up.
              </p>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-2 gap-6">
                {claimSteps.map((step, index) => (
                  <div key={index} className="bg-brand-navy dark:bg-brand-darkSurface border border-transparent dark:border-brand-darkBorder p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 text-6xl font-bold text-white/5 transition-transform group-hover:scale-110">
                      {step.num}
                    </div>
                    <div className="text-brand-sky font-bold text-lg mb-2">{step.num}</div>
                    <h3 className="text-white text-xl font-semibold relative z-10">{step.title}</h3>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* How Dheeksha Helps */}
      <section className="py-12 md:py-20 bg-brand-light dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6">
              Personal Support, Step by Step
            </h2>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {howWeHelpSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-6 p-8 bg-white dark:bg-brand-darkSurface rounded-2xl shadow-sm border border-ui-border dark:border-brand-darkBorder">
                  <div className="text-3xl font-bold text-brand-sky">
                    {step.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-brand-navy dark:text-text-darkPrimary pt-1">{step.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20 bg-brand-navy dark:bg-[#07101B] text-center transition-colors duration-300">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Need Insurance Assistance?
            </h2>
            <p className="text-lg text-brand-light mb-12 opacity-90 max-w-2xl mx-auto leading-relaxed">
              Have a question about vehicle insurance, renewal or a claim? Get in touch with Dheeksha Insurance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/contact">
                <Button variant="primary" className="w-full sm:w-auto px-8 py-3 text-lg">
                  Get in Touch
                </Button>
              </Link>
              <a href={contactInfo.phones[0].tel}>
                <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-lg border-white text-white hover:bg-white hover:text-brand-navy">
                  Call Us
                </Button>
              </a>
              <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full sm:w-auto px-8 py-3 text-lg border-green-500 text-green-500 hover:bg-green-500 hover:text-white">
                  WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Services;
