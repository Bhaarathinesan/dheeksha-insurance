import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import { MessageSquare, Users, MapPin, CheckCircle } from 'lucide-react';

const WhyDheeksha = () => {
  const points = [
    {
      title: "Direct Communication",
      description: "Speak directly with the person assisting you.",
      icon: <MessageSquare className="w-7 h-7" />
    },
    {
      title: "Personal Support",
      description: "Get guidance based on your insurance needs.",
      icon: <Users className="w-7 h-7" />
    },
    {
      title: "Claim Assistance",
      description: "Receive support with documentation, communication and follow-up.",
      icon: <CheckCircle className="w-7 h-7" />
    },
    {
      title: "Local Presence",
      description: "Personal service from a locally based insurance professional.",
      icon: <MapPin className="w-7 h-7" />
    }
  ];

  return (
    <section className="py-20 bg-brand-light">
      <Container>
        <div className="flex flex-col lg:flex-row gap-16 lg:gap-24">
          <div className="w-full lg:w-5/12 lg:sticky lg:top-32 h-fit">
            <h2 className="text-h2 md:text-h1 font-bold text-brand-navy leading-tight mb-6">
              Why Choose Dheeksha Insurance?
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              We focus on building lasting relationships with our clients through reliable assistance, clear communication, and dedicated support.
            </p>
          </div>
          
          <div className="w-full lg:w-7/12">
            <div className="bg-white rounded-3xl shadow-sm border border-ui-border p-8 md:p-12">
              <div className="space-y-0 divide-y divide-ui-border/50">
                {points.map((point, index) => (
                  <div key={index} className="flex gap-6 py-8 first:pt-0 last:pb-0 items-start group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-brand-light flex items-center justify-center text-brand-strong group-hover:bg-brand-strong group-hover:text-white transition-colors duration-300">
                      {point.icon}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-brand-navy mb-2">{point.title}</h4>
                      <p className="text-text-secondary leading-relaxed">{point.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default WhyDheeksha;
