import React from 'react';
import { Link } from 'react-router-dom';
import Container from './Container';
import { Logo } from '../ui/Logo';
import contactInfo from '../../config/contactInfo';

const Footer = () => {
  return (
    <footer className="bg-brand-navy text-white pt-16 pb-8">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-6 bg-white inline-block px-4 py-2 rounded-xl shadow-sm">
              <Logo />
            </div>
            <p className="text-brand-light font-medium text-lg mb-2">
              Vehicle Insurance & Claim Assistance
            </p>
            <p className="text-brand-light opacity-80 max-w-sm mb-6">
              Your trusted partner for vehicle insurance and end-to-end claim assistance in Peravurani.
            </p>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-sky">Navigation</h4>
            <ul className="space-y-2 text-brand-light opacity-80">
              <li><Link to="/" className="hover:text-white hover:underline transition-all">Home</Link></li>
              <li><Link to="/services" className="hover:text-white hover:underline transition-all">Services</Link></li>
              <li><Link to="/vehicles" className="hover:text-white hover:underline transition-all">Vehicles</Link></li>
              <li><Link to="/about" className="hover:text-white hover:underline transition-all">About Us</Link></li>
              <li><Link to="/claim-assistance" className="hover:text-white hover:underline transition-all">Claim Assistance</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-brand-sky">Contact</h4>
            <ul className="space-y-3 text-brand-light opacity-80">
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">Location:</span> 
                <span>{contactInfo.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">Phone:</span> 
                <div className="flex flex-col">
                  {contactInfo.phones.map((phone, idx) => (
                    <a key={idx} href={phone.tel} className="hover:text-white transition-colors">{phone.display}</a>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">WhatsApp:</span> 
                <a href={contactInfo.whatsapp.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{contactInfo.whatsapp.display}</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-medium text-brand-sky">Email:</span> 
                <a href={contactInfo.email.mailto} className="hover:text-white transition-colors break-all">{contactInfo.email.display}</a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white border-opacity-10 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-brand-light opacity-60">
          <p>&copy; {new Date().getFullYear()} Dheeksha Insurance. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
