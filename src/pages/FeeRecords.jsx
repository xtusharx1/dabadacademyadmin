import React, { useEffect, useState, useCallback, useMemo } from 'react';

// Constants
const BASE_URL = 'https://apistudents.sainikschoolcadet.com';

// Utility functions
const formatDate = (dateString) => {
  return dateString ? new Date(dateString).toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) : 'No Date';
};

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        width: '400px',
        position: 'relative',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#555',
        }}>✖</button>
        <h2 style={{ 
          marginBottom: '20px', 
          color: '#1D72B8', 
          textAlign: 'center',
          fontSize: '20px',
          borderBottom: '1px solid #eee',
          paddingBottom: '10px'
        }}>{title}</h2>
        {children}
      </div>
    </div>
  );
};

// Student List Component
// Student List Component with improved UI
const StudentList = ({ students, onStudentClick, selectedStudent }) => {
  if (students.length === 0) {
    return (
      <div style={{
        padding: '20px',
        color: '#888',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.05)',
        margin: '10px 0'
      }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>🔍</div>
        <p style={{ fontSize: '15px', marginBottom: '5px', fontWeight: '500' }}>No students found</p>
        <p style={{ fontSize: '13px', color: '#999' }}>Try changing your search or select a different course</p>
      </div>
    );
  }

  // Helper to check if a due date is upcoming (within 7 days)
  const isUpcomingDueDate = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };
  
  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('₹', '₹ ');
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '8px',
      paddingTop: '5px',
      paddingBottom: '5px'
    }}>
      {students.map((student) => {
        const hasUpcomingDue = isUpcomingDueDate(student.nextDueDate);
        const isSelected = selectedStudent?.user_id === student.user_id;
        
        return (
          <div 
            key={student.user_id} 
            style={{
              padding: '12px 15px',
              backgroundColor: isSelected ? '#E3F2FD' : '#ffffff',
              borderRadius: '10px',
              boxShadow: isSelected 
                ? '0 3px 12px rgba(29, 114, 184, 0.15)' 
                : '0 2px 6px rgba(0, 0, 0, 0.06)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderLeft: hasUpcomingDue 
                ? '4px solid #FF9800' 
                : '4px solid transparent',
              position: 'relative',
              overflow: 'hidden'
            }} 
            onClick={() => onStudentClick(student)}
          >
            {/* Student Name */}
            <div style={{
              fontWeight: '600',
              color: '#333',
              fontSize: '15px',
              lineHeight: '1.2',
              marginBottom: '8px',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap'
            }}>
              {student.name || 'Unnamed Student'}
            </div>
            
            {/* Balance Info Row */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
              }}>
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Balance
                </div>
                <div style={{
                  fontSize: '15px',
                  color: student.remainingFees > 0 ? '#D32F2F' : '#388E3C',
                  fontWeight: '600',
                }}>
                  {formatCurrency(student.remainingFees || 0)}
                </div>
              </div>
              
              {student.nextDueDate && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  gap: '3px'
                }}>
                  
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {new Date(student.nextDueDate).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short'
                    })}
                  </div>
                </div>
              )}
              
              {!student.nextDueDate && (
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  backgroundColor: '#f5f5f5',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  No Due Date
                </div>
              )}
            </div>
            
            {/* Progress Bar for Paid/Total */}
            {(student.totalFees > 0) && (
              <div style={{
                height: '4px',
                backgroundColor: '#f0f0f0',
                borderRadius: '2px',
                marginTop: '10px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  left: '0',
                  top: '0',
                  height: '100%',
                  width: `${Math.min(100, (student.feesSubmitted / student.totalFees) * 100)}%`,
                  backgroundColor: student.remainingFees <= 0 ? '#4CAF50' : '#1D72B8',
                  borderRadius: '2px',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
// Fee Summary Cards Component
const FeeSummaryCards = ({ studentFees, nextDueDate, paymentCompleted }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '20px' }}>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '10px', 
        flex: '1', 
        margin: '10px', 
        textAlign: 'center', 
        backgroundColor: '#E0F7FA', 
        color: '#00796B',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <h3>Total Fees</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{studentFees.totalFees || 0}</p>
      </div>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '10px', 
        flex: '1', 
        margin: '10px', 
        textAlign: 'center', 
        backgroundColor: '#E8F5E9', 
        color: '#388E3C',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <h3>Fees Submitted</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{studentFees.feesSubmitted || 0}</p>
      </div>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '10px', 
        flex: '1', 
        margin: '10px', 
        textAlign: 'center', 
        backgroundColor: '#FFEBEE', 
        color: '#D32F2F',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' 
      }}>
        <h3>Remaining Fees</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>₹{studentFees.remainingFees || 0}</p>
      </div>
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '20px', 
        borderRadius: '10px', 
        flex: '1', 
        margin: '10px', 
        textAlign: 'center', 
        backgroundColor: '#FFF3E0', 
        color: '#E65100',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
      }}>
        <h3>Next Due Date</h3>
        <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
          {nextDueDate ? formatDate(nextDueDate) : 
           paymentCompleted ? 'Payment Completed' : 'No Due Date'}
        </p>
      </div>
    </div>
  );
};

const RecordsTable = ({ 
  records, 
  onEditPayment, 
  onEditCharge,
  onDeletePayment,
  onDeleteCharge
}) => {
  // Group records by date (newest first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (records.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        color: '#555',
        padding: '40px 20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        marginTop: '25px',
        boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.05)'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '15px' }}>📋</div>
        <p style={{ fontSize: '16px', fontWeight: '500' }}>No transaction records found</p>
        <p style={{ fontSize: '14px', color: '#777', marginTop: '10px' }}>
          Add a payment or charge using the buttons below
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '25px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#333' 
        }}>
          Transaction History ({records.length})
        </h3>
        
        <div style={{
          fontSize: '14px',
          color: '#666',
          display: 'flex',
          gap: '15px'
        }}>
          
        </div>
      </div>

      <div style={{
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
        border: '1px solid #eaeaea'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40% 15% 15% 15% 15%',
          backgroundColor: '#f5f5f5',
          padding: '12px 15px',
          borderBottom: '1px solid #eaeaea',
          fontWeight: '600',
          fontSize: '14px',
          color: '#555'
        }}>
          <div>Detail</div>
          <div style={{ textAlign: 'center' }}>Date</div>
          <div style={{ textAlign: 'center' }}>You Gave</div>
          <div style={{ textAlign: 'center' }}>You Got</div>
          <div style={{ textAlign: 'center' }}>Actions</div>
        </div>

        {/* Records */}
        {sortedRecords.map(record => (
          <div 
            key={record.uniqueId}
            style={{
              display: 'grid',
              gridTemplateColumns: '40% 15% 15% 15% 15%',
              borderBottom: '1px solid #eaeaea',
              backgroundColor: record.type === 'charge' ? 'rgba(255, 235, 238, 0.3)' : 'rgba(232, 245, 233, 0.3)',
              transition: 'background-color 0.2s',
              alignItems: 'center',
              padding: '12px 15px',
              position: 'relative'
            }}
          >
            {/* Title and Description */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '4px'
            }}>
              <div style={{ 
                fontWeight: '600', 
                fontSize: '15px', 
                color: '#333' 
              }}>
                {record.title}
              </div>
              {record.description && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#666',
                  maxWidth: '95%',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}>
                  {record.description}
                </div>
              )}
            </div>

            {/* Date */}
            <div style={{ 
              fontSize: '14px', 
              color: '#555',
              textAlign: 'center'
            }}>
              {formatDate(record.date)}
            </div>

            {/* You Gave (Charges) */}
            <div style={{ 
              fontSize: '15px',
              fontWeight: record.type === 'charge' ? '600' : 'normal',
              color: record.type === 'charge' ? '#D32F2F' : '#888',
              textAlign: 'center'
            }}>
              {record.type === 'charge' ? `₹${record.amount}` : '-'}
            </div>

            {/* You Got (Payments) */}
            <div style={{ 
              fontSize: '15px',
              fontWeight: record.type === 'payment' ? '600' : 'normal',
              color: record.type === 'payment' ? '#388E3C' : '#888',
              textAlign: 'center'
            }}>
              {record.type === 'payment' ? `₹${record.amount}` : '-'}
            </div>

            {/* Actions */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '10px' 
            }}>
              <button
                onClick={() => record.type === 'payment' ? onEditPayment(record) : onEditCharge(record)}
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: 'white', 
                  color: '#1D72B8', 
                  border: '1px solid #1D72B8', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#E3F2FD';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Edit
              </button>
              <button
                onClick={() => record.type === 'payment' ? onDeletePayment(record) : onDeleteCharge(record)}
                style={{ 
                  padding: '6px 12px', 
                  backgroundColor: 'white', 
                  color: '#D32F2F', 
                  border: '1px solid #D32F2F', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFEBEE';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

     
    </div>
  );
};

