import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = ({ darkMode, setDarkMode }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-6 mt-16 min-h-screen overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;