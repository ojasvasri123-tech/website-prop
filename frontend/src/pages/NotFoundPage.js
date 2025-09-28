import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      <div className="text-center">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white p-2">
            <img 
              src="/lighthouse-logo.svg" 
              alt="The Beacon Logo" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl md:text-8xl font-bold text-gray-300 mb-4">
          404
        </h1>
        
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-4">
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Sorry, we couldn't find the page you're looking for. 
          The page might have been moved, deleted, or you entered the wrong URL.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="btn-outline flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
          
          <Link
            to="/"
            className="btn-primary flex items-center justify-center"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-12 text-sm text-gray-500">
          <p>Need help? <Link to="/contact" className="text-primary-600 hover:text-primary-700">Contact us</Link></p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
