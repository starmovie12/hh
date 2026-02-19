
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] pt-20 pb-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between gap-10">
          <div className="space-y-4 max-w-xs">
            <div className="text-2xl font-black tracking-tighter">
              <span className="text-white">M</span><span className="text-red-600">FLIX</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              Experience the best in entertainment with MFLIX. High quality movies, series, and anime streamed directly to your devices.
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm">Navigation</h4>
              <ul className="text-gray-500 text-xs space-y-2">
                <li><a href="#" className="hover:text-red-600 transition-colors">Home</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Movies</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">TV Series</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Latest</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm">Legal</h4>
              <ul className="text-gray-500 text-xs space-y-2">
                <li><a href="#" className="hover:text-red-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-white font-bold text-sm">Social</h4>
              <ul className="text-gray-500 text-xs space-y-2">
                <li><a href="#" className="hover:text-red-600 transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-red-600 transition-colors">Instagram</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-[10px] uppercase tracking-widest font-bold">
            © 2025 MFLIX. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};
