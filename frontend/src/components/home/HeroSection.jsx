import React from 'react';
import Container from '../layout/Container';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';
import { Phone, ArrowRight } from 'lucide-react';
import heroVehicle from '../../assets/images/hero-vehicle.jpg';
import contactInfo from '../../config/contactInfo';

const HeroSection = () => {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-brand-light">
      <Container>
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-20">
          <div className="w-full md:w-1/2 z-10 animate-slide-up">
            <span className="inline-block py-1 px-3 rounded-full bg-brand-sky/20 text-brand-strong font-semibold text-sm mb-6 uppercase tracking-wider">
              VEHICLE INSURANCE & CLAIM ASSISTANCE
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-[56px] text-brand-navy font-bold leading-tight mb-6">
              Insurance That <br className="hidden lg:block" />
              Stays With <span className="text-brand-strong">You.</span>
            </h1>
            <p className="text-body text-text-secondary text-lg mb-4 max-w-lg">
              Vehicle insurance assistance with personal support from policy guidance to claim assistance.
            </p>
            <p className="text-sm text-text-secondary/80 font-medium mb-8 max-w-lg">
              Two-Wheelers • Private Vehicles • Commercial Vehicles • Heavy Vehicles
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/get-in-touch">
                <Button variant="primary" size="lg" className="gap-2">
                  Get in Touch <ArrowRight size={18} />
                </Button>
              </Link>
              <a href={contactInfo.phones[0].tel}>
                <Button variant="outline" size="lg" className="gap-2 bg-white hover:border-brand-sky hover:text-brand-navy">
                  <Phone size={18} /> Call Us
                </Button>
              </a>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 z-10 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-brand-sky rounded-3xl transform translate-x-4 translate-y-4 -z-10"></div>
              <img 
                src={heroVehicle} 
                alt="Dheeksha Insurance vehicle assistance" 
                className="w-full h-[300px] md:h-[400px] lg:h-[500px] object-cover rounded-3xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default HeroSection;
