import React from 'react';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import Button from '../components/ui/Button';
import { Phone, MessageCircle, MapPin, Clock, Mail } from 'lucide-react';
import contactInfo from '../config/contactInfo';

const Contact = () => {
  useDocumentTitle('Contact Us');

  return (
    <div className="animate-fade-in">
      <section className="bg-brand-light py-16 md:py-24">
        <Container>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-brand-navy mb-6">
              Contact Us
            </h1>
            <p className="text-lg md:text-xl text-text-secondary">
              Have questions about vehicle insurance, renewals, or claim assistance? Contact Dheeksha Insurance for personal guidance and support.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="w-full lg:w-1/2 space-y-12">
              <div>
                <h2 className="text-3xl font-bold text-brand-navy mb-8">Get in Touch</h2>
                
                <div className="space-y-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <a href={contactInfo.phones[0].tel} className="w-full">
                      <Button variant="primary" className="w-full flex items-center justify-center gap-2">
                        <Phone size={20} />
                        Call Us
                      </Button>
                    </a>
                    <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="w-full">
                      <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white flex items-center justify-center gap-2 transition-colors rounded-xl px-6 py-3 font-semibold">
                        <MessageCircle size={20} />
                        Chat on WhatsApp
                      </Button>
                    </a>
                    <a href={contactInfo.email.mailto} className="w-full">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <Mail size={20} />
                        Send an Email
                      </Button>
                    </a>
                    <Link to="/get-in-touch" className="w-full">
                      <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                        <MessageCircle size={20} />
                        Enquiry Form
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-brand-navy mb-6">Contact Information</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong">
                      <Phone size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">Phone</h4>
                      {contactInfo.phones.map((phone, idx) => (
                        <p key={idx} className={idx === 0 ? "text-text-secondary mt-1" : "text-text-secondary"}>
                          <a href={phone.tel} className="hover:text-brand-strong transition-colors">{phone.display}</a>
                        </p>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">WhatsApp</h4>
                      <p className="text-text-secondary mt-1">
                        <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-brand-strong transition-colors">{contactInfo.whatsapp.display}</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong">
                      <Mail size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">Email</h4>
                      <p className="text-text-secondary mt-1">
                        <a href={contactInfo.email.mailto} className="hover:text-brand-strong transition-colors">{contactInfo.email.display}</a>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong">
                      <Clock size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">Business Hours</h4>
                      <p className="text-text-secondary mt-1">{contactInfo.workingDays}</p>
                      <p className="text-text-secondary">{contactInfo.workingHours}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-brand-light rounded-full flex items-center justify-center flex-shrink-0 text-brand-strong">
                      <MapPin size={24} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-brand-navy">Office Location</h4>
                      <p className="text-text-secondary mt-1 max-w-xs">{contactInfo.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2">
              <div className="w-full h-[500px] bg-brand-light rounded-3xl overflow-hidden shadow-premium flex items-center justify-center relative">
                <div className="absolute inset-0 bg-brand-navy/5"></div>
                <div className="text-center p-8 z-10">
                  <MapPin className="w-12 h-12 text-brand-strong mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-brand-navy mb-2">Peravurani, Thanjavur</h3>
                  <p className="text-text-secondary mb-6 max-w-sm mx-auto">
                    Visit our office for personalized insurance consultation and immediate claim assistance.
                  </p>
                  <a href={contactInfo.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline">Get Directions</Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Contact;
