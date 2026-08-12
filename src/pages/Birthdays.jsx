import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '../components';
import { FiGift, FiSearch, FiCalendar, FiClock, FiUser, FiPhone, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const BASE_URL = 'https://apistudents.sainikschoolcadet.com';

const Birthdays = () => {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState('all');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const navigate = useNavigate();

  useEffect(() => {
    fetchBirthdays();
  }, []);

  const fetchBirthdays = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`${BASE_URL}/api/users/birthdays`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStudents(data);
    } catch (err) {
      console.error('Error fetching student birthdays:', err);
      setError('Failed to load student birthdays. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMonth, itemsPerPage]);

  // Today's birthdays list
  const todaysBirthdays = useMemo(() => {
    return students.filter(s => s.isToday);
  }, [students]);

  // Filtered students based on search term & month filter
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch =
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.present_class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.batch_names?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone_number?.includes(searchTerm) ||
        student.formattedDob?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (filterMonth !== 'all') {
        const nextBdayDate = new Date(student.nextBirthday);
        if (isNaN(nextBdayDate.getTime())) return true;
        const monthNum = (nextBdayDate.getMonth() + 1).toString();
        return monthNum === filterMonth;
      }

      return true;
    });
  }, [students, searchTerm, filterMonth]);

  // Pagination calculations
  const indexOfLastStudent = currentPage * itemsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
  const currentStudents = useMemo(() => {
    return filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  }, [filteredStudents, indexOfFirstStudent, indexOfLastStudent]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Statistics
  const stats = useMemo(() => {
    const todayCount = todaysBirthdays.length;
    const thisMonthCount = students.filter(student => {
      const nextBdayDate = new Date(student.nextBirthday);
      if (isNaN(nextBdayDate.getTime())) return false;
      return nextBdayDate.getMonth() === new Date().getMonth();
    }).length;

    return {
      total: students.length,
      today: todayCount,
      thisMonth: thisMonthCount,
    };
  }, [students, todaysBirthdays]);

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white rounded-3xl dark:bg-secondary-dark-bg shadow-sm">
      <Header category="Management" title="Student Birthdays" />

      {/* Hero / Today's Birthday Banner */}
      {todaysBirthdays.length > 0 && (
        <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-500 text-white shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 opacity-20 text-9xl">
            <FiGift />
          </div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="bg-white text-purple-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
              <FiGift /> Today's Birthday 🎉
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">
            Wishing Happy Birthday to {todaysBirthdays.map(s => s.name).join(', ')}! 🎂
          </h2>
          <div className="flex flex-wrap gap-4 mt-2">
            {todaysBirthdays.map(student => (
              <div
                key={student.user_id}
                onClick={() => navigate(`/profile/${student.user_id}`)}
                className="cursor-pointer bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center space-x-3 hover:bg-white/30 transition"
              >
                <div className="w-10 h-10 rounded-full bg-white text-purple-700 font-bold flex items-center justify-center text-lg">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-bold">{student.name}</div>
                  <div className="text-xs text-purple-100">
                    Turns {student.age} today • {student.batch_names || student.present_class || 'Class N/A'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-blue-100 dark:border-gray-600 flex items-center space-x-4">
          <div className="p-3 bg-blue-500 text-white rounded-xl text-2xl">
            <FiUser />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Active Batch Students</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-pink-100 dark:border-gray-600 flex items-center space-x-4">
          <div className="p-3 bg-pink-500 text-white rounded-xl text-2xl">
            <FiGift />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthdays Today</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.today}</p>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border border-purple-100 dark:border-gray-600 flex items-center space-x-4">
          <div className="p-3 bg-purple-500 text-white rounded-xl text-2xl">
            <FiCalendar />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Birthdays This Month</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats.thisMonth}</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="relative w-full md:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            placeholder="Search by student, batch, DOB..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              Filter Month:
            </label>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="all">All Months</option>
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">
              Per Page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-white text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading student birthdays...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center text-red-600 dark:text-red-400">
          <p>{error}</p>
          <button
            onClick={fetchBirthdays}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    S.No
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Active Batch
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Upcoming Birthday
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Age
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status / Countdown
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Phone Number
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {currentStudents.length > 0 ? (
                  currentStudents.map((student, index) => (
                    <tr
                      key={student.user_id}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition duration-150 ${
                        student.isToday ? 'bg-pink-50/60 dark:bg-purple-950/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {indexOfFirstStudent + index + 1}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                            student.isToday ? 'bg-pink-500' : 'bg-purple-500'
                          }`}>
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/profile/${student.user_id}`)}
                              className="font-medium text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 text-left transition"
                            >
                              {student.name}
                            </button>
                            {student.email && (
                              <div className="text-xs text-gray-400">{student.email}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                          {student.batch_names || student.present_class || 'N/A'}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-700 dark:text-gray-200">
                        {student.formattedDob}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {student.formattedNextBirthday}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-center font-semibold text-gray-800 dark:text-white">
                        {student.age} yrs
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-center">
                        {student.isToday ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-extrabold rounded-full bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300 animate-bounce">
                            Today 🎉
                          </span>
                        ) : student.daysRemaining === 1 ? (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            Tomorrow 🎈
                          </span>
                        ) : (
                          <span className="px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            In {student.daysRemaining} days
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {student.phone_number ? (
                          <a
                            href={`tel:${student.phone_number}`}
                            className="flex items-center space-x-1 hover:text-purple-600 transition"
                          >
                            <FiPhone className="text-xs" />
                            <span>{student.phone_number}</span>
                          </a>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      No student birthdays found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredStudents.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {indexOfFirstStudent + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {Math.min(indexOfLastStudent, filteredStudents.length)}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {filteredStudents.length}
                </span>{' '}
                students
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <FiChevronLeft />
                  <span>Previous</span>
                </button>

                {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        currentPage === pageNum
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1 transition ${
                    currentPage === totalPages || totalPages === 0
                      ? 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <span>Next</span>
                  <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Birthdays;