// Main Component
const FeeRecords = () => {
  // State declarations
  // State declarations
const [feeSummary, setFeeSummary] = useState(null);
const [batches, setBatches] = useState([]);
const [students, setStudents] = useState([]);
const [selectedStudent, setSelectedStudent] = useState(null);
const [selectedStudentFees, setSelectedStudentFees] = useState({
  totalFees: 0,
  feesSubmitted: 0,
  remainingFees: 0
});
const [feePaymentRecords, setFeePaymentRecords] = useState([]);
const [otherChargesRecords, setOtherChargesRecords] = useState([]);
const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
const [isChargeModalOpen, setChargeModalOpen] = useState(false);
const [showFeeStatusForm, setShowFeeStatusForm] = useState(false);
const [feeStatusExists, setFeeStatusExists] = useState(false);
const [selectedBatch, setSelectedBatch] = useState(null);
const [searchTerm, setSearchTerm] = useState('');
const [loading, setLoading] = useState(true);
const [isEditPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
const [isEditChargeModalOpen, setEditChargeModalOpen] = useState(false);
const [editingPayment, setEditingPayment] = useState(null);
const [editingCharge, setEditingCharge] = useState(null);
const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
const [recordToDelete, setRecordToDelete] = useState(null);
const [studentSortOption, setStudentSortOption] = useState('dueDate'); // Default sort
const handleStudentSortChange = useCallback((sortType) => {
  setStudentSortOption(sortType);
}, []);

// Form state
const [paymentData, setPaymentData] = useState({ 
  title: '', 
  date: '', 
  amount: '', 
  description: '', // Add description field
  paymentCompleted: false, 
  nextDueDate: '' 
});

const [chargeData, setChargeData] = useState({ 
  title: '', 
  date: '', 
  amount: '',
  description: '' // Add description field
});

const [newFeeStatus, setNewFeeStatus] = useState({
  admissionDate: '',
  totalFees: '',
  feesSubmitted: '0',
  remainingFees: '',
  nextDueDate: '',
  user_id: null,
});

// API Functions
const fetchData = useCallback(async () => {
  try {
    setLoading(true);
    
    // Parallel API requests for better performance
    const [batchesRes, feeSummaryRes] = await Promise.all([
      fetch(`${BASE_URL}/api/batches/all`),
      fetch(`${BASE_URL}/api/feestatus/summary`)
    ]);
    
    if (batchesRes.ok) {
      const batchesData = await batchesRes.json();
      setBatches(batchesData);
    }
    
    if (feeSummaryRes.ok) {
      const summaryData = await feeSummaryRes.json();
      setFeeSummary(summaryData);
    }
  } catch (error) {
    console.error('Error fetching initial data:', error);
  } finally {
    setLoading(false);
  }
}, []);

// First define fetchStudentRecords which doesn't depend on other functions
const fetchStudentRecords = useCallback(async (student) => {
  if (!student || !student.feeStatusId) return;
  
  try {
    const [paymentsRes, chargesRes] = await Promise.all([
      fetch(`${BASE_URL}/api/feepaymentrecords/fee-status/${student.feeStatusId}`),
      fetch(`${BASE_URL}/api/otherchargesrecords/fee-status/${student.feeStatusId}`)
    ]);
    
    if (paymentsRes.ok) {
      const payments = await paymentsRes.json();
      setFeePaymentRecords(payments.map(record => ({ ...record, type: 'payment' })));
    }
    
    if (chargesRes.ok) {
      const charges = await chargesRes.json();
      setOtherChargesRecords(charges.map(record => ({ ...record, type: 'charge' })));
    }
  } catch (error) {
    console.error('Error fetching student records:', error);
  }
}, []);

// Create a function to select a student without dependencies on fetchStudentsByBatch
const selectStudent = useCallback(async (student) => {
  // Save the selected student's ID and batch to localStorage
  localStorage.setItem('lastSelectedStudentId', student.user_id);
  if (selectedBatch) {
    localStorage.setItem('lastSelectedBatchId', selectedBatch);
  }
  
  setSelectedStudent(student);
  
  // Reset the records when a new student is selected
  setFeePaymentRecords([]);
  setOtherChargesRecords([]);
  
  if (!student.feeStatusId) {
    setFeeStatusExists(false);
    //setShowFeeStatusForm(true);
    return;
  }
  
  setFeeStatusExists(true);
  setSelectedStudentFees({
    totalFees: student.totalFees || 0,
    feesSubmitted: student.feesSubmitted || 0,
    remainingFees: student.remainingFees || 0
  });
  
  await fetchStudentRecords(student);
  
  // Reset forms
  setNewFeeStatus({
    admissionDate: '',
    totalFees: student.totalFees || '',
    feesSubmitted: '0',
    remainingFees: student.remainingFees || '',
    nextDueDate: '',
    user_id: student.user_id,
  });
}, [fetchStudentRecords, selectedBatch]);

// Now create handleStudentClick using selectStudent
const handleStudentClick = useCallback((student) => {
  selectStudent(student);
}, [selectStudent]);

// Finally define fetchStudentsByBatch using selectStudent
const fetchStudentsByBatch = useCallback(async (batchId) => {
  if (!batchId) {
    setStudents([]);
    return;
  }
  
  try {
    setLoading(true);
    const response = await fetch(`${BASE_URL}/api/studentBatches/students/batch/${batchId}`);
    
    if (response.ok) {
      const studentsData = await response.json();
      
      // Process all students in parallel for better performance
      const enrichedStudents = await Promise.all(studentsData.map(async (student) => {
        try {
          // Parallel requests for each student
          const [feeResponse, userResponse] = await Promise.all([
            fetch(`${BASE_URL}/api/feestatus/user/${student.user_id}?batch_id=${batchId}`),
            fetch(`${BASE_URL}/api/users/user/${student.user_id}`)
          ]);
          
          let feeData = {};
          let userName = 'Unnamed Student';
          
          if (feeResponse.ok) {
            const feeResult = await feeResponse.json();
            if (Array.isArray(feeResult) && feeResult.length > 0) {
              feeData = feeResult[0];
            }
          }
          
          if (userResponse.ok) {
            const userData = await userResponse.json();
            userName = userData.user?.name || 'Unnamed Student';
          }
          
          return {
            ...student,
            name: userName,
            feeStatusId: feeData.id || null,
            totalFees: feeData.totalFees || 0,
            feesSubmitted: feeData.feesSubmitted || 0,
            remainingFees: feeData.remainingFees || 0,
            nextDueDate: feeData.nextDueDate || null,
            paymentCompleted: feeData.paymentCompleted || false
          };
        } catch (error) {
          console.error(`Error enriching student data for ID: ${student.user_id}`, error);
          return student;
        }
      }));
      
      // Sort by next due date, null dates at the end
      const sortedStudents = enrichedStudents.sort((a, b) => {
        if (a.nextDueDate && b.nextDueDate) {
          return new Date(a.nextDueDate) - new Date(b.nextDueDate);
        }
        return a.nextDueDate ? -1 : 1;
      });
      
      setStudents(sortedStudents);
      
      // Check if we need to restore the previously selected student
      const lastSelectedStudentId = localStorage.getItem('lastSelectedStudentId');
      if (lastSelectedStudentId) {
        const lastStudent = sortedStudents.find(s => s.user_id === lastSelectedStudentId);
        if (lastStudent) {
          selectStudent(lastStudent);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching students:', error);
    setStudents([]);
  } finally {
    setLoading(false);
  }
}, [selectStudent]);
// Add this function to your component
const updateStudentInList = useCallback((updatedStudentData) => {
  if (!updatedStudentData || !updatedStudentData.user_id) return;
  
  setStudents(prevStudents => {
    return prevStudents.map(student => {
      if (student.user_id === updatedStudentData.user_id) {
        // Return the updated student data while preserving any fields
        // that might not be included in the updatedStudentData
        return { ...student, ...updatedStudentData };
      }
      return student;
    });
  });
}, []);
const handleBatchChange = useCallback((event) => {
  const batchId = event.target.value;
  setSelectedBatch(batchId);
  
  // Save the selected batch to localStorage
  localStorage.setItem('lastSelectedBatchId', batchId);
  
  // Clear the selected student when batch changes
  setSelectedStudent(null);
  
  fetchStudentsByBatch(batchId);
}, [fetchStudentsByBatch]);

// Fixed handleAddPayment function
// Improved handleAddPayment with proper state updates for all fee fields
const handleAddPayment = useCallback(async (e) => {
  e.preventDefault();
  
  if (!selectedStudent?.feeStatusId) return;
  
  try {
    const paymentDataToSend = {
      title: paymentData.title,
      date: paymentData.date,
      amount: parseFloat(paymentData.amount) || 0,
      description: paymentData.description || null, // Add description
      isPaid: true,
      feeStatusId: selectedStudent.feeStatusId,
    };
    
    if (!paymentData.paymentCompleted) {
      paymentDataToSend.nextDueDate = paymentData.nextDueDate;
    }
    
    console.log('Sending payment data:', paymentDataToSend); // Debug log
    
    const response = await fetch(`${BASE_URL}/api/feepaymentrecords/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentDataToSend),
    });
    
    if (response.ok) {
      const newRecord = await response.json();
      console.log('Payment record created:', newRecord); // Debug log
      
      // Calculate new values
      const updatedFeesSubmitted = parseFloat(selectedStudentFees.feesSubmitted) + (parseFloat(paymentData.amount) || 0);
      const updatedRemainingFees = parseFloat(selectedStudentFees.totalFees) - updatedFeesSubmitted;
      const paymentCompleted = updatedRemainingFees <= 0;
      
      // Update fee status on server
      const updatedFeeStatus = {
        nextDueDate: paymentCompleted ? null : paymentData.nextDueDate,
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Create a properly formatted payment record
      const formattedRecord = {
        id: newRecord.id || newRecord.payment?.id,
        title: newRecord.title || newRecord.payment?.title || paymentData.title,
        date: newRecord.date || newRecord.payment?.date || paymentData.date,
        amount: parseFloat(newRecord.amount || newRecord.payment?.amount) || parseFloat(paymentData.amount) || 0,
        description: newRecord.description || newRecord.payment?.description || paymentData.description || null,
        type: 'payment',
        uniqueId: `payment-${newRecord.id || newRecord.payment?.id}` 
      };
      
      console.log('Adding payment record to state:', formattedRecord);
      
      // Update local state
      setFeePaymentRecords(prev => [...prev, formattedRecord]);
      
      // Update all fee-related state
      setSelectedStudentFees({
        totalFees: parseFloat(selectedStudentFees.totalFees) || 0,
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        totalFees: parseFloat(selectedStudentFees.totalFees) || 0,
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        nextDueDate: paymentCompleted ? null : paymentData.nextDueDate,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after payment:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Reset form and close modal
      setPaymentData({ 
        title: '', 
        date: '', 
        amount: '', 
        description: '', 
        paymentCompleted: false, 
        nextDueDate: '' 
      });
      setPaymentModalOpen(false);
      
      // Refetch student data to ensure consistency
      if (selectedStudent?.feeStatusId) {
        // Small delay to ensure API operations complete
        setTimeout(() => {
          fetchStudentRecords(updatedStudentData);
        }, 500);
      }
    } else {
      console.error('API error response:', await response.text());
    }
  } catch (error) {
    console.error('Error adding payment:', error);
  } finally {
    // Ensure modal closes even if there's an error
    setPaymentModalOpen(false);
    setPaymentData({ 
      title: '', 
      date: '', 
      amount: '', 
      description: '', 
      paymentCompleted: false, 
      nextDueDate: '' 
    });
  }
}, [selectedStudent, paymentData, selectedStudentFees, fetchStudentRecords, updateStudentInList]);

const handleAddCharge = useCallback(async (e) => {
  e.preventDefault();
  
  if (!selectedStudent?.feeStatusId) return;
  
  try {
    const chargeDataToSend = {
      title: chargeData.title,
      date: chargeData.date,
      amount: parseFloat(chargeData.amount) || 0,
      description: chargeData.description || null,
      feeStatusId: selectedStudent.feeStatusId
    };
    
    console.log('Sending charge data:', chargeDataToSend);
    
    const response = await fetch(`${BASE_URL}/api/otherchargesrecords/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargeDataToSend),
    });
    
    if (response.ok) {
      const newCharge = await response.json();
      console.log('Charge record created:', newCharge);
      
      // Calculate new values
      const updatedTotalFees = parseFloat(selectedStudentFees.totalFees) + (parseFloat(chargeData.amount) || 0);
      const updatedRemainingFees = parseFloat(selectedStudentFees.remainingFees) + (parseFloat(chargeData.amount) || 0);
      const paymentCompleted = updatedRemainingFees <= 0;
      
      // Update fee status on server
      const updatedFeeStatus = {
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Create a properly formatted charge record
      const formattedCharge = {
        id: newCharge.id || newCharge.charge?.id,
        title: newCharge.title || newCharge.charge?.title || chargeData.title,
        date: newCharge.date || newCharge.charge?.date || chargeData.date,
        amount: parseFloat(newCharge.amount || newCharge.charge?.amount) || parseFloat(chargeData.amount) || 0,
        description: newCharge.description || newCharge.charge?.description || chargeData.description || null,
        type: 'charge',
        uniqueId: `charge-${newCharge.id || newCharge.charge?.id}`
      };
      
      console.log('Adding charge record to state:', formattedCharge);
      
      // Update local state
      setOtherChargesRecords(prev => [...prev, formattedCharge]);
      
      // Update all fee-related state
      setSelectedStudentFees({
        totalFees: updatedTotalFees,
        feesSubmitted: parseFloat(selectedStudentFees.feesSubmitted) || 0,
        remainingFees: updatedRemainingFees,
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        nextDueDate: selectedStudent.nextDueDate,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after charge:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Reset form and close modal
      setChargeData({ 
        title: '', 
        date: '', 
        amount: '',
        description: '' 
      });
      setChargeModalOpen(false);
      
      // Refetch student data to ensure consistency
      if (selectedStudent?.feeStatusId) {
        // Small delay to ensure API operations complete
        setTimeout(() => {
          fetchStudentRecords(updatedStudentData);
        }, 500);
      }
    } else {
      console.error('API error response:', await response.text());
    }
  } catch (error) {
    console.error('Error adding charge:', error);
  } finally {
    // Ensure modal closes even if there's an error
    setChargeModalOpen(false);
    setChargeData({ 
      title: '', 
      date: '', 
      amount: '',
      description: '' 
    });
  }
}, [selectedStudent, chargeData, selectedStudentFees, fetchStudentRecords, updateStudentInList]);

const handleSubmitFeeStatus = useCallback(async (e) => {
  e.preventDefault();

  if (!selectedStudent?.user_id) return;

  const total = parseFloat(newFeeStatus.totalFees) || 0;

  try {
    const response = await fetch(`${BASE_URL}/api/feestatus/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        admissionDate: newFeeStatus.admissionDate,
        totalFees: 0,
        feesSubmitted: 0, // force to 0
        remainingFees: 0, // remaining = total
        nextDueDate: null,  // set nextDueDate to null
        user_id: selectedStudent.user_id,
        batch_id: selectedBatch,
      }),
    });

    if (response.ok) {
      const newFeeStatusData = await response.json();

      // Update the selected student with new fee status
      setSelectedStudent({
        ...selectedStudent,
        feeStatusId: newFeeStatusData.id,
        totalFees: newFeeStatusData.totalFees,
        feesSubmitted: newFeeStatusData.feesSubmitted,
        remainingFees: newFeeStatusData.remainingFees,
        nextDueDate: newFeeStatusData.nextDueDate,  // it will be null
      });

      setSelectedStudentFees({
        totalFees: newFeeStatusData.totalFees,
        feesSubmitted: newFeeStatusData.feesSubmitted,
        remainingFees: newFeeStatusData.remainingFees,
      });

      setFeeStatusExists(true);
      setShowFeeStatusForm(false);

      // Refresh student list to reflect changes
      if (selectedBatch) {
        fetchStudentsByBatch(selectedBatch);
      }
    }
  } catch (error) {
    console.error('Error creating fee status:', error);
  }
}, [selectedStudent, newFeeStatus.admissionDate, newFeeStatus.totalFees, newFeeStatus.nextDueDate, selectedBatch, fetchStudentsByBatch]);
const handleEditPayment = useCallback(async (e) => {
  e.preventDefault();
  
  if (!selectedStudent?.feeStatusId || !editingPayment) return;
  
  try {
    console.log('Editing payment:', editingPayment);
    
    // Calculate amount difference
    const originalAmount = parseFloat(editingPayment.originalAmount) || 0;
    const newAmount = parseFloat(editingPayment.amount) || 0;
    const amountDifference = newAmount - originalAmount;
    
    console.log('Payment amount change:', {
      originalAmount,
      newAmount,
      difference: amountDifference
    });
    
    // Prepare data for API
    const paymentData = {
      title: editingPayment.title,
      date: editingPayment.date,
      amount: newAmount,
      description: editingPayment.description || null,
      isPaid: editingPayment.isPaid !== undefined ? editingPayment.isPaid : true,
      feeStatusId: selectedStudent.feeStatusId
    };
    
    // Call API to update payment
    const response = await fetch(`${BASE_URL}/api/feepaymentrecords/${editingPayment.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    if (response.ok) {
      const updatedPayment = await response.json();
      console.log('Payment updated successfully:', updatedPayment);
      
      // Update local payment records
      setFeePaymentRecords(prev => 
        prev.map(record => 
          record.id === editingPayment.id 
            ? {
                ...record, 
                ...paymentData, 
                type: 'payment',
                uniqueId: `payment-${record.id}`
              } 
            : record
        )
      );
      
      // Update fee status values
      // When a payment amount changes:
      // 1. Adjust fees submitted by the difference
      // 2. Adjust remaining fees by the inverse of the difference
      const updatedFeesSubmitted = parseFloat(selectedStudentFees.feesSubmitted) + amountDifference;
      const updatedRemainingFees = parseFloat(selectedStudentFees.totalFees) - updatedFeesSubmitted;
      const paymentCompleted = updatedRemainingFees <= 0;
      
      console.log('Fee calculations after payment edit:', {
        newFeesSubmitted: updatedFeesSubmitted,
        newRemainingFees: updatedRemainingFees,
        paymentCompleted
      });
      
      // Update fee status on server
      const updatedFeeStatus = {
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
        // Don't update nextDueDate here
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Update local state for fee status
      setSelectedStudentFees({
        totalFees: parseFloat(selectedStudentFees.totalFees),
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after payment edit:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Refresh records
      setTimeout(() => {
        fetchStudentRecords(updatedStudentData);
      }, 500);
    } else {
      console.error('API error when updating payment:', await response.text());
    }
  } catch (error) {
    console.error('Error updating payment:', error);
  } finally {
    // Close modal and reset edit state
    setEditingPayment(null);
    setEditPaymentModalOpen(false);
  }
}, [editingPayment, selectedStudent, selectedStudentFees, fetchStudentRecords, updateStudentInList]);

const handleDeletePayment = useCallback(async () => {
  if (!recordToDelete || !selectedStudent?.feeStatusId) {
    setDeleteConfirmModalOpen(false);
    setRecordToDelete(null);
    return;
  }
  
  try {
    console.log('Deleting payment record:', recordToDelete);
    
    const response = await fetch(`${BASE_URL}/api/feepaymentrecords/${recordToDelete.id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      // Calculate new values - when deleting a payment:
      // 1. Decrease fees submitted by the payment amount
      // 2. Increase remaining fees by the payment amount
      const amount = parseFloat(recordToDelete.amount) || 0;
      const updatedFeesSubmitted = parseFloat(selectedStudentFees.feesSubmitted) - amount;
      const updatedRemainingFees = parseFloat(selectedStudentFees.totalFees) - updatedFeesSubmitted;
      const paymentCompleted = updatedRemainingFees <= 0;
      
      console.log('Fee calculations after payment deletion:', {
        originalAmount: amount,
        newFeesSubmitted: updatedFeesSubmitted,
        newRemainingFees: updatedRemainingFees,
        paymentCompleted
      });
      
      // Update fee status on server
      const updatedFeeStatus = {
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
        // Don't update nextDueDate here - it should be set when a payment is made
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Update local payment records
      setFeePaymentRecords(prev => 
        prev.filter(record => record.id !== recordToDelete.id)
      );
      
      // Update local state for fee status
      setSelectedStudentFees({
        totalFees: parseFloat(selectedStudentFees.totalFees),
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        feesSubmitted: updatedFeesSubmitted,
        remainingFees: updatedRemainingFees,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after payment deletion:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Refresh records
      setTimeout(() => {
        fetchStudentRecords(updatedStudentData);
      }, 500);
    } else {
      console.error('API error when deleting payment:', await response.text());
    }
  } catch (error) {
    console.error('Error deleting payment:', error);
  } finally {
    // Close modal and reset delete state
    setDeleteConfirmModalOpen(false);
    setRecordToDelete(null);
  }
}, [recordToDelete, selectedStudent, selectedStudentFees, fetchStudentRecords, updateStudentInList]);

// Delete charge handler
const handleDeleteCharge = useCallback(async () => {
  if (!recordToDelete || !selectedStudent?.feeStatusId) {
    setDeleteConfirmModalOpen(false);
    setRecordToDelete(null);
    return;
  }
  
  try {
    console.log('Deleting charge record:', recordToDelete);
    
    const response = await fetch(`${BASE_URL}/api/otherchargesrecords/${recordToDelete.id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
      // Calculate new values - when deleting a charge:
      // 1. Decrease total fees by the charge amount
      // 2. Decrease remaining fees by the charge amount
      const amount = parseFloat(recordToDelete.amount) || 0;
      const updatedTotalFees = parseFloat(selectedStudentFees.totalFees) - amount;
      const updatedRemainingFees = parseFloat(selectedStudentFees.remainingFees) - amount;
      const paymentCompleted = updatedRemainingFees <= 0;
      
      console.log('Fee calculations after charge deletion:', {
        originalAmount: amount,
        newTotalFees: updatedTotalFees,
        newRemainingFees: updatedRemainingFees,
        paymentCompleted
      });
      
      // Update fee status on server
      const updatedFeeStatus = {
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Update local charge records
      setOtherChargesRecords(prev => 
        prev.filter(record => record.id !== recordToDelete.id)
      );
      
      // Update local state for fee status
      setSelectedStudentFees({
        totalFees: updatedTotalFees,
        feesSubmitted: parseFloat(selectedStudentFees.feesSubmitted),
        remainingFees: updatedRemainingFees
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after charge deletion:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Refresh records
      setTimeout(() => {
        fetchStudentRecords(updatedStudentData);
      }, 500);
    } else {
      console.error('API error when deleting charge:', await response.text());
    }
  } catch (error) {
    console.error('Error deleting charge:', error);
  } finally {
    // Close modal and reset delete state
    setDeleteConfirmModalOpen(false);
    setRecordToDelete(null);
  }
}, [recordToDelete, selectedStudent, selectedStudentFees, fetchStudentRecords, updateStudentInList]);

const handleEditCharge = useCallback(async (e) => {
  e.preventDefault();
  
  if (!selectedStudent?.feeStatusId || !editingCharge) return;
  
  try {
    console.log('Editing charge:', editingCharge);
    
    // Calculate amount difference
    const originalAmount = parseFloat(editingCharge.originalAmount) || 0;
    const newAmount = parseFloat(editingCharge.amount) || 0;
    const amountDifference = newAmount - originalAmount;
    
    console.log('Charge amount change:', {
      originalAmount,
      newAmount,
      difference: amountDifference
    });
    
    // Prepare data for API
    const chargeData = {
      title: editingCharge.title,
      date: editingCharge.date,
      amount: newAmount,
      description: editingCharge.description || null,
      feeStatusId: selectedStudent.feeStatusId
    };
    
    // Call API to update charge
    const response = await fetch(`${BASE_URL}/api/otherchargesrecords/${editingCharge.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chargeData),
    });
    
    if (response.ok) {
      const updatedCharge = await response.json();
      console.log('Charge updated successfully:', updatedCharge);
      
      // Update local charge records
      setOtherChargesRecords(prev => 
        prev.map(record => 
          record.id === editingCharge.id 
            ? {
                ...record, 
                ...chargeData, 
                type: 'charge',
                uniqueId: `charge-${record.id}`
              } 
            : record
        )
      );
      
      // Update fee status values
      // When a charge amount changes:
      // 1. Adjust total fees by the difference
      // 2. Adjust remaining fees by the difference
      const updatedTotalFees = parseFloat(selectedStudentFees.totalFees) + amountDifference;
      const updatedRemainingFees = parseFloat(selectedStudentFees.remainingFees) + amountDifference;
      const paymentCompleted = updatedRemainingFees <= 0;
      
      console.log('Fee calculations after charge edit:', {
        newTotalFees: updatedTotalFees,
        newRemainingFees: updatedRemainingFees,
        paymentCompleted
      });
      
      // Update fee status on server
      const updatedFeeStatus = {
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        paymentCompleted: paymentCompleted,
      };
      
      const feeStatusResponse = await fetch(`${BASE_URL}/api/feestatus/${selectedStudent.feeStatusId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFeeStatus),
      });
      
      // Update local state for fee status
      setSelectedStudentFees({
        totalFees: updatedTotalFees,
        feesSubmitted: parseFloat(selectedStudentFees.feesSubmitted),
        remainingFees: updatedRemainingFees
      });
      
      // Create updated student data object
      const updatedStudentData = {
        ...selectedStudent,
        totalFees: updatedTotalFees,
        remainingFees: updatedRemainingFees,
        paymentCompleted
      };
      
      // Update the selected student
      setSelectedStudent(updatedStudentData);
      
      // Update the student in the sidebar list
      console.log('Updating student in list after charge edit:', updatedStudentData);
      updateStudentInList(updatedStudentData);
      
      // Refresh records
      setTimeout(() => {
        fetchStudentRecords(updatedStudentData);
      }, 500);
    } else {
      console.error('API error when updating charge:', await response.text());
    }
  } catch (error) {
    console.error('Error updating charge:', error);
  } finally {
    // Close modal and reset edit state
    setEditingCharge(null);
    setEditChargeModalOpen(false);
  }
}, [editingCharge, selectedStudent, selectedStudentFees, fetchStudentRecords, updateStudentInList]);
// Calculate derived values
const combinedRecords = useMemo(() => {
  const allRecords = [...feePaymentRecords, ...otherChargesRecords];
  
  // Create a Map to deduplicate by ID and assign uniqueId
  const uniqueRecords = new Map();
  
  allRecords.forEach(record => {
    const key = `${record.type}-${record.id}`;
    // Add uniqueId property
    uniqueRecords.set(key, {
      ...record,
      uniqueId: key
    });
  });
  
  // Convert back to array and sort
  return Array.from(uniqueRecords.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}, [feePaymentRecords, otherChargesRecords]);
// Initial data fetch with localStorage restore
useEffect(() => {
  fetchData().then(() => {
    // After initial data is loaded, check if we had a previously selected batch
    const lastSelectedBatchId = localStorage.getItem('lastSelectedBatchId');
    if (lastSelectedBatchId) {
      setSelectedBatch(lastSelectedBatchId);
      fetchStudentsByBatch(lastSelectedBatchId);
    }
  });
}, [fetchData, fetchStudentsByBatch]);

// Edit payment handler

const confirmDeletePayment = useCallback((payment) => {
  setRecordToDelete({...payment, deleteType: 'payment'});
  setDeleteConfirmModalOpen(true);
}, []);

// Function to confirm deletion of a charge
const confirmDeleteCharge = useCallback((charge) => {
  setRecordToDelete({...charge, deleteType: 'charge'});
  setDeleteConfirmModalOpen(true);
}, []);
const handleDeleteRecord = useCallback(() => {
  if (!recordToDelete) return;
  
  if (recordToDelete.deleteType === 'payment') {
    handleDeletePayment();
  } else if (recordToDelete.deleteType === 'charge') {
    handleDeleteCharge();
  }
}, [recordToDelete, handleDeletePayment, handleDeleteCharge]);
const openEditPaymentModal = useCallback((payment) => {
  // Make a copy with the originalAmount to track changes
  setEditingPayment({
    ...payment,
    originalAmount: payment.amount
  });
  setEditPaymentModalOpen(true);
}, []);

// Function to open the edit charge modal
const openEditChargeModal = useCallback((charge) => {
  // Make a copy with the originalAmount to track changes
  setEditingCharge({
    ...charge,
    originalAmount: charge.amount
  });
  setEditChargeModalOpen(true);
}, []);
// Edit charge handler



const StudentListFilters = ({ onSortChange, currentSort }) => {
  return (
    <div style={{
      marginBottom: '15px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 5px'
      }}>
        <span style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          color: '#555' 
        }}>
          Sort By:
        </span>
        
        <div style={{ 
          display: 'flex',
          alignItems: 'center'
        }}>
          <select
            onChange={(e) => onSortChange(e.target.value)}
            value={currentSort}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ddd',
              fontSize: '13px',
              color: '#555',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            <option value="balance">Highest Balance</option>
            <option value="dueDate">Nearest Due Date</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>
      
      <div style={{
        height: '1px',
        backgroundColor: '#eaeaea',
        margin: '5px 0'
      }}></div>
    </div>
  );
};


// Add this function to sort students
const getSortedStudents = useCallback(() => {
  if (!students || students.length === 0) return [];
  
  const filteredStudents = students.filter(student => 
    student.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Remove duplicates by user_id
  const uniqueStudents = [];
  const seenIds = new Set();
  
  filteredStudents.forEach(student => {
    if (!seenIds.has(student.user_id)) {
      seenIds.add(student.user_id);
      uniqueStudents.push(student);
    }
  });
  
  // Sort the students based on the selected option
  return uniqueStudents.sort((a, b) => {
    if (studentSortOption === 'balance') {
      // Sort by remaining fees (highest first)
      return (parseFloat(b.remainingFees) || 0) - (parseFloat(a.remainingFees) || 0);
    } else if (studentSortOption === 'dueDate') {
      // Sort by next due date (soonest first)
      if (!a.nextDueDate && !b.nextDueDate) return 0;
      if (!a.nextDueDate) return 1; // Put null dates at the end
      if (!b.nextDueDate) return -1;
      return new Date(a.nextDueDate) - new Date(b.nextDueDate);
    } else if (studentSortOption === 'name') {
      // Sort by name alphabetically
      return (a.name || '').localeCompare(b.name || '');
    }
    return 0;
  });
}, [students, searchTerm, studentSortOption]);
// Update remaining fees when total fees or fees submitted change
useEffect(() => {
  const totalFees = parseFloat(newFeeStatus.totalFees) || 0;
  const feesSubmitted = parseFloat(newFeeStatus.feesSubmitted) || 0;
  const remainingFees = totalFees - feesSubmitted;
  setNewFeeStatus(prev => ({ ...prev, remainingFees: remainingFees.toString() }));
}, [newFeeStatus.totalFees, newFeeStatus.feesSubmitted]);
  if (loading && !batches.length) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: '#f9f9f9'
      }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '30px', 
          backgroundColor: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{ color: '#1D72B8' }}>Loading...</h2>
          <p>Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: 'Roboto, Arial, sans-serif', 
      backgroundColor: '#f9f9f9',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{ 
        margin: '0 auto', 
        borderRadius: '12px', 
        backgroundColor: '#fff', 
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          color: '#333', 
          height: 'calc(100vh - 40px)'
        }}>
          {/* Sidebar */}
          <div style={{
  width: '300px',
  borderRight: '1px solid #eaeaea',
  padding: '20px',
  backgroundColor: '#f9fafb',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column'
}}>
  <h2 style={{
    textAlign: 'center',
    color: '#1D72B8',
    fontSize: '18px',
    marginBottom: '15px', // Reduced from 20px
    fontWeight: '500',
  }}>
    Select Course
  </h2>
  
  <select 
    onChange={handleBatchChange} 
    value={selectedBatch || ''}
    style={{
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      marginBottom: '15px', // Reduced from 20px
      fontSize: '14px',
      color: '#555',
      backgroundColor: '#fff',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    }}
  >
    <option value="">Select Course</option>
    {batches.map(batch => (
      <option key={batch.batch_id} value={batch.batch_id}>{batch.batch_name}</option>
    ))}
  </select>

  <h2 style={{
    textAlign: 'center',
    color: '#1D72B8',
    fontSize: '18px',
    marginBottom: '15px',
    marginTop: '0', // Added to ensure no extra space
    fontWeight: '500',
  }}>
    Students
  </h2>
            
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Search by name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  color: '#555',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              />
            </div>
            
            {/* In your sidebar section, after the search input and before the StudentList */}
<StudentListFilters 
  onSortChange={handleStudentSortChange}
  currentSort={studentSortOption}
/>

<StudentList 
  students={getSortedStudents()} // Use sorted students
  onStudentClick={handleStudentClick}
  selectedStudent={selectedStudent}
/>
          </div>

          {/* Main Content */}
          <div style={{ 
            flex: '1', 
            padding: '25px', 
            overflowY: 'auto', 
            backgroundColor: '#fff' 
          }}>
            {selectedStudent ? (
              <div>
                <h2 style={{ 
                  textAlign: 'center', 
                  marginBottom: '25px', 
                  color: '#1D72B8',
                  fontSize: '24px',
                  fontWeight: '500'
                }}>
                  {selectedStudent.name}'s Fee Details
                </h2>

                {!feeStatusExists ? (
                  <div style={{ 
                    textAlign: 'center',
                    padding: '40px 20px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '10px',
                    marginTop: '30px'
                  }}>
                   <p style={{ marginBottom: '20px', fontSize: '16px', color: '#555' }}>
                      No fee record found for this student. Create one to start tracking fees.
                    </p>
                    <button 
                      onClick={() => setShowFeeStatusForm(true)} 
                      style={{ 
                        padding: '12px 24px', 
                        backgroundColor: '#1D72B8', 
                        color: '#fff', 
                        border: 'none', 
                        borderRadius: '6px', 
                        cursor: 'pointer',
                        fontSize: '15px',
                        fontWeight: '500',
                        boxShadow: '0 2px 8px rgba(29, 114, 184, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Create Fee Record
                    </button>
                  </div>
                ) : (
                  <div>
                    <FeeSummaryCards 
                      studentFees={selectedStudentFees}
                      nextDueDate={selectedStudent.nextDueDate}
                      paymentCompleted={selectedStudent.paymentCompleted}
                    />
    <RecordsTable 
      records={combinedRecords}
      onEditPayment={openEditPaymentModal}
      onEditCharge={openEditChargeModal}
      onDeletePayment={confirmDeletePayment}
      onDeleteCharge={confirmDeleteCharge}
    />

    <div style={{ 
      marginTop: '30px', 
      display: 'flex', 
      justifyContent: 'center',
      gap: '20px' 
    }}>
    <button 
    onClick={() => setPaymentModalOpen(true)} 
    style={{ 
      padding: '12px 25px', 
      backgroundColor: '#4CAF50', 
      color: '#fff', 
      border: 'none', 
      borderRadius: '50px', 
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 3px 10px rgba(76, 175, 80, 0.3)',
      transition: 'all 0.2s ease',
      minWidth: '180px',
      justifyContent: 'center'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.backgroundColor = '#43A047';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 5px 15px rgba(76, 175, 80, 0.4)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.backgroundColor = '#4CAF50';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 3px 10px rgba(76, 175, 80, 0.3)';
    }}
    >
   You Got
    </button>
  
    <button 
    onClick={() => setChargeModalOpen(true)} 
    style={{ 
      padding: '12px 25px', 
      backgroundColor: '#F44336', 
      color: '#fff', 
      border: 'none', 
      borderRadius: '50px', 
      cursor: 'pointer',
      fontSize: '15px',
      fontWeight: '500',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 3px 10px rgba(244, 67, 54, 0.3)',
      transition: 'all 0.2s ease',
      minWidth: '180px',
      justifyContent: 'center'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.backgroundColor = '#E53935';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 5px 15px rgba(244, 67, 54, 0.4)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.backgroundColor = '#F44336';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 3px 10px rgba(244, 67, 54, 0.3)';
    }}
    >
    You Gave
    </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '80%',
                padding: '40px',
                textAlign: 'center',
                color: '#666'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f4f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px'
                }}>
                  <span style={{ fontSize: '36px', color: '#1D72B8' }}>👤</span>
                </div>
                <h3 style={{ marginBottom: '10px', color: '#1D72B8', fontWeight: '500' }}>No Student Selected</h3>
                <p>Select a course and then a student from the sidebar to view their fee details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
{/* Edit Payment Modal */}
<Modal 
  isOpen={isEditPaymentModalOpen} 
  onClose={() => {
    setEditPaymentModalOpen(false);
    setEditingPayment(null);
  }}
  title="Edit Payment"
>
  {editingPayment && (
    <form onSubmit={handleEditPayment}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Payment Type
        </label>
        <select
          value={editingPayment.title}
          onChange={(e) => setEditingPayment({ ...editingPayment, title: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            fontSize: '14px' 
          }}
        >
          <option value="">Select Payment Type</option>
          <option value="1st Installment">1st Installment</option>
          <option value="2nd Installment">2nd Installment</option>
          <option value="3rd Installment">3rd Installment</option>
          <option value="4th Installment">4th Installment</option>
          <option value="5th Installment">5th Installment</option>
          <option value="6th Installment">6th Installment</option>
          <option value="Tshirt">Tshirt</option>
          <option value="Laundry">Laundry</option>
          <option value="Hoodies">Hoodies</option>
          <option value="Food">Food</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Payment Date
        </label>
        <input
          type="date"
          value={editingPayment.date}
          onChange={(e) => setEditingPayment({ ...editingPayment, date: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            fontSize: '14px' 
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
    Description (Optional)
  </label>
  <textarea
    value={editingPayment.description || ''}
    onChange={(e) => setEditingPayment({ ...editingPayment, description: e.target.value })}
    style={{ 
      width: '100%', 
      padding: '10px', 
      borderRadius: '6px', 
      border: '1px solid #ddd',
      fontSize: '14px',
      minHeight: '60px',
      resize: 'vertical'
    }}
    placeholder="Enter additional details about this payment"
  />
</div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Amount
        </label>
        <input
          type="number"
          value={editingPayment.amount}
          onChange={(e) => setEditingPayment({ ...editingPayment, amount: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            fontSize: '14px' 
          }}
        />
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '10px',
        marginTop: '20px' 
      }}>
        <button
          type="button"
          onClick={() => {
            setEditPaymentModalOpen(false);
            setEditingPayment(null);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#f5f5f5', 
            color: '#333', 
            border: '1px solid #ddd', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500' 
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1D72B8', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 6px rgba(29, 114, 184, 0.25)' 
          }}
        >
          Update Payment
        </button>
      </div>
    </form>
  )}
</Modal>

{/* Edit Charge Modal */}
<Modal 
  isOpen={isEditChargeModalOpen} 
  onClose={() => {
    setEditChargeModalOpen(false);
    setEditingCharge(null);
  }}
  title="Edit Charge"
>
  {editingCharge && (
    <form onSubmit={handleEditCharge}>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Title
        </label>
        <select
          value={editingCharge.title}
          onChange={(e) => setEditingCharge({ ...editingCharge, title: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd', 
            fontSize: '14px' 
          }}
        >
          <option value="" disabled>Select</option>
          <option value="Admission + Academic Fee">Admission + Academic Fee</option>
          <option value="Food">Food</option>
          <option value="Tshirt">Tshirt</option>
          <option value="Hoodie">Hoodie</option>
          <option value="Laundry">Laundry</option>
        </select>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Date
        </label>
        <input
          type="date"
          value={editingCharge.date}
          onChange={(e) => setEditingCharge({ ...editingCharge, date: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            fontSize: '14px' 
          }}
        />
      </div>
      <div style={{ marginBottom: '15px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
    Description (Optional)
  </label>
  <textarea
    value={editingCharge.description || ''}
    onChange={(e) => setEditingCharge({ ...editingCharge, description: e.target.value })}
    style={{ 
      width: '100%', 
      padding: '10px', 
      borderRadius: '6px', 
      border: '1px solid #ddd',
      fontSize: '14px',
      minHeight: '60px',
      resize: 'vertical'
    }}
    placeholder="Enter additional details about this charge"
  />
</div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Amount
        </label>
        <input
          type="number"
          value={editingCharge.amount}
          onChange={(e) => setEditingCharge({ ...editingCharge, amount: e.target.value })}
          required
          style={{ 
            width: '100%', 
            padding: '10px', 
            borderRadius: '6px', 
            border: '1px solid #ddd',
            fontSize: '14px' 
          }}
        />
      </div>
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '10px',
        marginTop: '20px' 
      }}>
        <button
          type="button"
          onClick={() => {
            setEditChargeModalOpen(false);
            setEditingCharge(null);
          }}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#f5f5f5', 
            color: '#333', 
            border: '1px solid #ddd', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500' 
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#1D72B8', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 6px rgba(29, 114, 184, 0.25)' 
          }}
        >
          Update Charge
        </button>
      </div>
    </form>
  )}
</Modal>
      {/* Payment Modal */}
      <Modal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)}
        title="Add Payment"
      >
        <form onSubmit={handleAddPayment}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Payment Type
            </label>
            <select
              value={paymentData.title}
              onChange={(e) => setPaymentData({ ...paymentData, title: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            >
              <option value="">Select Payment Type</option>
<option value="1st Installment">1st Installment</option>
<option value="2nd Installment">2nd Installment</option>
<option value="3rd Installment">3rd Installment</option>
<option value="4th Installment">4th Installment</option>
<option value="5th Installment">5th Installment</option>
<option value="6th Installment">6th Installment</option>
<option value="Tshirt">Tshirt</option>
<option value="Laundry">Laundry</option>
<option value="Hoodies">Hoodies</option>
<option value="Food">Food</option>

            </select>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Payment Date
            </label>
            <input
              type="date"
              value={paymentData.date}
              onChange={(e) => setPaymentData({ ...paymentData, date: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
    Description (Optional)
  </label>
  <textarea
    value={paymentData.description || ''}
    onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
    style={{ 
      width: '100%', 
      padding: '10px', 
      borderRadius: '6px', 
      border: '1px solid #ddd',
      fontSize: '14px',
      minHeight: '60px',
      resize: 'vertical'
    }}
    placeholder="Enter additional details about this payment"
  />
</div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Amount
            </label>
            <input
              type="number"
              value={paymentData.amount}
              onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500' 
            }}>
              <input
                type="checkbox"
                checked={paymentData.paymentCompleted}
                onChange={(e) => setPaymentData({ ...paymentData, paymentCompleted: e.target.checked })}
                style={{ marginRight: '8px', width: '16px', height: '16px' }}
              />
              Payment Completed
            </label>
          </div>

          {!paymentData.paymentCompleted && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Next Due Date
              </label>
              <input
                type="date"
                value={paymentData.nextDueDate}
                onChange={(e) => setPaymentData({ ...paymentData, nextDueDate: e.target.value })}
                required
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #ddd',
                  fontSize: '14px' 
                }}
              />
            </div>
          )}

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px',
            marginTop: '20px' 
          }}>
            <button
              type="button"
              onClick={() => setPaymentModalOpen(false)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#f5f5f5', 
                color: '#333', 
                border: '1px solid #ddd', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500' 
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1D72B8', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 6px rgba(29, 114, 184, 0.25)' 
              }}
            >
              Add Payment
            </button>
          </div>
        </form>
      </Modal>

      {/* Charge Modal */}
      <Modal 
        isOpen={isChargeModalOpen} 
        onClose={() => setChargeModalOpen(false)}
        title="Add Charge"
      >
        <form onSubmit={handleAddCharge}>
          <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
  Title
</label>
<select
  value={chargeData.title}
  onChange={(e) => setChargeData({ ...chargeData, title: e.target.value })}
  required
  style={{ 
    width: '100%', 
    padding: '10px', 
    borderRadius: '6px', 
    border: '1px solid #ddd', 
    fontSize: '14px' 
  }}
>
  <option value="" disabled>Select</option>
  <option value="Admission + Academic Fee">Admission + Academic Fee</option>
  <option value="Food">Food</option>
  <option value="Tshirt">Tshirt</option>
  <option value="Hoodie">Hoodie</option>
  <option value="Laundry">Laundry</option>
</select>

          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Date
            </label>
            <input
              type="date"
              value={chargeData.date}
              onChange={(e) => setChargeData({ ...chargeData, date: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
    Description (Optional)
  </label>
  <textarea
    value={chargeData.description || ''}
    onChange={(e) => setChargeData({ ...chargeData, description: e.target.value })}
    style={{ 
      width: '100%', 
      padding: '10px', 
      borderRadius: '6px', 
      border: '1px solid #ddd',
      fontSize: '14px',
      minHeight: '60px',
      resize: 'vertical'
    }}
    placeholder="Enter additional details about this charge"
  />
</div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Amount
            </label>
            <input
              type="number"
              value={chargeData.amount}
              onChange={(e) => setChargeData({ ...chargeData, amount: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            />
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px',
            marginTop: '20px' 
          }}>
            <button
              type="button"
              onClick={() => setChargeModalOpen(false)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#f5f5f5', 
                color: '#333', 
                border: '1px solid #ddd', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500' 
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1D72B8', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 6px rgba(29, 114, 184, 0.25)' 
              }}
            >
              Add Charge
            </button>
          </div>
        </form>
      </Modal>

      {/* Fee Status Modal */}
      <Modal 
        isOpen={showFeeStatusForm} 
        onClose={() => setShowFeeStatusForm(false)}
        title="Create Fee Status"
      >
        <form onSubmit={handleSubmitFeeStatus}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
              Admission Date
            </label>
            <input
              type="date"
              value={newFeeStatus.admissionDate}
              onChange={(e) => setNewFeeStatus({ ...newFeeStatus, admissionDate: e.target.value })}
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #ddd',
                fontSize: '14px' 
              }}
            />
          </div>
          
          
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: '10px',
            marginTop: '20px' 
          }}>
            <button
              type="button"
              onClick={() => setShowFeeStatusForm(false)}
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#f5f5f5', 
                color: '#333', 
                border: '1px solid #ddd', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500' 
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#1D72B8', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 2px 6px rgba(29, 114, 184, 0.25)' 
              }}
            >
              Create Fee Status
            </button>
          </div>
        </form>
      </Modal>
      <Modal
  isOpen={deleteConfirmModalOpen}
  onClose={() => {
    setDeleteConfirmModalOpen(false);
    setRecordToDelete(null);
  }}
  title="Confirm Delete"
>
  <div style={{ marginBottom: '20px', textAlign: 'center' }}>
    <p style={{ fontSize: '16px', color: '#333', marginBottom: '15px' }}>
      Are you sure you want to delete this {recordToDelete?.deleteType === 'payment' ? 'payment' : 'charge'} record?
    </p>
    <p style={{ fontSize: '14px', color: '#777' }}>
      <strong>Title:</strong> {recordToDelete?.title}<br />
      <strong>Amount:</strong> ₹{recordToDelete?.amount}<br />
      <strong>Date:</strong> {recordToDelete ? formatDate(recordToDelete.date) : ''}
    </p>
    <p style={{ fontSize: '14px', color: '#D32F2F', marginTop: '15px', fontWeight: '500' }}>
      This action cannot be undone.
    </p>
  </div>
  
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    gap: '15px',
    marginTop: '20px' 
  }}>
    <button
      onClick={() => {
        setDeleteConfirmModalOpen(false);
        setRecordToDelete(null);
      }}
      style={{ 
        padding: '10px 20px', 
        backgroundColor: '#f5f5f5', 
        color: '#333', 
        border: '1px solid #ddd', 
        borderRadius: '6px', 
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500' 
      }}
    >
      Cancel
    </button>
    <button
      onClick={handleDeleteRecord}
      style={{ 
        padding: '10px 20px', 
        backgroundColor: '#D32F2F', 
        color: '#fff', 
        border: 'none', 
        borderRadius: '6px', 
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 6px rgba(211, 47, 47, 0.25)' 
      }}
    >
      Delete
    </button>
  </div>
</Modal>
    </div>
  );
};

export default FeeRecords;