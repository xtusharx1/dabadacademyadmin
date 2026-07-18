import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FiHome, FiFileText, FiBook, FiUsers, FiSettings,
  FiChevronDown, FiChevronRight, FiVideo, FiCalendar,
  FiGrid, FiLogOut, FiUserPlus, FiFile,
  FiMessageCircle, FiEdit, FiAward,
  FiBarChart, FiClipboard, FiClock, FiUserCheck, FiMap, FiGift
} from 'react-icons/fi';

const Sidebar = ({ role }) => {
  const [openCategories, setOpenCategories] = useState({ Dashboard: true });
  const location = useLocation();
  const userName = localStorage.getItem('name') || 'User';
  const [userRole, setUserRole] = useState(role);

  // Normalize role on component mount
  useEffect(() => {
    // Log the current role for debugging
    console.log('Current role from props:', role);
    
    // Normalize the role to handle spelling variations
    if (role) {
      const normalizedRole = role.toLowerCase();
      if (normalizedRole === 'counselor' || normalizedRole === 'counsellor') {
        setUserRole('counselor');
      } else if (normalizedRole === 'admin') {
        setUserRole('admin');
      } else if (normalizedRole === 'teacher') {
        setUserRole('teacher');
      } else {
        // If role is not recognized, don't set a default
        console.warn(`Unknown role: ${role}`);
        setUserRole(null);
      }
    }
  }, [role]);

  const toggleCategory = (category) => {
    setOpenCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const performLogout = () => {
    console.log('Performing logout from sidebar');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const routesByRole = {
    admin: [
      {
        category: 'Dashboard',
        links: [{ path: '/', name: 'Dashboard', icon: <FiHome className="text-xl" /> }],
      },
      {
        category: 'Performance',
        links: [
          { path: '/test-records', name: 'Test Records', icon: <FiFileText className="text-xl" /> },
          { path: '/class-performance', name: 'Class Performance', icon: <FiBarChart className="text-xl" /> },
          { path: '/student-performance', name: 'Student Performance', icon: <FiUsers className="text-xl" /> },
        ],
      },
      {
        category: 'Finance',
        links: [
          { path: '/fee-records', name: 'Fee Records', icon: <FiClipboard className="text-xl" /> },
          { path: '/fee-reminders', name: 'Fee Reminders', icon: <FiClock className="text-xl" /> },
        ],
      },
      {
        category: 'Management',
        links: [
          { path: '/notice', name: 'Notice', icon: <FiClipboard className="text-xl" /> },
          { path: '/attendance', name: 'Attendance', icon: <FiCalendar className="text-xl" /> },
          { path: '/view-attendance', name: 'View Attendance', icon: <FiCalendar className="text-xl" /> },
          { path: '/birthdays', name: 'Birthdays', icon: <FiGift className="text-xl" /> },
        ],
      },
      {
        category: 'Reports',
        links: [
          { path: '/class-records', name: 'Classwork Records', icon: <FiBook className="text-xl" /> },
          { path: '/teacher-reports', name: 'Teacher Reports', icon: <FiUserCheck className="text-xl" /> },
        ],
      },
      {
        category: 'Administration',
        links: [
          { path: '/students', name: 'Students', icon: <FiUsers className="text-xl" /> },
          { path: '/course', name: 'Course', icon: <FiBook className="text-xl" /> },
          { path: '/user-roles', name: 'User Roles', icon: <FiSettings className="text-xl" /> },
          { path: '/school-map', name: 'School Map', icon: <FiMap className="text-xl" /> },
        ],
      },
    ],
    teacher: [
      {
        category: 'Dashboard',
        links: [{ path: '/', name: 'Dashboard', icon: <FiHome className="text-xl" /> }],
      },
      {
        category: 'Performance',
        links: [
          { path: '/test-records', name: 'Test Records', icon: <FiFileText className="text-xl" /> },
          { path: '/class-performance', name: 'Class Performance', icon: <FiBarChart className="text-xl" /> },
          { path: '/student-performance', name: 'Student Performance', icon: <FiUsers className="text-xl" /> },
        ],
      },
      {
        category: 'Management',
        links: [
          { path: '/attendance', name: 'Attendance', icon: <FiClipboard className="text-xl" /> },
          { path: '/view-attendance', name: 'View Attendance', icon: <FiCalendar className="text-xl" /> },
        ],
      },
      {
        category: 'Reports',
        links: [
          { path: '/class-records', name: 'Classwork Records', icon: <FiBook className="text-xl" /> },
        ],
      },
    ],
    counselor: [
      {
        category: 'Dashboard',
        links: [{ path: '/', name: 'Dashboard', icon: <FiHome className="text-xl" /> }],
      },
      {
        category: 'Performance',
        links: [
          { path: '/test-records', name: 'Test Records', icon: <FiFileText className="text-xl" /> },
          { path: '/class-performance', name: 'Class Performance', icon: <FiBarChart className="text-xl" /> },
          { path: '/student-performance', name: 'Student Performance', icon: <FiUsers className="text-xl" /> },
        ],
      },
      {
        category: 'Finance',
        links: [
          { path: '/fee-records', name: 'Fee Records', icon: <FiClipboard className="text-xl" /> },
          { path: '/fee-reminders', name: 'Fee Reminders', icon: <FiClock className="text-xl" /> },
        ],
      },
      {
        category: 'Management',
        links: [
          { path: '/notice', name: 'Notice', icon: <FiClipboard className="text-xl" /> },
          { path: '/view-attendance', name: 'View Attendance', icon: <FiCalendar className="text-xl" /> },
          { path: '/students', name: 'Students', icon: <FiUsers className="text-xl" /> },
          { path: '/birthdays', name: 'Birthdays', icon: <FiGift className="text-xl" /> },
        ],
      },
    ],
  };

  // Get routes based on role without defaulting to admin
  const getRoutesForRole = () => {
    if (!userRole) {
      return []; // Return empty array if role is not recognized
    }
    return routesByRole[userRole] || [];
  };
  
  const routes = getRoutesForRole();
  const isActive = (path) => location.pathname === path;

  // If no valid role is found, render a simple error message
  if (!routes.length) {
    return (
      <div className="w-72 fixed h-full bg-gradient-to-b from-blue-600 to-blue-400 text-white shadow-xl z-50">
        <div className="h-full flex flex-col">
          <div className="py-3 px-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border border-blue-300">
                <span className="text-white font-bold text-xl">DA</span>
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-bold text-white m-0">Dabad Academy</h2>
              </div>
            </div>
          </div>
          <div className="border-b border-blue-500"></div>
          <div className="flex-grow flex items-center justify-center">
            <div className="text-center px-4">
              <h3 className="text-xl mb-4">Invalid User Role</h3>
              <p>You don't have a valid role assigned. Please contact an administrator.</p>
              <button
                type="button"
                onClick={performLogout}
                className="mt-6 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 cursor-pointer"
              >
                <FiLogOut className="inline mr-2" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 fixed h-full bg-gradient-to-b from-blue-600 to-blue-400 text-white shadow-xl z-50">
      <div className="h-full flex flex-col">
        <div className="py-3 px-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border border-blue-300">
              <span className="text-white font-bold text-xl">DA</span>
            </div>
            <div className="ml-3">
              <h2 className="text-lg font-bold text-white m-0">Dabad Academy</h2>
            </div>
          </div>
        </div>

        <div className="border-b border-blue-500"></div>

        <div className="px-6 py-5 border-b border-blue-500">
          <h3 className="text-white text-base font-medium">{userName}</h3>
          <p className="text-blue-200 text-sm">
            {userRole === 'admin' ? 'Administrator' : userRole === 'teacher' ? 'Teacher' : 'Counselor'}
          </p>
        </div>

        <div className="flex-grow overflow-auto py-4 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-transparent">
          {routes.map((category) => (
            <div key={category.category} className="mb-3 px-4">
              <div
                className="flex items-center justify-between p-4 text-white hover:bg-blue-700 transition-all duration-200 rounded-lg cursor-pointer"
                onClick={() => toggleCategory(category.category)}
              >
                <div className="flex items-center">
                  <span className="text-xl mr-4">{category.icon}</span>
                  <span className="text-lg font-medium">{category.category}</span>
                </div>
                <span className="text-sm text-blue-100">
                  {openCategories[category.category] ? <FiChevronDown /> : <FiChevronRight />}
                </span>
              </div>
              {openCategories[category.category] && (
                <div className="ml-8 mt-3 space-y-2">
                  {category.links.map((route) => (
                    <Link
                      key={route.path}
                      to={route.path}
                      className={`flex items-center py-3 px-4 text-lg rounded-lg transition-all duration-200 ${
                        isActive(route.path)
                          ? 'bg-blue-700 text-white font-medium shadow-md'
                          : 'text-blue-100 hover:bg-blue-700 hover:text-white'
                      }`}
                    >
                      <div className={`mr-4 text-xl ${isActive(route.path) ? 'text-white' : 'text-blue-200'}`}>
                        {route.icon}
                      </div>
                      <span>{route.name}</span>
                      {isActive(route.path) && (
                        <div className="w-2 h-2 rounded-full bg-white ml-auto"></div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-auto px-6 py-6 border-t border-blue-500">
          <button
            type="button"
            onClick={performLogout}
            className="flex items-center justify-center w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all duration-200 cursor-pointer"
          >
            <FiLogOut className="mr-4" />
            <span className="font-medium text-xl">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;