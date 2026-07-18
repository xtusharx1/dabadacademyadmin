import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Header } from "../components";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const Students = () => {
  // State management
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [batchMapping, setBatchMapping] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(50);
  
  // Search and filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterBatch, setFilterBatch] = useState("");

  // Initial empty student object template
  const emptyStudent = {
    role_id: 2,
    name: "",
    email: "",
    phone_number: "",
    profile_picture: null,
    password: "",
    status: "active",
    date_of_admission: "",
    present_class: "",
    date_of_birth: "",
    total_course_fees: "",
    father_name: "",
    mother_name: "",
    full_address: "",
    child_aadhar_number: "",
    mother_aadhar_number: "",
    father_aadhar_number: "",
    permanent_education_number: "",
    student_registration_number: "",
    previous_school_info: "",
    gender: "",
    state: "",
    type: "online",
    batch_id: "",
    created_at: new Date().toISOString(),
  };
  
  const [newStudent, setNewStudent] = useState(emptyStudent);
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  // Base URL for API endpoints
  const API_BASE_URL = "https://apistudents.sainikschoolcadet.com/api";

  // Function to fetch data with error handling
  const fetchWithErrorHandling = useCallback(async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      throw error;
    }
  }, []);

  // Batch Cache to avoid redundant API calls
  const batchCache = useMemo(() => ({}), []);
  const counselorCache = useMemo(() => ({}), []);
  const typeCache = useMemo(() => ({}), []);

  // Memoized fetch functions to prevent re-creation on every render
  const fetchStudentBatch = useCallback(async (userId) => {
    if (batchCache[userId]) return batchCache[userId];
    
    try {
      const data = await fetchWithErrorHandling(
        `${API_BASE_URL}/studentBatches/students/search/${userId}`
      );
      batchCache[userId] = data.length > 0 ? data[0] : null;
      return batchCache[userId];
    } catch (error) {
      console.error(`Error fetching batch for student ${userId}:`, error);
      return null;
    }
  }, [fetchWithErrorHandling, batchCache]);

  const fetchCounselorInfo = useCallback(async (userId) => {
    if (counselorCache[userId]) return counselorCache[userId];
    
    try {
      const counselorResponse = await fetchWithErrorHandling(
        `${API_BASE_URL}/student-counselor/student/${userId}`
      );
      
      if (counselorResponse && counselorResponse.c_id) {
        const counselorDetails = await fetchWithErrorHandling(
          `${API_BASE_URL}/users/user/${counselorResponse.c_id}`
        );
        
        const result = {
          counselor_id: counselorResponse.c_id,
          counselor_name: counselorDetails.user?.name || "Unknown Counselor"
        };
        
        counselorCache[userId] = result;
        return result;
      } else {
        counselorCache[userId] = {
          counselor_id: null,
          counselor_name: "Not Available"
        };
        return counselorCache[userId];
      }
    } catch (error) {
      console.error(`Error fetching counselor for student ${userId}:`, error);
      return {
        counselor_id: null,
        counselor_name: "Not Defined"
      };
    }
  }, [fetchWithErrorHandling, counselorCache]);

  const fetchStudentType = useCallback(async (userId) => {
    if (typeCache[userId]) return typeCache[userId];
    
    try {
      const typeResponse = await fetchWithErrorHandling(
        `${API_BASE_URL}/student-types/${userId}`
      );
      
      typeCache[userId] = typeResponse.type || "Not Defined";
      return typeCache[userId];
    } catch (error) {
      console.error(`Error fetching type for student ${userId}:`, error);
      return "Not Defined";
    }
  }, [fetchWithErrorHandling, typeCache]);

  // Main data fetching function
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch Students and Batches in Parallel
        const [studentsData, batchesData] = await Promise.all([
          fetchWithErrorHandling(`${API_BASE_URL}/users/role/2`),
          fetchWithErrorHandling(`${API_BASE_URL}/batches/`)
        ]);
  
        // Create Batch Mapping (batch_id => batch_name)
        const mapping = batchesData.reduce((acc, batch) => {
          acc[batch.batch_id] = batch.batch_name;
          return acc;
        }, {});
  
        setBatches(batchesData);
        setBatchMapping(mapping);
  
        // Process students in smaller batches for better responsiveness
        const batchSize = 10;
        const processedStudents = [];
        
        // Process students in batches
        for (let i = 0; i < studentsData.length; i += batchSize) {
          const batch = studentsData.slice(i, i + batchSize);
          
          // Create tasks for all students in the current batch
          const batchPromises = batch.map(async (student) => {
            try {
              // Fetch batch, counselor, and type info in parallel
              const [batchData, counselorInfo, type] = await Promise.all([
                fetchStudentBatch(student.user_id),
                fetchCounselorInfo(student.user_id),
                fetchStudentType(student.user_id)
              ]);
              
              // Prepare student data with all details
              return {
                ...student,
                batch_id: batchData?.batch_id || null,
                batch_name: batchData?.batch_id ? mapping[batchData.batch_id] || "Unknown Batch" : "No Batch Assigned",
                counselor_id: counselorInfo.counselor_id,
                counselor_name: counselorInfo.counselor_name,
                type: type
              };
            } catch (error) {
              console.error(`Error processing student ${student.user_id}:`, error);
              return {
                ...student,
                batch_id: null,
                batch_name: "Data Fetch Error",
                counselor_id: null,
                counselor_name: "Data Fetch Error",
                type: "Not Defined"
              };
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          processedStudents.push(...batchResults);
          
          // Update state with partial results for better UI responsiveness
          setStudents([...processedStudents]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load student data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [fetchWithErrorHandling, fetchStudentBatch, fetchCounselorInfo, fetchStudentType]);

  // Format date for API (YYYY-MM-DD to DD-MM-YY)
  const formatDateForAPI = (dateStr) => {
    if (!dateStr) return null;
    
    try {
      const date = new Date(dateStr);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateStr);
        return null;
      }
      
      // Format as YYYY-MM-DD (SQL standard format)
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  // Format date for display (e.g. 10-July-26)
  const formatAdmissionDate = (dateStr) => {
    if (!dateStr || dateStr === 'N/A' || dateStr === 'null') return 'N/A';

    try {
      let dStr = dateStr;
      if (typeof dateStr === 'string' && /^\d{1,2}-\d{1,2}-\d{2,4}/.test(dateStr)) {
        const [datePart, timePart] = dateStr.split(' ');
        const parts = datePart.split('-');
        if (parts[0].length <= 2 && parts[2].length >= 2) {
          const day = parts[0].padStart(2, '0');
          const month = parts[1].padStart(2, '0');
          const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          dStr = `${year}-${month}-${day}${timePart ? 'T' + timePart : ''}`;
        }
      }

      const date = new Date(dStr);
      if (isNaN(date.getTime())) return dateStr;

      const day = date.getDate().toString().padStart(2, '0');
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const month = months[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);

      return `${day}-${month}-${year}`;
    } catch (error) {
      return dateStr;
    }
  };
  // Handler for form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewStudent({
      ...newStudent,
      [name]: value,
    });
  };

  // Handler for file input changes (profile picture)
  const handleFileChange = (e) => {
    setNewStudent({
      ...newStudent,
      profile_picture: e.target.files[0],
    });
  };
  const handleViewProfile = (userId) => {
    window.open(`/profile/${userId}`, '_blank');
  };
  
  // Handler for edit form input changes
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingStudent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };
  
  // Add this function to handle password submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Reset messages
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate password
    if (!passwordData.new_password) {
      setPasswordError('New password is required');
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      // Make API call to change password
      await axios.put(`${API_BASE_URL}/users/user/${editingStudent.user_id}/change-password`, {
        new_password: passwordData.new_password
      });
      
      // Show success message
      setPasswordSuccess('Password changed successfully');
      
      // Reset password fields
      setPasswordData({
        new_password: '',
        confirm_password: ''
      });
      
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('Failed to change password. Please try again.');
    }
  };
  // Handler for edit button click
  const handleEditClick = async (userId) => {
    setIsLoading(true);
    
    try {
      // Fetch detailed student data directly from the API
      const response = await axios.get(`${API_BASE_URL}/users/user/${userId}`);
      const detailedStudent = response.data.user;
      
      if (!detailedStudent) {
        throw new Error("Failed to load student data");
      }
      
      // Also get the batch info and type which might not be included in the detailed response
      const selectedStudent = students.find((student) => student.user_id === userId);
      
      // Format dates for form inputs (API might return DD-MM-YY but form needs YYYY-MM-DD)
      const formatDateForForm = (dateStr) => {
        if (!dateStr) return '';
        
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        
        // Otherwise, parse and convert
        try {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            return `${year}-${month}-${day}`;
          }
        } catch (error) {
          console.error("Error formatting date:", error);
        }
        
        return dateStr; // Return original if can't parse
      };
      
      // Prepare the complete student data for the form
      const completeStudentData = {
        ...detailedStudent,
        // Add these fields from the list if they exist
        batch_id: selectedStudent?.batch_id || "",
        type: selectedStudent?.type || "online",
        // Ensure dates are in the correct format for form inputs
        date_of_admission: formatDateForForm(detailedStudent.date_of_admission),
        date_of_birth: formatDateForForm(detailedStudent.date_of_birth),
        // Make sure numeric fields are properly formatted
        total_course_fees: detailedStudent.total_course_fees?.toString() || ""
      };
      
      console.log("Complete student data for editing:", completeStudentData);
      
      setEditingStudent(completeStudentData);
      setShowEditModal(true);
    } catch (error) {
      console.error("Error loading student for editing:", error);
      alert("Failed to load student data for editing: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit handler for creating a new student
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Form validation
    if (!newStudent.name || !newStudent.email || !newStudent.phone_number || 
        !newStudent.password || !newStudent.status || !newStudent.gender || 
        !newStudent.type || !newStudent.batch_id) {
      alert("Please fill in all required fields.");
      return;
    }
  
    // Validate course fees
    if (newStudent.total_course_fees === "" || isNaN(newStudent.total_course_fees)) {
      alert("Total course fees must be a valid number and is required.");
      return;
    }
  
    // Prepare student data for API
    const studentData = {
      name: newStudent.name,
      email: newStudent.email,
      password: newStudent.password,
      role_id: 2,
      phone_number: newStudent.phone_number,
      date_of_admission: formatDateForAPI(newStudent.date_of_admission),
      present_class: newStudent.present_class,
      date_of_birth: formatDateForAPI(newStudent.date_of_birth),
      total_course_fees: parseFloat(newStudent.total_course_fees),
      father_name: newStudent.father_name || "",
      mother_name: newStudent.mother_name || "",
      full_address: newStudent.full_address || "",
      child_aadhar_number: newStudent.child_aadhar_number || "",
      mother_aadhar_number: newStudent.mother_aadhar_number || "",
      father_aadhar_number: newStudent.father_aadhar_number || "",
      permanent_education_number: newStudent.permanent_education_number || "",
      student_registration_number: newStudent.student_registration_number || "",
      previous_school_info: newStudent.previous_school_info || "",
      gender: newStudent.gender,
      state: newStudent.state || "",
      status: newStudent.status
    };
  
    try {
      // Step 1: Create the student
      console.log(studentData);
      const response = await axios.post(`${API_BASE_URL}/users/register`, studentData);
      
      // Check if user object exists in the response
      if (response.data && response.data.user && response.data.user.id) {
        const user_id = response.data.user.id;
        const selectedBatch = newStudent.batch_id;
        const selectedType = newStudent.type;
        
        // Step 2: Add student to batch
        await axios.post(`${API_BASE_URL}/studentBatches/students/batch/`, {
          user_id,
          batch_id: selectedBatch
        });
        
        // Step 3: Assign counselor if available
        const counselor_id = localStorage.getItem('user_id');
        if (counselor_id) {
          try {
            await axios.post(`${API_BASE_URL}/student-counselor`, {
              c_id: parseInt(counselor_id),
              s_id: user_id
            });
          } catch (error) {
            console.error("Error assigning counselor to student:", error);
          }
        }
        
        // Step 4: Set student type
        try {
          await axios.post(`${API_BASE_URL}/student-types`, {
            student_id: user_id,
            type: selectedType
          });
        } catch (error) {
          console.error("Error setting student type:", error);
        }
        
        // Reset form and close modal
        setNewStudent(emptyStudent);
        setShowModal(false);
        
        // Reload data instead of full page refresh
        // This is more efficient than window.location.reload()
        window.location.reload();
      } else {
        alert("User registration failed. Please check the input data.");
      }
    } catch (error) {
      console.error("Error creating student:", error);
      
      // Improved error handling to display the actual error message from the API
      if (error.response && error.response.data) {
        // Extract the specific error message from the API response
        const errorMessage = error.response.data.message || "Unknown server error";
        alert(`Error creating student: ${errorMessage}`);
        
        // If there are detailed validation errors, log them to console
        if (error.response.data.errors) {
          console.error("Validation errors:", error.response.data.errors);
        }
      } else if (error.request) {
        // The request was made but no response was received
        alert("Error creating student: No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        alert(`Error creating student: ${error.message || "Unknown error"}`);
      }
    }
  };

  // Submit handler for updating a student
  // Submit handler for updating a student
const handleEditSubmit = async (e) => {
  e.preventDefault();
  
  // Basic validation for essential fields
  if (!editingStudent.name || !editingStudent.email || !editingStudent.phone_number || 
      !editingStudent.status) {
    alert("Please fill in all required fields: Name, Email, Phone Number, and Status.");
    return;
  }
  
  // Validate batch and type if they're required in your application
  if (!editingStudent.batch_id) {
    alert("Please select a batch for the student.");
    return;
  }
  
  if (!editingStudent.type) {
    alert("Please select a student type.");
    return;
  }
  
  // Format data for API submission
  const studentData = {
    name: editingStudent.name,
    email: editingStudent.email,
    phone_number: editingStudent.phone_number,
    role_id: 2,
    status: editingStudent.status,
    gender: editingStudent.gender || "",
    present_class: editingStudent.present_class || "",
    date_of_admission: formatDateForAPI(editingStudent.date_of_admission),
    date_of_birth: formatDateForAPI(editingStudent.date_of_birth),
    total_course_fees: editingStudent.total_course_fees ? parseFloat(editingStudent.total_course_fees) : 0,
    father_name: editingStudent.father_name || "",
    mother_name: editingStudent.mother_name || "",
    full_address: editingStudent.full_address || "",
    child_aadhar_number: editingStudent.child_aadhar_number || "",
    mother_aadhar_number: editingStudent.mother_aadhar_number || "",
    father_aadhar_number: editingStudent.father_aadhar_number || "",
    permanent_education_number: editingStudent.permanent_education_number || "",
    student_registration_number: editingStudent.student_registration_number || "",
    previous_school_info: editingStudent.previous_school_info || "",
    state: editingStudent.state || ""
  };
  
  console.log("Data being submitted to API:", studentData);
  
  // Flag to track overall success
  let mainUpdateSuccessful = false;
  
  try {
    // Step 1: Update student's basic info
    const response = await axios.put(`${API_BASE_URL}/users/user/${editingStudent.user_id}`, studentData);
    console.log("API Response:", response.data);
    mainUpdateSuccessful = true;
    
    // Track success of each step
    let batchUpdateSuccessful = true;
    let typeUpdateSuccessful = true;
    
    // Step 2: Try to update batch information using the new API endpoint
    try {
      // Find the original batch ID from the students array
      const originalStudent = students.find(s => s.user_id === editingStudent.user_id);
      const originalBatchId = originalStudent ? originalStudent.batch_id : null;
      
      if (editingStudent.batch_id && originalBatchId !== editingStudent.batch_id) {
        console.log(`Attempting to update batch for user ${editingStudent.user_id} from ${originalBatchId} to ${editingStudent.batch_id}`);
        
        await axios.put(`${API_BASE_URL}/studentBatches/update`, {
          user_id: editingStudent.user_id,
          old_batch_id: originalBatchId,
          new_batch_id: editingStudent.batch_id
        });
        
        console.log("Batch update successful");
      }
    } catch (batchError) {
      console.error("Batch update error:", batchError.response ? batchError.response.data : batchError);
      batchUpdateSuccessful = false;
    }
    
    // Step 3: Try to update student type
    try {
      if (editingStudent.type) {
        console.log(`Attempting to update type for user ${editingStudent.user_id} with type ${editingStudent.type}`);
        
        await axios.post(`${API_BASE_URL}/student-types`, {
          student_id: editingStudent.user_id,
          type: editingStudent.type
        });
        
        console.log("Type update successful");
      }
    } catch (typeError) {
      console.error("Type update error:", typeError.response ? typeError.response.data : typeError);
      typeUpdateSuccessful = false;
    }
    
    // Provide appropriate message based on what succeeded
    if (mainUpdateSuccessful && batchUpdateSuccessful && typeUpdateSuccessful) {
      alert('Student updated successfully!');
    } else if (mainUpdateSuccessful) {
      if (!batchUpdateSuccessful && !typeUpdateSuccessful) {
        alert('Student basic information updated successfully, but there were issues updating both batch and type information.');
      } else if (!batchUpdateSuccessful) {
        alert('Student basic information updated successfully, but there was an issue updating the batch information.');
      } else {
        alert('Student basic information updated successfully, but there was an issue updating the type information.');
      }
    }
    
    // Reload the page regardless of batch/type update success
    window.location.reload();
    
  } catch (error) {
    console.error('Error updating student:', error);
    
    if (error.response && error.response.data) {
      const errorMessage = error.response.data.message || "Unknown server error";
      alert(`Error updating student: ${errorMessage}`);
    } else if (error.request) {
      alert("Error updating student: No response from server. Please check your connection.");
    } else {
      alert(`Error updating student: ${error.message || "Unknown error"}`);
    }
  }
};
  
  // Filter students based on search term and filters
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      // Search term filter
      const matchesSearch = 
        searchTerm === "" ||
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.phone_number.includes(searchTerm);
      
      // Type filter
      const matchesType = 
        filterType === "" || 
        student.type === filterType;
      
      // Batch filter
      const matchesBatch = 
        filterBatch === "" || 
        student.batch_id === parseInt(filterBatch);
      
      return matchesSearch && matchesType && matchesBatch;
    });
  }, [students, searchTerm, filterType, filterBatch]);

  // Pagination calculations
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Function to handle pagination
  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Scroll to top of the table when changing pages
    document.querySelector('.students-table')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm("");
    setFilterType("");
    setFilterBatch("");
    setCurrentPage(1);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
    <div className="w-full px-0 py-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <Header category="" title="Students" />
            
            {/* Controls Row */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              {/* Left side - Add button */}
              <button
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
                onClick={() => setShowModal(true)}
              >
                Create New Student
              </button>
              
              {/* Right side - Search and filters */}
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search box */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    🔍
                  </span>
                </div>
                
                {/* Type filter */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="online">Online</option>
                  <option value="dayboarder">Day Boarder</option>
                  <option value="hosteller">Hosteller</option>
                </select>
                
                {/* Batch filter */}
                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Batches</option>
                  {batches.map((batch) => (
                    <option key={batch.batch_id} value={batch.batch_id}>
                      {batch.batch_name}
                    </option>
                  ))}
                </select>
                
                {/* Reset filters button */}
                <button
                  onClick={resetFilters}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition duration-200"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {/* Loading and error states */}
            {isLoading && students.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                <p className="text-gray-600">Loading students...</p>
              </div>
            )}
            
            {error && (
              <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                <p>{error}</p>
              </div>
            )}
            
            {/* Student count summary */}
            <div className="mb-4 text-gray-600">
              {!isLoading && (
                <p>
                  Showing {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                  {(searchTerm || filterType || filterBatch) ? ' (filtered)' : ''}
                </p>
              )}
            </div>
            
            {/* Students table */}
            <div className="students-table overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-50">
    <tr>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        S.No
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Admn. No.
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Name
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Email
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Phone Number
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Batch Name
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Added by
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Type
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Date of Admission
      </th>
      <th scope="col" className="px-4 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
        Status
      </th>
      <th scope="col" className="px-4 py-3 text-center text-base font-medium text-gray-500 uppercase tracking-wider">
        Actions
      </th>
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {currentStudents.length > 0 ? (
      currentStudents.map((student, index) => (
        <tr key={student.user_id} className="hover:bg-gray-50 transition duration-150">
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500 text-center">
            {indexOfFirstStudent + index + 1}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {student.user_id}
          </td>
          <td className="px-4 py-3">
            <div className="text-base font-medium text-gray-900 max-w-[150px] break-words">
              {student.name}
            </div>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {student.email}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {student.phone_number}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {student.batch_name}
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {student.counselor_name || "No Counselor"}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full
              ${student.type === 'online' ? 'bg-blue-100 text-blue-800' : 
                student.type === 'dayboarder' ? 'bg-yellow-100 text-yellow-800' :
                student.type === 'hosteller' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'}`}>
              {student.type ? student.type.charAt(0).toUpperCase() + student.type.slice(1) : "Not Defined"}
            </span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-base text-gray-500">
            {formatAdmissionDate(student.date_of_admission)}
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <span className={`px-2 py-1 inline-flex text-base leading-5 font-semibold rounded-full
              ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
            </span>
          </td>
          <td className="px-4 py-3 whitespace-nowrap text-center text-base font-medium">
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => handleEditClick(student.user_id)}
                className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 transition duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleViewProfile(student.user_id)}
                className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600 transition duration-200"
              >
                View Profile
              </button>
            </div>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="11" className="px-6 py-4 text-center text-base text-gray-500">
          {isLoading ? "Loading student data..." : "No students found matching the criteria."}
        </td>
      </tr>
    )}
  </tbody>
</table>
            </div>
            
            {/* Pagination */}
            {filteredStudents.length > 0 && (
              <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                <div className="flex items-center">
                  <p className="text-base text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{indexOfFirstStudent + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastStudent, filteredStudents.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{filteredStudents.length}</span>
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
                  
                  {/* Show only a limited number of page buttons */}
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
        </div>
      </div>

      {/* Create Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Create New Student</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information Section */}
              <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={newStudent.name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={newStudent.email}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone_number"
                      value={newStudent.phone_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={newStudent.password}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={newStudent.gender}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={newStudent.status}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Academic Information Section */}
              <div className="bg-green-50 p-4 rounded-lg col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-green-800">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Batch <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="batch_id"
                      value={newStudent.batch_id}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select Batch</option>
                      {batches.map((batch) => (
                        <option key={batch.batch_id} value={batch.batch_id}>
                          {batch.batch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Student Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="type"
                      value={newStudent.type}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="online">Online</option>
                      <option value="dayboarder">Day Boarder</option>
                      <option value="hosteller">Hosteller</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Present Class
                    </label>
                    <input
                      type="text"
                      name="present_class"
                      value={newStudent.present_class}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Total Course Fees <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="total_course_fees"
                      value={newStudent.total_course_fees}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Date of Admission
                    </label>
                    <input
                      type="date"
                      name="date_of_admission"
                      value={newStudent.date_of_admission}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={newStudent.date_of_birth}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Personal Details Section */}
              <div className="bg-amber-50 p-4 rounded-lg col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-amber-800">Personal Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Father's Name
                    </label>
                    <input
                      type="text"
                      name="father_name"
                      value={newStudent.father_name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      name="mother_name"
                      value={newStudent.mother_name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={newStudent.state}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Full Address
                    </label>
                    <textarea
                      name="full_address"
                      value={newStudent.full_address}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Documents Section */}
              <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                <h3 className="text-lg font-semibold mb-3 text-purple-800">Documents & IDs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Child Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="child_aadhar_number"
                      value={newStudent.child_aadhar_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Father Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="father_aadhar_number"
                      value={newStudent.father_aadhar_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Mother Aadhar Number
                    </label>
                    <input
                      type="text"
                      name="mother_aadhar_number"
                      value={newStudent.mother_aadhar_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Permanent Education Number
                    </label>
                    <input
                      type="text"
                      name="permanent_education_number"
                      value={newStudent.permanent_education_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Student Registration Number
                    </label>
                    <input
                      type="text"
                      name="student_registration_number"
                      value={newStudent.student_registration_number}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <label className="block text-base font-medium text-gray-700 mb-1">
                      Previous School Info
                    </label>
                    <textarea
                      name="previous_school_info"
                      value={newStudent.previous_school_info}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="col-span-2 flex justify-center gap-4 mt-6">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
                >
                  Create Student
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && editingStudent && (
  <div className="fixed inset-0 z-50 overflow-auto bg-gray-500 bg-opacity-75 flex items-center justify-center">
    <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Edit Student: {editingStudent.name}</h2>
        <button
          onClick={() => setShowEditModal(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          <span className="text-2xl">&times;</span>
        </button>
      </div>
      
      <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information Section */}
        <div className="bg-blue-50 p-4 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-blue-800">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={editingStudent.name}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={editingStudent.email}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone_number"
                value={editingStudent.phone_number}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                name="gender"
                value={editingStudent.gender}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={editingStudent.status}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Academic Information Section */}
        <div className="bg-green-50 p-4 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-green-800">Academic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Batch <span className="text-red-500">*</span>
              </label>
              <select
                name="batch_id"
                value={editingStudent.batch_id || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Batch</option>
                {batches.map((batch) => (
                  <option key={batch.batch_id} value={batch.batch_id}>
                    {batch.batch_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Student Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={editingStudent.type || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select Type</option>
                <option value="online">Online</option>
                <option value="dayboarder">Day Boarder</option>
                <option value="hosteller">Hosteller</option>
              </select>
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Present Class
              </label>
              <input
                type="text"
                name="present_class"
                value={editingStudent.present_class || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Total Course Fees <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="total_course_fees"
                value={editingStudent.total_course_fees || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Date of Admission
              </label>
              <input
                type="date"
                name="date_of_admission"
                value={editingStudent.date_of_admission || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={editingStudent.date_of_birth || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* Personal Details Section */}
        <div className="bg-amber-50 p-4 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-amber-800">Personal Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Father's Name
              </label>
              <input
                type="text"
                name="father_name"
                value={editingStudent.father_name || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Mother's Name
              </label>
              <input
                type="text"
                name="mother_name"
                value={editingStudent.mother_name || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={editingStudent.state || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Full Address
              </label>
              <textarea
                name="full_address"
                value={editingStudent.full_address || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Documents Section */}
        <div className="bg-purple-50 p-4 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-purple-800">Documents & IDs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Child Aadhar Number
              </label>
              <input
                type="text"
                name="child_aadhar_number"
                value={editingStudent.child_aadhar_number || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Father Aadhar Number
              </label>
              <input
                type="text"
                name="father_aadhar_number"
                value={editingStudent.father_aadhar_number || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Mother Aadhar Number
              </label>
              <input
                type="text"
                name="mother_aadhar_number"
                value={editingStudent.mother_aadhar_number || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Permanent Education Number
              </label>
              <input
                type="text"
                name="permanent_education_number"
                value={editingStudent.permanent_education_number || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Student Registration Number
              </label>
              <input
                type="text"
                name="student_registration_number"
                value={editingStudent.student_registration_number || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="col-span-2">
              <label className="block text-base font-medium text-gray-700 mb-1">
                Previous School Info
              </label>
              <textarea
                name="previous_school_info"
                value={editingStudent.previous_school_info || ""}
                onChange={handleEditChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Password Change Section - NEW */}
        <div className="bg-red-50 p-4 rounded-lg col-span-2">
          <h3 className="text-lg font-semibold mb-3 text-red-800">Change Password</h3>
          
          {/* Success message */}
          {passwordSuccess && (
            <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
              {passwordSuccess}
            </div>
          )}
          
          {/* Error message */}
          {passwordError && (
            <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
              {passwordError}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-base font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <button
              type="button"
              onClick={handlePasswordSubmit}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
            >
              Change Password
            </button>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="col-span-2 flex justify-center gap-4 mt-6">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Update Student
          </button>
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}
    </div>
  );
};

// Export the component
export default Students;