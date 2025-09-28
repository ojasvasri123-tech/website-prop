import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white p-1">
                <img 
                  src="/lighthouse-logo.svg" 
                  alt="The Beacon Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-heading font-bold">The Beacon</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Empowering schools and colleges with comprehensive disaster preparedness education. 
              Learn, prepare, and stay safe with interactive learning modules, real-time alerts, 
              and community support.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-300 hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">support@beacon.edu</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-300">+91 12345 67890</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span className="text-gray-300">
                  123 Education Street<br />
                  New Delhi, India 110001
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Emergency Information */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-6">
            <h4 className="text-red-300 font-semibold mb-2">Emergency Contacts</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-red-300 font-medium">Fire:</span>
                <span className="text-gray-300 ml-2">101</span>
              </div>
              <div>
                <span className="text-red-300 font-medium">Police:</span>
                <span className="text-gray-300 ml-2">112</span>
              </div>
              <div>
                <span className="text-red-300 font-medium">Medical:</span>
                <span className="text-gray-300 ml-2">108</span>
              </div>
              <div>
                <span className="text-red-300 font-medium">Disaster:</span>
                <span className="text-gray-300 ml-2">1078</span>
              </div>
              <div>
                <span className="text-red-300 font-medium">Women:</span>
                <span className="text-gray-300 ml-2">1091</span>
              </div>
              <div>
                <span className="text-red-300 font-medium">Child:</span>
                <span className="text-gray-300 ml-2">1098</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} The Beacon. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2 sm:mt-0">
            Built with ❤️ for safer communities
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
