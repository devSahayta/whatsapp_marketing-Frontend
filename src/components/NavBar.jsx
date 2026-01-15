// import React, { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { Menu, X, Calendar, LogOut, User, Plus, Coins } from 'lucide-react';
// import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
// import { useUserCredits } from '../hooks/useUserCredits';
// import '../styles/navbar.css';

// const NavBar = () => {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const location = useLocation();

//   const { login, register, logout, isAuthenticated, user } = useKindeAuth();

//   const username = user?.email ? user.email.split('@')[0] : '';
//   const { credits, loading, refetchCredits } = useUserCredits(user?.id, isAuthenticated);

//   const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
//   const isActive = (path) => location.pathname === path;

//   const handleLogout = () => {
//     logout();
//     setIsMenuOpen(false);
//   };

//   // ✨ Credit badge color based on remaining credits
//   const getCreditBadgeClass = () => {
//     if (loading) return 'bg-gray-100 text-gray-500';
//     if (credits === null) return 'bg-gray-100 text-gray-500';
//     if (credits <= 5) return 'bg-red-100 text-red-700';
//     if (credits <= 20) return 'bg-yellow-100 text-yellow-700';
//     return 'bg-green-100 text-green-700';
//   };

//   return (
//     <nav className="navbar">
//       <div className="nav-container">
//         <div className="nav-logo">
//           <Calendar className="nav-logo-icon" />
//           <span>RSVP AI</span>
//         </div>

//         {/* ✅ Desktop Navigation */}
//         <div className="nav-links-desktop">
//           {isAuthenticated ? (
//             <>
//               <Link
//                 to="/events"
//                 className={`nav-link ${isActive('/events') ? 'active' : ''}`}
//               >
//                 <Calendar size={18} />
//                 Events
//               </Link>

//               <Link
//                 to="/createEvent"
//                 className={`nav-link ${isActive('/createEvent') ? 'active' : ''}`}
//               >
//                 <Plus size={16} className="mr-1" />
//                 Create Event
//               </Link>

//               {/* ✨ Credit Badge (Always Visible on Desktop) */}
//               <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${getCreditBadgeClass()}`}>
//                 <Coins size={16} />
//                 <span>{loading ? '...' : credits ?? 0}</span>
//               </div>

//               <div className="relative">
//                 <button
//                   className="nav-username"
//                   onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                 >
//                   <User size={18} className="user-icon" /> {username}
//                 </button>

//                 {isDropdownOpen && (
//                   <div className="absolute right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg w-56 text-sm z-50">
//                     {/* User Info Section */}
//                     <div className="px-4 py-3 border-b bg-gray-50">
//                       <p className="font-semibold text-gray-800">{username}</p>
//                       <p className="text-xs text-gray-500">{user?.email}</p>
//                     </div>

//                     {/* Credits Section with Refresh */}
//                     <div className="px-4 py-3 border-b">
//                       <div className="flex items-center justify-between">
//                         <div className="flex items-center gap-2">
//                           <Coins size={16} className="text-yellow-600" />
//                           <span className="font-medium text-gray-700">Credits</span>
//                         </div>
//                         <div className="flex items-center gap-2">
//                           <span className={`px-2 py-1 rounded-full text-sm font-bold ${getCreditBadgeClass()}`}>
//                             {loading ? 'Loading...' : credits ?? 0}
//                           </span>
//                           <button
//                             onClick={refetchCredits}
//                             className="text-xs text-blue-600 hover:text-blue-800"
//                             title="Refresh credits"
//                           >
//                             🔄
//                           </button>
//                         </div>
//                       </div>

//                       {/* Low Credit Warning */}
//                       {credits !== null && credits <= 10 && (
//                         <div className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
//                           ⚠️ Low credits! Consider topping up.
//                         </div>
//                       )}
//                     </div>

//                     {/* Logout Button */}
//                     <button
//                       onClick={logout}
//                       className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
//                     >
//                       <LogOut size={14} className="inline mr-2" />
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             </>
//           ) : (
//             <>
//               <button className="auth-button" onClick={() => login()}>
//                 Login
//               </button>
//               <button className="auth-button" onClick={() => register()}>
//                 Sign Up
//               </button>
//             </>
//           )}
//         </div>

//         {/* ✅ Mobile Menu Toggle */}
//         <button className="mobile-menu-toggle" onClick={toggleMenu}>
//           {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
//         </button>
//       </div>

//       {/* ✅ Mobile Navigation */}
//       {isMenuOpen && (
//         <div className="nav-links-mobile open">
//           {isAuthenticated ? (
//             <>
//               <Link
//                 to="/events"
//                 onClick={() => setIsMenuOpen(false)}
//                 className={`nav-link ${isActive('/events') ? 'active' : ''}`}
//               >
//                 <Calendar size={18} />
//                 Events
//               </Link>

