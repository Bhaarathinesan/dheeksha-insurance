import React from 'react';
import Container from '../layout/Container';
import { ClipboardList, FileText, UserCheck, PhoneCall } from 'lucide-react';

const ClaimAssistanceSection = () => {
  const steps = [
    {
      stepNum: '01',
      icon: <ClipboardList size={32} />,
      title: 'Understand the Claim',
      desc: 'We help you understand the claim process and requirements.'
    },
    {
      stepNum: '02',
      icon: <FileText size={32} />,
      title: 'Prepare Documents',
      desc: 'Guidance on collecting and submitting the correct documentation.'
    },
    {
      stepNum: '03',
      icon: <UserCheck size={32} />,
      title: 'Get Guidance',
      desc: 'Personal support addressing any queries you might have.'
    },
    {
      stepNum: '04',
      icon: <PhoneCall size={32} />,
      title: 'Follow Up',
      desc: 'We assist with communication and regular follow-ups.'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-brand-light">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-h2 md:text-h1 text-brand-navy font-bold mb-6">
            With You When You Need Support Most
          </h2>
          <p className="text-body text-text-secondary text-lg">
            From understanding the process to documentation and follow-up, Dheeksha Insurance provides personal guidance throughout the claim journey.
          </p>
        </div>
        
        <div className="relative mt-12">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-brand-sky/30 z-0"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => (
              <div key={idx} className="group flex flex-col items-center text-center animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-brand-strong mb-6 shadow-lg border-4 border-brand-light group-hover:scale-110 group-hover:border-brand-sky transition-all duration-300 relative">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-brand-navy rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md">
                    {step.stepNum}
                  </div>
                </div>
                <h3 className="text-xl text-brand-navy font-bold mb-3">
                  {step.title}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

export default ClaimAssistanceSection;
