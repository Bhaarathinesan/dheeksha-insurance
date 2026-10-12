import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone } from 'lucide-react';
import Container from './Container';
import Button from '../ui/Button';
import { Logo } from '../ui/Logo';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Home', href: '/' },
    { name: 'Services', href: '/services' },
    { name: 'Vehicles', href: '/vehicles' },
    { name: 'About Us', href: '/about' },
    { name: 'Claim Assistance', href: '/claim-assistance' },
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return location.pathname === path;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-ui-border shadow-sm transition-all duration-300">
      <Container>
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="flex space-x-6">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`font-medium transition-colors ${isActive(link.href) ? 'text-brand-strong' : 'text-text-secondary hover:text-brand-strong'}`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/contact">
                <Button variant="primary" className="flex items-center gap-2">
                  <Phone size={18} />
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-navy hover:text-brand-strong focus:outline-none"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-ui-border animate-fade-in">
          <div className="px-4 pt-2 pb-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsOpen(false)}
                className={`block px-3 py-3 text-base font-medium rounded-md ${isActive(link.href) ? 'text-brand-strong bg-brand-light' : 'text-text-secondary hover:text-brand-strong hover:bg-brand-light'}`}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-4 px-3">
              <Link to="/contact" onClick={() => setIsOpen(false)}>
                <Button variant="primary" className="w-full flex justify-center items-center gap-2">
                  <Phone size={18} />
                  Get in Touch
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