//               <Link
//                 to="/createEvent"
//                 onClick={() => setIsMenuOpen(false)}
//                 className={`nav-link ${isActive('/createEvent') ? 'active' : ''}`}
//               >
//                 <Plus size={16} className="mr-1" />
//                 Create Event
//               </Link>

//               {/* Mobile User Info Card */}
//               <div className="border-t pt-3 mt-2">
//                 <div className="flex items-center justify-between px-4 py-2">
//                   <div className="flex items-center gap-2">
//                     <User size={18} className="text-gray-600" />
//                     <span className="font-medium text-gray-800">{username}</span>
//                   </div>
//                 </div>

//                 {/* Mobile Credits Display */}
//                 <div className="px-4 py-2 flex items-center justify-between bg-gray-50 rounded-lg mx-2 my-2">
//                   <div className="flex items-center gap-2">
//                     <Coins size={16} className="text-yellow-600" />
//                     <span className="text-sm text-gray-700">Credits</span>
//                   </div>
//                   <span className={`px-3 py-1 rounded-full text-sm font-bold ${getCreditBadgeClass()}`}>
//                     {loading ? '...' : credits ?? 0}
//                   </span>
//                 </div>

//                 {credits !== null && credits <= 10 && (
//                   <div className="mx-4 mb-2 text-xs text-orange-600 bg-orange-50 px-2 py-1.5 rounded">
//                     ⚠️ Low credits remaining
//                   </div>
//                 )}
//               </div>

//               <button onClick={handleLogout} className="auth-button mt-2">
//                 <LogOut size={14} className="inline mr-2" />
//                 Logout
//               </button>
//             </>
//           ) : (
//             <>
//               <button className="auth-button" onClick={() => login()}>
//                 Login
//               </button>
//               <button className="auth-button" onClick={() => register()}>
//                 Sign Up
//               </button>
//             </>
//           )}
//         </div>
//       )}
//     </nav>
//   );
// };

// export default NavBar;

// -------------------------------------- updated ----------------------------------------------------
// src/components/NavBar.jsx
import React, { useState } from "react";
import { User, LogOut, Coins, Calendar, Menu as MenuIcon } from "lucide-react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-react";
import { useUserCredits } from "../hooks/useUserCredits";
import { useNavigate } from "react-router-dom";
import "../styles/navbar.css";

const NavBar = ({ onToggleSidebar, isSidebarOpen }) => {
  const navigate = useNavigate();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { login, register, logout, isAuthenticated, user } = useKindeAuth();
  const username = user?.email ? user.email.split("@")[0] : "";

  const { credits, loading, refetchCredits } = useUserCredits(
    user?.id,
    isAuthenticated
  );

  const getCreditBadgeClass = () => {
    if (loading) return "credit-badge gray";
    if (credits <= 5) return "credit-badge red";
    if (credits <= 20) return "credit-badge yellow";
    return "credit-badge green";
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        {/* Show hamburger only when authenticated */}
        {isAuthenticated && (
          <button
            className="hamburger-btn"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={isSidebarOpen}
          >
            <MenuIcon size={20} />
          </button>
        )}

        <div className="nav-logo" aria-hidden>
          <Calendar className="nav-logo-icon" />
          <span>RSVP AI</span>
        </div>
      </div>

      <div className="nav-right">
        {/* Credits visible in navbar (left of profile) */}
        {isAuthenticated && (
          <div className="credits-inline" title="Your credits">
            <Coins size={16} />
            <span className={getCreditBadgeClass()}>
              {loading ? "..." : credits ?? 0}
            </span>
            <button
              className="refresh-small"
              onClick={refetchCredits}
              title="Refresh credits"
            >
              🔄
            </button>
          </div>
        )}

        {isAuthenticated ? (
          <div className="profile-wrapper">
            <button
              className="nav-username"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <User size={18} className="user-icon" /> {username}
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <p className="name">{username}</p>
                  <p className="email">{user?.email}</p>
                </div>

                <div className="dropdown-item">
                  <div className="left">
                    <Coins size={16} className="coin" />
                    <span>Credits</span>
                  </div>
                  <div className="right">
                    <span className={getCreditBadgeClass()}>
                      {loading ? "..." : credits ?? 0}
                    </span>
                    <button
                      onClick={refetchCredits}
                      className="refresh-btn"
                      title="Refresh credits"
                    >
                      🔄
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/whatsapp-account")}
                  className=" w-full block text-left border-b-gray-100 border-b py-2 px-3 "
                >
                  Whatsapp Account
                </button>

                <button onClick={logout} className="dropdown-logout">
                  <LogOut size={14} className="inline mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-actions">
            <button className="auth-button" onClick={login}>
              Login
            </button>
            <button className="auth-button" onClick={register}>
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
