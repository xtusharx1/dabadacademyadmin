import { useEffect, useState } from "react";

const TeacherReports = () => {
  const [reports, setReports] = useState([]);
  const [batches, setBatches] = useState({});
  const [subjects, setSubjects] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsPerPage] = useState(50);
  const [selectedBatchId, setSelectedBatchId] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reports, batches, and subjects in parallel
        const [reportsRes, batchesRes, subjectsRes] = await Promise.all([
          fetch("https://apistudents.sainikschoolcadet.com/api/teacher-report/"),
          fetch("https://apistudents.sainikschoolcadet.com/api/batches/"),
          fetch("https://apistudents.sainikschoolcadet.com/api/subjects/")
        ]);

        const reportsData = await reportsRes.json();
        const batchesData = await batchesRes.json();
        const subjectsData = await subjectsRes.json();

        // Map batches and subjects by their IDs
        const batchMap = batchesData.reduce((acc, batch) => {
          acc[batch.batch_id] = batch.batch_name;
          return acc;
        }, {});

        const subjectMap = subjectsData.reduce((acc, subject) => {
          acc[subject.subject_id] = subject.subject_name;
          return acc;
        }, {});

        // Update reports with batch and subject names and sort by date in descending order
        const updatedReports = reportsData.map((report) => ({
          ...report,
          batch_name: batchMap[report.batch_id] || "Unknown",
          subject_name: subjectMap[report.subject_id] || "Unknown",
          status: report.is_teacher_absent ? "Absent" : "Present"
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setReports(updatedReports);
        setBatches(batchMap);
        setSubjects(subjectMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Build filter options
  const batchOptions = [{ id: 'all', name: 'All Batches' }, ...Object.entries(batches).map(([id, name]) => ({ id, name }))];
  const teacherOptions = [{ id: 'all', name: 'All Teachers' }, ...Array.from(new Set(reports.map(r => r.teacher_name))).map(name => ({ id: name, name }))];

  // Apply filters
  const filteredReports = reports.filter(r => {
    const batchOk = selectedBatchId === 'all' || String(r.batch_id) === String(selectedBatchId);
    const teacherOk = selectedTeacher === 'all' || r.teacher_name === selectedTeacher;
    return batchOk && teacherOk;
  });

  // Pagination based on filtered results
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);

  // Calculate total pages
  const totalPages = Math.ceil(filteredReports.length / reportsPerPage) || 1;

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', padding: '20px' }}>
      <div style={{ 
        margin: '0 auto', 
        border: '1px solid #e0e0e0', 
        borderRadius: '8px', 
        backgroundColor: '#fff', 
        padding: '20px', 
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        marginTop: '10px'
      }}>
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold">Teacher Reports</h1>
          <div className="flex items-center gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Batch</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                value={selectedBatchId}
                onChange={(e) => { setSelectedBatchId(e.target.value); setCurrentPage(1); }}
              >
                {batchOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Teacher</label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                value={selectedTeacher}
                onChange={(e) => { setSelectedTeacher(e.target.value); setCurrentPage(1); }}
              >
                {teacherOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-base mt-5 bg-white dark:bg-gray-800 border border-gray-300">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">S.No</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Teacher Name</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Subject</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Batch</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Date & Time</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Chapter Name</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Classwork</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Homework</th>
                <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-300 border border-gray-300">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentReports.map((report, index) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 border border-gray-300">{indexOfFirstReport + index + 1}</td>
                  <td className="px-4 py-3 border border-gray-300">{report.teacher_name}</td>
                  <td className="px-4 py-3 border border-gray-300">{report.subject_name}</td>
                  <td className="px-4 py-3 border border-gray-300">{report.batch_name}</td>
                  <td className="px-4 py-3 border border-gray-300">
                    {`${new Date(report.createdAt).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric'
                    })}, ${new Date(report.createdAt).toLocaleDateString('en-GB', { 
                      weekday: 'long'
                    })} at ${new Date(report.createdAt).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}`}
                  </td>
                  <td className="px-4 py-3 border border-gray-300">{report.chapter_name}</td>
                  <td className="px-4 py-3 border border-gray-300">{report.detailed_description}</td>
                  <td className="px-4 py-3 border border-gray-300">{report.homework_assigned}</td>
                  <td className={`px-4 py-3 border border-gray-300 ${report.is_teacher_absent ? 'text-red-500' : 'text-green-500'}`}>{report.status}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination UI */}
          <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
            <div className="flex items-center">
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">{indexOfFirstReport + 1}</span>
                {' '}-{' '}
                <span className="font-medium">
                  {Math.min(indexOfLastReport, reports.length)}
                </span>
                {' '}of{' '}
                <span className="font-medium">{reports.length}</span>
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
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx + 1}
                  onClick={() => paginate(idx + 1)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === idx + 1
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
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
        </div>
      </div>
    </div>
  );
};

export default TeacherReports;
