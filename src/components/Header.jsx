import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Globe, Share2 } from 'lucide-react';

export default function Header({ activeCategory, setActiveCategory, onOpenCart }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'all', label: 'Trang Chủ' },
    { id: 'fruits', label: 'Trái Cây Tươi' },
    { id: 'agriculture', label: 'Nông Sản Sạch' },
    { id: 'seafood', label: 'Hải Sản Cao Cấp' },
  ];

  return (
    <header 
      className={`fixed top-0 w-full z-40 transition-all duration-300 ${
        isScrolled 
          ? 'py-3 shadow-md bg-white/90 backdrop-blur-xl border-b border-outline-variant/20' 
          : 'py-5 bg-white/70 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <nav className="flex justify-between items-center max-w-container-max mx-auto px-6">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveCategory('all')}
          className="font-display-lg text-2xl font-extrabold text-primary cursor-pointer tracking-tight transition-transform active:scale-95 duration-150"
        >
          Nông Hải Sản 360
        </div>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <li key={link.id}>
              <button
                onClick={() => {
                  setActiveCategory(link.id);
                  // Scroll to product grid or top
                  if (link.id !== 'all') {
                    document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className={`font-label-md text-sm font-semibold tracking-wide transition-all pb-1 hover:text-primary ${
                  activeCategory === link.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Icons Area */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onOpenCart}
            className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all active:scale-90 duration-150 relative"
          >
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-secondary rounded-full"></span>
          </button>
          
          <button className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all active:scale-90 duration-150">
            <User className="w-6 h-6" />
          </button>

          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-full transition-all"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-outline-variant/20 shadow-lg py-4 px-6 animate-fade-in">
          <ul className="space-y-4">
            {navLinks.map((link) => (
              <li key={link.id}>
                <button
                  onClick={() => {
                    setActiveCategory(link.id);
                    setMobileMenuOpen(false);
                    if (link.id !== 'all') {
                      document.getElementById('products-section')?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={`block w-full text-left font-label-md py-2 px-3 rounded-lg text-base font-semibold transition-all ${
                    activeCategory === link.id
                      ? 'text-primary bg-primary/5'
                      : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {link.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
