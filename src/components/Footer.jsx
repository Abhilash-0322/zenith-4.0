// src/components/Footer.jsx
import { Link } from 'react-router-dom';
import { Flower, Heart } from 'lucide-react';  // Changed from Lotus to Flower

const Footer = () => {
  return (
    <footer className="bg-white bg-opacity-80 backdrop-blur-sm py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <Flower className="h-6 w-6 text-indigo-600" />  {/* Changed from Lotus to Flower */}
            <span className="ml-2 text-lg font-semibold text-indigo-900">ZenHeaven</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-8 items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-indigo-600 mb-2 md:mb-0">Home</Link>
            <Link to="/about" className="hover:text-indigo-600 mb-2 md:mb-0">About Us</Link>
            <Link to="/contact" className="hover:text-indigo-600 mb-2 md:mb-0">Contact</Link>
            <Link to="/privacy" className="hover:text-indigo-600 mb-2 md:mb-0">Privacy Policy</Link>
          </div>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
          <p className="flex items-center justify-center">
            Made with <Heart className="h-4 w-4 text-red-500 mx-1" /> by Wind Breakers
          </p>
          <p className="mt-2">© {new Date().getFullYear()} ZenHeaven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;