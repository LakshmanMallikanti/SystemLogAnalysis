import React from 'react';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-3xl"></div>
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default Layout; 