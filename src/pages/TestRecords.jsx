import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TestRecords = () => {
  const [testRecords, setTestRecords] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newTest, setNewTest] = useState({ testName: '', subject: '', date: '', batchId: '', totalMarks: '' });
  const [editTest, setEditTest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // First fetch batches
        const batchResponse = await fetch('https://apistudents.sainikschoolcadet.com/api/batches/');
        if (!batchResponse.ok) {
          throw new Error('Failed to fetch batches');
        }
        const batchData = await batchResponse.json();
        setBatches(batchData);
        
        // Create a Set of valid batch IDs for quick lookup
        const validBatchIds = new Set(batchData.map(batch => batch.batch_id));
        
        // Then fetch test records
        const testResponse = await fetch("https://apistudents.sainikschoolcadet.com/api/test");
        if (!testResponse.ok) {
          throw new Error('Failed to fetch test records');
        }
        const testData = await testResponse.json();
        
        // Filter out tests without valid batches and sort by date in descending order
        const filteredAndSortedTests = testData
          .filter(test => validBatchIds.has(test.batch_id))
          .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        setTestRecords(filteredAndSortedTests);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // (pagination clamp effect removed to revert to previous behavior)

  // Get current records
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = testRecords.slice(indexOfFirstRecord, indexOfLastRecord);

  // Calculate total pages
  const totalPages = Math.ceil(testRecords.length / recordsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editTest) {
      setEditTest({ ...editTest, [name]: value });
    } else {
      setNewTest({ ...newTest, [name]: value });
    }
  };

  const handleAddTest = async () => {
    try {
      const response = await fetch('https://apistudents.sainikschoolcadet.com/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: newTest.testName,
          subject: newTest.subject,
          date: newTest.date,
          batch_id: parseInt(newTest.batchId, 10),
          total_marks: parseInt(newTest.totalMarks, 10),
        }),
      });

      if (response.ok) {
        const createdTest = await response.json();
        navigate(`/add-students/${createdTest.test_id}`);
      } else {
        alert('Failed to create test. Please try again.');
      }
    } catch (error) {
      console.error('Error creating test:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const handleEditTest = (testId) => {
    const testToEdit = testRecords.find(test => test.test_id === testId);
    setEditTest(testToEdit);
    setShowEditModal(true);
  };

  const handleUpdateTest = async () => {
    try {
      const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/test/${editTest.test_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          test_name: editTest.test_name,
          subject: editTest.subject,
          date: editTest.date,
          batch_id: parseInt(editTest.batch_id, 10),
          total_marks: parseInt(editTest.total_marks, 10),
        }),
      });

      if (response.ok) {
        const updatedTest = await response.json();
        setTestRecords(prev => prev
          .map(test => (test.test_id === updatedTest.test_id ? updatedTest : test))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
        );
        setShowEditModal(false);
      } else {
        alert('Failed to update test. Please try again.');
      }
    } catch (error) {
      console.error('Error updating test:', error);
      alert('An error occurred. Please try again.');
    }
  };

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b.batch_id === batchId);
    return batch ? batch.batch_name : 'Unknown';
  };

  const goToStudentMarks = (testId) => {
    navigate(`/student-marks/${testId}`);
  };

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif', padding: '20px', backgroundColor: '#f9f9f9' }}>
      <div style={{ margin: '0 auto', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', padding: '20px', boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ fontSize: '24px', color: '#333', marginBottom: '20px' }}>Test Records</h1>
        
        <button
          className="bg-green-500 text-white px-5 py-2 rounded cursor-pointer mb-5 text-lg hover:bg-green-600"
          onClick={() => setShowAddModal(true)}
        >
          Add New Test
        </button>

        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            <span className="ml-3">Loading test records...</span>
          </div>
        ) : testRecords.length === 0 ? (
          <div className="bg-yellow-100 p-4 rounded-md text-yellow-800 text-center">
            No test records with valid batches were found. Please add a test to begin.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-base mt-5 bg-white dark:bg-gray-800 border border-gray-300">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">S.No.</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Test Name</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Subject</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Batch</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Total Marks</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Actions</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Student Marks</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record, index) => (
                  <tr
                    key={record.test_id}
                    className={
                      index % 2 === 0
                        ? "bg-gray-50 dark:bg-gray-900"
                        : "bg-white dark:bg-gray-800"
                    }
                  >
                    <td className="px-4 py-3 border border-gray-300">{indexOfFirstRecord + index + 1}</td>
                    <td className="px-4 py-3 border border-gray-300">{record.test_name}</td>
                    <td className="px-4 py-3 border border-gray-300">{record.subject}</td>
                    <td className="px-4 py-3 border border-gray-300">{record.date}</td>
                    <td className="px-4 py-3 border border-gray-300">{getBatchName(record.batch_id)}</td>
                    <td className="px-4 py-3 border border-gray-300">{record.total_marks}</td>
                    <td className="px-4 py-3 border border-gray-300">
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleEditTest(record.test_id)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 border border-gray-300">
                      <button
                        onClick={() => goToStudentMarks(record.test_id)}
                        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
                      >
                        Student Marks
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination UI */}
            {testRecords.length > recordsPerPage && (
              <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{indexOfFirstRecord + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastRecord, testRecords.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{testRecords.length}</span>
                    {' '}results
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  {/* Show limited number of page buttons for better UX */}
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
                    let pageNum;
                    
                    // Calculate which page numbers to show
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
                        onClick={() => paginate(pageNum)}
                        className={`px-3 py-1 rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Test Modal */}
        {showAddModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div
              style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Add New Test</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddTest();
                }}
              >
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Test Name:
                  <input
                    type="text"
                    name="testName"
                    value={newTest.testName}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Subject:
                  <input
                    type="text"
                    name="subject"
                    value={newTest.subject}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Date:
                  <input
                    type="date"
                    name="date"
                    value={newTest.date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Batch:
                  <select
                    name="batchId"
                    value={newTest.batchId}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.batch_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Total Marks:
                  <input
                    type="number"
                    name="totalMarks"
                    value={newTest.totalMarks}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Add Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#F44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Test Modal */}
        {showEditModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div
              style={{
                backgroundColor: '#fff',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              <h2 style={{ color: '#333', marginBottom: '20px' }}>Edit Test</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateTest();
                }}
              >
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Test Name:
                  <input
                    type="text"
                    name="test_name"
                    value={editTest.test_name}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Subject:
                  <input
                    type="text"
                    name="subject"
                    value={editTest.subject}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Date:
                  <input
                    type="date"
                    name="date"
                    value={editTest.date}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Batch:
                  <select
                    name="batch_id"
                    value={editTest.batch_id}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="">Select Batch</option>
                    {batches.map((batch) => (
                      <option key={batch.batch_id} value={batch.batch_id}>
                        {batch.batch_name}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'block', marginBottom: '15px' }}>
                  Total Marks:
                  <input
                    type="number"
                    name="total_marks"
                    value={editTest.total_marks}
                    onChange={handleInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      marginTop: '5px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                    }}
                  />
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#4CAF50',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Update Test
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#F44336',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestRecords;