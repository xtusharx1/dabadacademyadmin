import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Card, MenuItem, FormControl, Select, InputLabel, AppBar, Toolbar, Container, Box, Chip, Grid, Divider } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonIcon from '@mui/icons-material/Person';

const StudentPerformance = () => {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentDetails, setStudentDetails] = useState(null);
  const [testRecords, setTestRecords] = useState([]);
  const [testStatistics, setTestStatistics] = useState({});
  const [testDetails, setTestDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const fetchBatchDetails = async () => {
      setLoading(true);
      const response = await fetch('https://apistudents.sainikschoolcadet.com/api/batches/');
      if (response.ok) {
        const data = await response.json();
        setBatches(data);
        setLoading(false);
      }
    };

    fetchBatchDetails();
  }, []);

  const handleBatchChange = async (batchId) => {
    setSelectedBatch(batchId);
    setSelectedStudent('');
    setStudents([]);
    setTestRecords([]);
    setStudentDetails(null);
    setTestStatistics({});
    setTestDetails({});

    if (batchId) {
      await fetchStudentsByBatchId(batchId);
    }
  };

  const fetchStudentsByBatchId = async (batchId) => {
    setLoading(true);
    const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/studentBatches/students/batch/${batchId}`);
    if (response.ok) {
      const data = await response.json();
      const studentsWithDetails = await Promise.all(data.map(async (student) => {
        const studentDetails = await fetchStudentDetails(student.user_id);
        return { ...student, ...studentDetails };
      }));
      const sortedStudents = studentsWithDetails.sort((a, b) => a.name.localeCompare(b.name));
      setStudents(sortedStudents);
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (userId) => {
    const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/users/user/${userId}`);
    if (response.ok) {
      return (await response.json()).user;
    }
    return {};
  };

  const handleStudentSelect = async (userId) => {
    setSelectedStudent(userId);
    const student = students.find(student => student.user_id === userId);
    setStudentDetails(student);
    await fetchTestRecords(student.user_id);
  };

  const fetchTestRecords = async (userId) => {
    const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/studenttestrecords/user/${userId}`);
    if (response.ok) {
      const data = await response.json();
      const recordsWithRank = await Promise.all(
        data.map(async (record) => {
          const rank = await fetchRank(record.test_id, userId);
          await fetchTestDetails(record.test_id); // Fetch test details for each test record
          return { ...record, rank };
        })
      );
      // sort by test date descending if available, else by created_at
      const sorted = recordsWithRank.sort((a, b) => {
        const da = new Date((testDetails[a.test_id]?.date) || a.created_at);
        const db = new Date((testDetails[b.test_id]?.date) || b.created_at);
        return db - da;
      });
      setTestRecords(sorted);
      setCurrentPage(1);
      // Fetch statistics for each test record
      recordsWithRank.forEach(record => {
        fetchTestStatistics(record.test_id);
      });
    }
  };

  const fetchTestStatistics = async (testId) => {
    const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/studenttestrecords/statistics/${testId}`);
    if (response.ok) {
      const data = await response.json();
      setTestStatistics(prevStats => ({ ...prevStats, [testId]: data }));
    }
  };

  const fetchTestDetails = async (testId) => {
    const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/test/${testId}`);
    if (response.ok) {
      const data = await response.json();
      setTestDetails(prevDetails => ({ ...prevDetails, [testId]: data }));
    }
  };

  const fetchRank = async (testId, userId) => {
    try {
      const response = await fetch(`https://apistudents.sainikschoolcadet.com/api/studenttestrecords/rank/${testId}/${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.rank;
      }
    } catch (error) {
      console.error('Error fetching rank:', error);
    }
    return null;
  };

  const getPerformanceColor = (marks, totalMarks) => {
    const percentage = (marks / totalMarks) * 100;
    if (percentage >= 80) return '#4caf50'; // Green for excellent
    if (percentage >= 60) return '#2196f3'; // Blue for good
    if (percentage >= 40) return '#ff9800'; // Orange for average
    return '#f44336'; // Red for below average
  };

  // Function to safely format numbers with toFixed
  const formatNumber = (value, decimalPlaces = 1) => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A';
    }
    return typeof value === 'number' ? value.toFixed(decimalPlaces) : value;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const lineChartData = {
    labels: testRecords.map(record => {
      const testDate = testDetails[record.test_id]?.date || new Date(record.created_at).toLocaleDateString();
      const testName = testDetails[record.test_id]?.test_name || `Test ${record.test_id}`;
      return `${testName} (${testDate})`;
    }),
    datasets: [
      {
        label: 'Marks Obtained (%)',
        data: testRecords.map(record => {
          const totalMarks = testDetails[record.test_id]?.total_marks || 100;
          return (record.marks_obtained / totalMarks) * 100;
        }),
        fill: false,
        backgroundColor: '#3f51b5',
        borderColor: '#3f51b5',
        tension: 0.1
      },
      {
        label: 'Class Average (%)',
        data: testRecords.map(record => {
          const totalMarks = testDetails[record.test_id]?.total_marks || 100;
          const avgMarks = testStatistics[record.test_id]?.average_marks || 0;
          return (avgMarks / totalMarks) * 100;
        }),
        fill: false,
        backgroundColor: '#f44336',
        borderColor: '#f44336',
        tension: 0.1,
        borderDash: [5, 5]
      }
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Percentage (%)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Tests'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw.toFixed(2)}%`;
          }
        }
      }
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      
      <Container maxWidth={false} sx={{ py: 3 }}>
        <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
          <TrendingUpIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Academic Performance Analysis
        </Typography>

        <Card sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom sx={{  fontWeight: 'bold'}}>
            Select Batch:
          </Typography>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="batch-select-label">Batch</InputLabel>
            <Select
              labelId="batch-select-label"
              value={selectedBatch}
              onChange={(e) => handleBatchChange(e.target.value)}
              label="Batch"
            >
              {batches.map(batch => (
                <MenuItem key={batch.batch_id} value={batch.batch_id}>
                  {batch.batch_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Card>

        {selectedBatch && (
          <Card sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{  fontWeight: 'bold'}}>
              Select Student:
            </Typography>
            <FormControl fullWidth variant="outlined">
              <InputLabel id="student-select-label">Student</InputLabel>
              <Select
                labelId="student-select-label"
                value={selectedStudent}
                onChange={(e) => handleStudentSelect(e.target.value)}
                label="Student"
              >
                {students.map(student => (
                  <MenuItem key={student.user_id} value={student.user_id}>
                    {student.name} (Admission No.: {student.user_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Card>
        )}

        {studentDetails && (
          <Card sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PersonIcon sx={{ fontSize: 40, mr: 2 }} />
              <Typography variant="h5" sx={{  fontWeight: 'bold'}}>
                Student Details
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, borderLeft: '4px solid #1a237e', backgroundColor: '#f0f0f0', borderRadius: '0 4px 4px 0' }}>
                  <Typography variant="subtitle2" color="textSecondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{studentDetails.name}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, borderLeft: '4px solid #1a237e', backgroundColor: '#f0f0f0', borderRadius: '0 4px 4px 0' }}>
                  <Typography variant="subtitle2" color="textSecondary">Phone Number</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{studentDetails.phone_number}</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, borderLeft: '4px solid #1a237e', backgroundColor: '#f0f0f0', borderRadius: '0 4px 4px 0' }}>
                  <Typography variant="subtitle2" color="textSecondary">Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{studentDetails.email}</Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        )}

        {testRecords.length > 0 && (
          <Card sx={{ mb: 3, p: 3, boxShadow: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom sx={{  fontWeight: 'bold'}}>
              Performance Analysis for {studentDetails?.name}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Box sx={{ height: '400px', mb: 4 }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </Box>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mt: 4 }}>
              Detailed Test Records
            </Typography>
            <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2, overflow: 'hidden' }}>
              <Table>
              <TableHead>
              <TableRow className="bg-gray-200 dark:bg-gray-700">

    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">S.No</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Test ID</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Test Name</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Subject</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Date</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Marks Obtained</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Total Marks</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Percentage</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Highest</TableCell>
    <TableCell className="px-4 py-3 text-left text-white font-bold border border-gray-300">Rank</TableCell>
  </TableRow>
</TableHead>

                <TableBody>
                  {testRecords.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((record, idx) => {
                    const index = (currentPage - 1) * rowsPerPage + idx;
                    const totalMarks = testDetails[record.test_id]?.total_marks || 100;
                    const percentage = (record.marks_obtained / totalMarks) * 100;
                    const averageMarks = testStatistics[record.test_id]?.average_marks;
                    
                    return (
                      <TableRow 
                        key={record.record_id} 
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },
                          '&:hover': { backgroundColor: '#f0f0f0' }
                        }}
                      >
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{record.test_id}</TableCell>
                        <TableCell sx={{ fontWeight: 'medium' }}>{testDetails[record.test_id]?.test_name}</TableCell>
                        <TableCell>{testDetails[record.test_id]?.subject}</TableCell>
                        <TableCell>{testDetails[record.test_id]?.date}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{record.marks_obtained}</TableCell>
                        <TableCell>{totalMarks}</TableCell>
                        <TableCell>
                          <Chip 
                            label={`${formatNumber(percentage)}%`} 
                            sx={{ 
                              backgroundColor: getPerformanceColor(record.marks_obtained, totalMarks),
                              color: 'white',
                              fontWeight: 'bold'
                            }} 
                          />
                        </TableCell>
                        <TableCell>{testStatistics[record.test_id]?.highest_marks || 'N/A'}</TableCell>
                        <TableCell>
                          {record.rank ? 
                            <Chip 
                              label={`#${record.rank}`} 
                              sx={{ 
                                backgroundColor: record.rank <= 3 ? '#4caf50' : '#1a237e',
                                color: 'white',
                                fontWeight: 'bold'
                              }} 
                            /> : 'N/A'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            {/* Pagination Controls */}
            {testRecords.length > rowsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                <Typography variant="body2">
                  Showing {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, testRecords.length)} of {testRecords.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, Math.ceil(testRecords.length / rowsPerPage)) }).map((_, idx) => {
                    const totalPages = Math.ceil(testRecords.length / rowsPerPage);
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
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(Math.ceil(testRecords.length / rowsPerPage), currentPage + 1))}
                    disabled={currentPage === Math.ceil(testRecords.length / rowsPerPage)}
                    className={`px-3 py-1 rounded-md ${currentPage === Math.ceil(testRecords.length / rowsPerPage) ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                  >
                    Next
                  </button>
                  <select
                    className="border border-gray-300 rounded-md px-2 py-1 text-sm bg-white"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setCurrentPage(1); }}
                  >
                    {[10, 20, 50].map(sz => (
                      <option key={sz} value={sz}>{sz} / page</option>
                    ))}
                  </select>
                </Box>
              </Box>
            )}
          </Card>
        )}
      </Container>
    </Box>
  );
};

export default StudentPerformance;