import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';

const SupportSteps = () => {
  const steps = [
    {
      number: "01",
      title: "Insurance Assistance",
      description: "Helping you find the right policy that meets your specific vehicle needs.",
      align: "start"
    },
    {
      number: "02",
      title: "Claim Guidance",
      description: "Step-by-step assistance when you need to file an insurance claim.",
      align: "end"
    },
    {
      number: "03",
      title: "Documentation Support",
      description: "Assistance with all necessary paperwork to ensure a smooth process.",
      align: "start"
    },
    {
      number: "04",
      title: "Follow-up & Communication",
      description: "We stay in touch with insurance providers and provide regular updates so you don't have to.",
      align: "end"
    }
  ];

  return (
    <section className="py-24 bg-brand-navy dark:bg-[#07101B] dark:border-y dark:border-brand-darkBorder text-white relative overflow-hidden transition-colors duration-300">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-strong opacity-10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-sky opacity-10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      
      <Container className="relative z-10">
        <div className="mb-16 max-w-3xl">
          <h2 className="text-h2 md:text-h1 font-bold leading-tight mb-4 text-white">
            Support at Every Step
          </h2>
          <p className="text-brand-light/90 text-base md:text-lg leading-relaxed">
            From insurance guidance to claim follow-up, get personal support throughout the process.
          </p>
          <div className="w-16 h-1 bg-brand-sky mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Subtle connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[12%] right-[12%] h-[1px] bg-brand-sky/20 z-0"></div>
          
          {steps.map((step, index) => (
            <div key={index} className="relative z-10 group p-8 rounded-3xl bg-brand-navy dark:bg-brand-darkSurface border border-white/5 dark:border-brand-darkBorder shadow-2xl hover:bg-white/5 transition-all duration-300 hover:-translate-y-1">
              <div className="w-16 h-16 rounded-2xl bg-brand-sky/10 flex items-center justify-center mb-6 group-hover:bg-brand-sky/20 transition-colors">
                <span className="text-3xl font-bold text-brand-sky">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-white">{step.title}</h3>
              <p className="text-brand-light/70 leading-relaxed text-sm">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default SupportSteps;
