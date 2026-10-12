import React from 'react';
import Container from '../layout/Container';
import SectionHeading from '../ui/SectionHeading';
import { MapPin, Clock, Phone, Mail } from 'lucide-react';
import contactInfo from '../../config/contactInfo';

const LocationSection = () => {
  return (
    <section className="py-20 bg-brand-light/50 border-t border-ui-border">
      <Container>
        <SectionHeading 
          title="Visit Our Office" 
          subtitle="Location & Hours" 
          centered={true} 
        />
        
        <div className="flex flex-col lg:flex-row gap-12 mt-12 bg-white rounded-3xl overflow-hidden shadow-sm border border-ui-border p-2">
          
          {/* Map Placeholder */}
          <div className="w-full lg:w-7/12 h-80 lg:h-auto min-h-[400px] bg-slate-100 rounded-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-brand-navy/5 flex flex-col items-center justify-center transition-all duration-300 group-hover:bg-brand-navy/10">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4 text-brand-strong">
                <MapPin size={32} />
              </div>
              <h4 className="font-bold text-brand-navy text-lg">{contactInfo.businessName}</h4>
              <p className="text-text-secondary text-sm max-w-[80%] text-center">{contactInfo.address}</p>
              <p className="text-xs text-brand-strong mt-2 font-medium bg-white px-3 py-1 rounded-full border border-brand-sky/30">
                Interactive Map Placeholder
              </p>
            </div>
          </div>
          
          {/* Contact Details */}
          <div className="w-full lg:w-5/12 p-8 lg:p-12 flex flex-col justify-center">
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-brand-navy mb-2">{contactInfo.businessName}</h3>
              <p className="text-text-secondary">Vehicle Insurance & Claim Assistance</p>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 text-brand-strong mt-1">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy mb-1">Office Address</h4>
                  <p className="text-text-secondary">{contactInfo.address}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 text-brand-strong mt-1">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy mb-1">Contact</h4>
                  {contactInfo.phones.map((phone, idx) => (
                    <p key={idx} className={idx === 0 ? "text-text-secondary mb-1" : "text-text-secondary"}>
                      Mobile: <a href={phone.tel} className="hover:text-brand-strong transition-colors">{phone.display}</a>
                    </p>
                  ))}
                  <p className="text-text-secondary"><a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-strong transition-colors">WhatsApp Available</a></p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center flex-shrink-0 text-brand-strong mt-1">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-navy mb-1">Business Hours</h4>
                  <p className="text-text-secondary">{contactInfo.workingDays}: {contactInfo.workingHours}<br />Sunday: Closed</p>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </Container>
    </section>
  );
};

export default LocationSection;
