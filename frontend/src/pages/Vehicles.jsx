import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { CheckCircle, ArrowRight } from 'lucide-react';
import heroVehicle from '../assets/images/hero-vehicle.jpg';
import contactInfo from '../config/contactInfo';

const Vehicles = () => {
  useDocumentTitle('Dheeksha Insurance | Vehicle Insurance Assistance');

  const categories = [
    {
      id: 'two-wheeler',
      title: 'Two-Wheeler',
      description: 'Insurance assistance for bikes and scooters used for everyday travel.',
      image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'private-vehicle',
      title: 'Private Vehicle',
      description: 'Guidance for personal cars and other private vehicles.',
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'commercial-vehicle',
      title: 'Commercial Vehicle',
      description: 'Insurance assistance for vehicles used for commercial purposes.',
      image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 'heavy-vehicle',
      title: 'Heavy Vehicle',
      description: 'Support for trucks, lorries and other heavy road vehicles.',
      image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    }
  ];

  const supportPoints = [
    "Insurance Guidance",
    "Renewal Assistance",
    "Documentation Support",
    "Claim Assistance"
  ];

  return (
    <div className="animate-fade-in bg-white dark:bg-brand-darkBg transition-colors duration-300">
      {/* Hero Section */}
      <section className="bg-brand-navy dark:bg-[#07101B] pt-16 pb-16 md:pt-24 md:pb-24 text-white transition-colors duration-300">
        <Container>
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="w-full lg:w-[45%]">
              <span className="inline-block py-1 px-3 rounded-full bg-brand-sky/20 text-brand-sky text-sm font-semibold tracking-wider mb-6">
                VEHICLE INSURANCE
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white leading-tight">
                Coverage Support for Every Road
              </h1>
              <p className="text-lg md:text-xl text-brand-light opacity-90 leading-relaxed max-w-lg mb-8">
                From everyday two-wheelers to commercial and heavy vehicles, Dheeksha Insurance helps customers with vehicle insurance assistance and guidance.
              </p>
              <Link to="/contact">
                <Button variant="primary" className="flex items-center gap-2 group w-fit">
                  Get in Touch
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            
            <div className="w-full lg:w-[55%]">
              <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src={heroVehicle} 
                  alt="Dheeksha Insurance vehicle assistance" 
                  className="w-full h-[350px] md:h-[450px] lg:h-[500px] object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Vehicle Categories */}
      <section className="py-20 md:py-28 bg-brand-light dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="space-y-20 md:space-y-32">
            {categories.map((category, index) => (
              <div key={category.id} className={`flex flex-col md:flex-row gap-10 md:gap-16 items-center ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className="w-full md:w-1/2">
                  <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl aspect-[4/3] group">
                    <img 
                      src={category.image} 
                      alt={category.title} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/60 to-transparent opacity-60"></div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <div className="w-12 h-1 bg-brand-sky mb-6 rounded-full"></div>
                  <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-5">
                    {category.title}
                  </h2>
                  <p className="text-text-secondary dark:text-text-darkSecondary text-lg leading-relaxed mb-8 max-w-lg">
                    {category.description}
                  </p>
                  <div>
                    <Link to="/contact">
                      <Button variant="primary" className="flex items-center gap-2 group">
                        Get in Touch
                        <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Support Section */}
      <section className="py-20 md:py-28 bg-white dark:bg-brand-darkBg transition-colors duration-300">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-5/12">
              <h2 className="text-3xl md:text-4xl font-bold text-brand-navy dark:text-text-darkPrimary mb-6">
                More Than Just a Policy
              </h2>
              <p className="text-lg text-text-secondary dark:text-text-darkSecondary leading-relaxed mb-8">
                Understanding the process is just as important as choosing insurance. Dheeksha Insurance provides personal guidance when customers need assistance.
              </p>
            </div>
            
            <div className="w-full lg:w-7/12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {supportPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-4 p-6 rounded-2xl bg-brand-light dark:bg-brand-darkSurface border border-ui-border dark:border-brand-darkBorder hover:shadow-md transition-shadow">
                    <CheckCircle className="text-brand-strong dark:text-brand-sky w-6 h-6 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-xl font-semibold text-brand-navy dark:text-text-darkPrimary">{point}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-brand-navy dark:bg-[#07101B] text-white text-center transition-colors duration-300">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Help With Your Vehicle Insurance?</h2>
            <p className="text-base md:text-lg text-brand-light mb-10 opacity-90 leading-relaxed">
              Tell us what you need and get in touch with Dheeksha Insurance.
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
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Vehicles;
