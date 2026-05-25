import React from 'react';
// 1. Import the React Router tools
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { Bell, UserCircle, Sun } from 'lucide-react';
import myLogo from './assets/bfar-logo.png'; 
import AttendanceManagement from './AttendanceManagement';
import TravelOrder from './TravelOrder';
import OfficeSupply from './OfficeSupply';
import UserManagement from './UserManagement'; // 🔥 IMPORT ADDED HERE

// 2. We create an inner layout component so we can use "useLocation" to read the URL
function MainLayout() {
  // This hook grabs the exact current URL path (e.g., "/attendance")
  const location = useLocation();
  const currentPath = location.pathname;

  // 3. Helper logic to automatically change the sub-navigation title based on the URL
  let pageTitle = 'Dashboard';
  if (currentPath === '/attendance') pageTitle = 'Attendance Management';
  if (currentPath === '/travel') pageTitle = 'Travel Order';
  if (currentPath === '/supply') pageTitle = 'Office Supply';
  if (currentPath === '/users') pageTitle = 'User Management'; // 🔥 TITLE ADDED HERE

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans text-white">
      {/* Top Navigation Bar */}
      <nav className="bg-navBg px-4 py-3 flex items-center justify-between border-b border-slate-800">
        
        {/* Left Side: Logo and Navigation Links */}
        <div className="flex items-center space-x-6">
          {/* Clicking the logo takes you home via Link */}
          <Link to="/home" className="flex items-center space-x-2 cursor-pointer">
            <img src={myLogo} alt="BFAR Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg tracking-wider">BFAR RO2</span>
          </Link>

          {/* Links Section */}
          <div className="hidden md:flex space-x-4 text-sm font-medium text-gray-300">
            <Link 
              to="/home"
              className={`hover:text-white transition-colors pb-1 ${currentPath === '/home' ? 'text-white font-semibold border-b-2 border-blue-500' : ''}`}
            >
              Home
            </Link>

            <Link 
              to="/attendance"
              className={`hover:text-white transition-colors pb-1 ${currentPath === '/attendance' ? 'text-white font-semibold border-b-2 border-blue-500' : ''}`}
            >  
              Attendance Management
            </Link>

            <Link 
              to="/travel"
              className={`hover:text-white transition-colors pb-1 ${currentPath === '/travel' ? 'text-white font-semibold border-b-2 border-blue-500' : ''}`}
            >
              Travel Order
            </Link>

            <Link
              to="/supply"
              className={`hover:text-white transition-colors pb-1 ${currentPath === '/supply' ? 'text-white font-semibold border-b-2 border-blue-500' : ''}`}
            >
              Office Supply
            </Link>

            {/* 🔥 LINK REPLACED BUTTON HERE */}
            <Link
              to="/users"
              className={`hover:text-white transition-colors pb-1 ${currentPath === '/users' ? 'text-white font-semibold border-b-2 border-blue-500' : ''}`}
            >
              User Management
            </Link>
          </div>
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center space-x-4">
          <button className="text-gray-300 hover:text-white transition-colors"><Bell className="h-5 w-5" /></button>
          <button className="text-gray-300 hover:text-white transition-colors"><UserCircle className="h-6 w-6" /></button>
          <button className="text-gray-300 hover:text-white transition-colors"><Sun className="h-5 w-5" /></button>
        </div>
      </nav>

      {/* Sub Navigation / Page Title */}
      <div className="bg-subNavBg px-4 py-1.5 shadow-md z-10 relative">
        <h1 className="text-sm font-semibold text-white">
          {pageTitle}
        </h1>
      </div>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-row overflow-hidden">
        
        {/* Routes swap the page content dynamically based on the URL */}
        <Routes>
          {/* If they just go to localhost:5173/, instantly redirect them to /home */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          
          <Route path="/home" element={
            <div className="p-6 w-full flex items-center justify-center">
              <p className="text-gray-500 text-lg">Welcome to the Dashboard. Click a tab above to navigate.</p>
            </div>
          } />
          
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/travel" element={<TravelOrder />} />
          <Route path="/supply" element={<OfficeSupply />} />
          <Route path="/users" element={<UserManagement />} /> {/* 🔥 ROUTE ADDED HERE */}
        </Routes>

      </main>
    </div>
  );
}

// 5. Wrap the entire app inside BrowserRouter so routing works!
export default function App() {
  return (
    <BrowserRouter>
      <MainLayout />
    </BrowserRouter>
  );
}