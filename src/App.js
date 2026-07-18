import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';
import { useStateContext } from './contexts/ContextProvider';

import {Footer, Sidebar, ThemeSettings } from './components';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import FeeRecords from './pages/FeeRecords';
import FeeReminders from './pages/FeeReminders';
import Course from './pages/Course';
import TestRecords from './pages/TestRecords';
import StudentMarks from './pages/StudentMarks';
import StudentPerformance from './pages/StudentPerformance';
import ClassPerformance from './pages/ClassPerformance';
import UserRoles from './pages/UserRoles';
import UserList from './pages/UserList';
import Login from './pages/Login';
import Attendance from './pages/Attendance';
import ViewAttendance from './pages/ViewAttendance';
import SchoolMap from './pages/SchoolMap';
import ClassRecords from './pages/ClassRecord';
import TeacherReports from './pages/TeacherReports';
import Notice from './pages/Notice';
import Birthdays from './pages/Birthdays';
import ProfileView from './pages/StudentProfileView'; // Add this import
import path from 'path-browserify';

const App = () => {
  const {
    activeMenu,
    themeSettings,
    setThemeSettings,
    currentColor,
    currentMode,
  } = useStateContext();

  const [userRole, setUserRole] = useState(localStorage.getItem('role') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!userRole);

  useEffect(() => {
    if (userRole) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [userRole]);

  const roleRoutes = {
    admin: [
      { path: '/', element: <Dashboard /> },
      { path: '/students', element: <Students /> },
      { path: '/fee-records', element: <FeeRecords /> },
      { path: '/fee-reminders', element: <FeeReminders /> },
      { path: '/course', element: <Course /> },
      { path: '/test-records', element: <TestRecords /> },
      { path: '/user-list/:role_id', element: <UserList /> },
      { path: '/student-marks/:testId', element: <StudentMarks /> },
      { path: '/student-performance', element: <StudentPerformance /> },
      { path: '/user-roles', element: <UserRoles /> },
      { path: '/attendance', element: <Attendance /> },
      { path: '/view-attendance', element: <ViewAttendance /> },
      { path: '/teacher-reports', element:<TeacherReports/>},
      { path: '/notice', element: <Notice /> }, 
      { path: '/class-performance', element: <ClassPerformance /> },
      {path: '/school-map', element: <SchoolMap />},
      {path: '/class-records', element: <ClassRecords />},
      {path: '/profile/:userId', element: <ProfileView />}, // Add this line
      {path: '/profile', element: <ProfileView />}, // Add this line for current user profile
      {path: '/birthdays', element: <Birthdays />},
    ],
    teacher: [
      { path: '/', element: <Dashboard /> },
      { path: '/students', element: <Students /> },
      { path: '/test-records', element: <TestRecords /> },
      { path: '/student-marks/:testId', element: <StudentMarks /> },
      { path: '/student-marks/:testId', element: <StudentMarks /> },
      { path: '/student-performance', element: <StudentPerformance /> },
      { path: '/class-performance', element: <ClassPerformance /> },
      { path: '/view-attendance', element: <ViewAttendance /> },
      { path: '/attendance', element: <Attendance /> },
      {path: '/class-records', element: <ClassRecords />},
      {path: '/profile/:userId', element: <ProfileView />}, // Add this line
      {path: '/profile', element: <ProfileView />}, // Add this line for current user profile
    ],
    counselor: [
      { path: '/', element: <Dashboard /> },
      { path: '/test-records', element: <TestRecords /> },
      { path: '/class-performance', element: <ClassPerformance /> },
      { path: '/student-marks/:testId', element: <StudentMarks /> },
      { path: '/student-performance', element: <StudentPerformance /> },
      { path: '/fee-records', element: <FeeRecords /> },
      { path: '/fee-reminders', element: <FeeReminders /> },
      { path: '/notice', element: <Notice /> }, 
      { path: '/students', element: <Students /> },
      { path: '/view-attendance', element: <ViewAttendance /> },
      {path: '/profile/:userId', element: <ProfileView />}, // Add this line
      {path: '/profile', element: <ProfileView />}, // Add this line for current user profile
      {path: '/birthdays', element: <Birthdays />},
    ],
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    setUserRole('');
    setIsLoggedIn(false);
  };

  return (
    <div className={currentMode === 'Dark' ? 'dark' : ''}>
      <BrowserRouter>
        {isLoggedIn ? (
          <div className="flex relative dark:bg-main-dark-bg">
            
            {activeMenu ? (
              <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg bg-white">
                <Sidebar role={userRole} />
              </div>
            ) : (
              <div className="w-0 dark:bg-secondary-dark-bg">
                <Sidebar role={userRole} />
              </div>
            )}
            <div
              className={`dark:bg-main-dark-bg bg-main-bg min-h-screen w-full ${
                activeMenu ? 'md:ml-72' : 'flex-2'
              }`}
            >
              
              <div>
                {themeSettings && <ThemeSettings />}
                <Routes>
                  {roleRoutes[userRole]?.map((route) => (
                    <Route key={route.path} path={route.path} element={route.element} />
                  ))}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/" element={<Login setUserRole={setUserRole} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </BrowserRouter>
    </div>
  );
};

export default App;