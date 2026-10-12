import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import Card from '../ui/Card';
import { Shield, RefreshCw, FileText, ClipboardList, HelpCircle, HeartHandshake } from 'lucide-react';

const ServicesSection = () => {
  const services = [
    {
      title: "Vehicle Insurance Assistance",
      description: "Guidance on selecting the right insurance coverage for your specific vehicle type and requirements.",
      icon: <Shield className="w-6 h-6 text-brand-sky" />
    },
    {
      title: "Insurance Renewal Assistance",
      description: "Timely reminders and support to keep your vehicle protection active without any laps in coverage.",
      icon: <RefreshCw className="w-6 h-6 text-brand-sky" />
    },
    {
      title: "Claim Assistance",
      description: "Dedicated support through the entire claim process, from filing to follow-up with providers.",
      icon: <HeartHandshake className="w-6 h-6 text-brand-sky" />
    },
    {
      title: "Policy Assistance",
      description: "Help understanding policy terms, inclusions, exclusions, and maximizing your benefits.",
      icon: <ClipboardList className="w-6 h-6 text-brand-sky" />
    },
    {
      title: "Documentation Guidance",
      description: "Clear instructions on required paperwork for new policies, renewals, or insurance claims.",
      icon: <FileText className="w-6 h-6 text-brand-sky" />
    },
    {
      title: "Customer Support",
      description: "Responsive local assistance whenever you have questions about your vehicle insurance.",
      icon: <HelpCircle className="w-6 h-6 text-brand-sky" />
    }
  ];

  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionHeading 
          title="How We Can Help" 
          subtitle="" 
          centered={true} 
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {services.map((service, index) => (
            <Card key={index} className="flex flex-col h-full border-ui-border hover:border-brand-sky group hover:-translate-y-1 duration-400 hover:shadow-lg">
              <div className="w-12 h-12 bg-brand-light rounded-xl flex items-center justify-center mb-6 group-hover:bg-brand-sky/10 transition-colors">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-navy mb-3">{service.title}</h3>
              <p className="text-text-secondary flex-grow leading-relaxed">
                {service.description}
              </p>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default ServicesSection;
