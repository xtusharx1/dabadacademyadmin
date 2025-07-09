import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Mail, Calendar, MapPin, FileText, CreditCard, School, 
  Users, Home, Shield, ArrowLeft, Edit3, Download, Eye, 
  BookOpen, GraduationCap, Heart, Star
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

const ProfileView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState(null);
  const [documentsData, setDocumentsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const BASE_URL = 'https://apistudents.sainikschoolcadet.com/api';

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
      fetchStudentDocuments();
    } else {
      setHasError(true);
      setErrorMessage('No user ID provided in URL');
      setIsLoading(false);
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setHasError(false);
    
    try {
      const url = `${BASE_URL}/users/user/${userId}`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
      } else {
        throw new Error(`Failed to load user details. Status: ${response.status}`);
      }
    } catch (error) {
      setHasError(true);
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentDocuments = async () => {
    try {
      const url = `${BASE_URL}/documents/student-documents/${userId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDocumentsData(data);
      } else if (response.status === 404) {
        setDocumentsData({});
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'Not Available';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const ContactItem = ({ icon: Icon, label, value, color = "text-gray-600" }) => (
    <div className="flex items-center space-x-3 py-3 border-b border-gray-50 last:border-b-0">
      <div className={`p-2 rounded-lg bg-gray-50`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</p>
        <p className="text-sm font-medium text-gray-900 mt-1">{value || 'N/A'}</p>
      </div>
    </div>
  );

// Replace the InfoSection component with this version

const InfoSection = ({ title, icon: Icon, children, color = "bg-blue-500" }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className={`${color} px-6 py-4`}>
        <div className="flex items-center">
          <div className="flex-shrink-0 mr-3">
           
            <h3 className="text-white font-semibold text-lg">{title}</h3>
          </div>
          
        </div>
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );

  const DocumentCard = ({ title, documentKey, icon: Icon, available, url }) => (
    <div className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${
      available 
        ? 'border-green-200 bg-green-50 hover:border-green-300' 
        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-full ${
          available ? 'bg-green-100' : 'bg-gray-100'
        }`}>
          <Icon className={`w-5 h-5 ${
            available ? 'text-green-600' : 'text-gray-400'
          }`} />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${
              available ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            <span className={`text-xs font-medium ${
              available ? 'text-green-700' : 'text-gray-500'
            }`}>
              {available ? 'Available' : 'Not uploaded'}
            </span>
          </div>
        </div>
        {available && url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
            title="View Document"
          >
            <Eye className="w-4 h-4 text-green-600" />
          </a>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  const user = userData.user;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Contact Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 text-center">
                <div className="w-24 h-24 bg-white bg-opacity-20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white border-opacity-30">
                  <span className="text-2xl font-bold text-white">
                    {getInitials(user.name)}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{user.name || 'Student Name'}</h2>
                <p className="text-blue-100 text-sm">{user.present_class || 'Class Not Assigned'}</p>
                <div className="flex items-center justify-center space-x-4 mt-4">
                  <div className="text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto mb-1 ${
                      user.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-xs text-blue-100">{user.status || 'Unknown'}</span>
                  </div>
                  <div className="text-center">
                    <Star className="w-4 h-4 text-yellow-300 mx-auto mb-1" />
                    <span className="text-xs text-blue-100">Student</span>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-blue-500" />
                  Contact Details
                </h3>
                <div className="space-y-1">
                  <ContactItem icon={Mail} label="Email" value={user.email} color="text-blue-500" />
                  <ContactItem icon={Phone} label="Phone" value={user.phone_number} color="text-green-500" />
                  <ContactItem icon={Calendar} label="Date of Birth" value={formatDate(user.date_of_birth)} color="text-purple-500" />
                  <ContactItem icon={User} label="Gender" value={user.gender} color="text-pink-500" />
                  <ContactItem icon={Calendar} label="Admission Date" value={formatDate(user.date_of_admission)} color="text-orange-500" />
                </div>
              </div>

             
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              {/* Academic Information */}
              <InfoSection title="Academic Information" icon={GraduationCap} color="bg-blue-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Current Status</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Present Class</span>
                        <span className="font-medium">{user.present_class || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Fees</span>
                        <span className="font-medium text-green-600">
                          {user.total_course_fees ? `₹${user.total_course_fees}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Previous Education</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        {user.previous_school_info || 'No previous school information available'}
                      </p>
                    </div>
                  </div>
                </div>
              </InfoSection>

              {/* Family Information */}
              <InfoSection title="Family Information" icon={Users} color="bg-green-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Father's Details</h4>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{user.father_name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Aadhar: {user.father_aadhar_number || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Mother's Details</h4>
                      <div className="bg-pink-50 rounded-lg p-4">
                        <p className="font-medium text-gray-900">{user.mother_name || 'N/A'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Aadhar: {user.mother_aadhar_number || 'Not provided'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </InfoSection>

              {/* Address Information */}
              <InfoSection title="Address Information" icon={Home} color="bg-purple-500">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h4 className="font-medium text-gray-900 mb-2">Full Address</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{user.full_address || 'Address not provided'}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">State</h4>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">{user.state || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </InfoSection>

              {/* Registration & Documents */}
              <InfoSection title="Registration & Documents" icon={FileText} color="bg-orange-500">
                <div className="space-y-6">
                  {/* Registration Numbers */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Registration Numbers</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">SRN Number</h5>
                        <p className="font-semibold text-gray-900">
                          {documentsData?.srn_number || 'Not Available'}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-1">PEN Number</h5>
                        <p className="font-semibold text-gray-900">
                          {documentsData?.pen_number || 'Not Available'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Documents Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DocumentCard
                        title="Birth Certificate"
                        documentKey="birth_certificate"
                        icon={FileText}
                        available={!!(documentsData?.birth_certificate)}
                        url={documentsData?.birth_certificate}
                      />
                      <DocumentCard
                        title="Student Aadhaar"
                        documentKey="student_adhaar_card"
                        icon={CreditCard}
                        available={!!(documentsData?.student_adhaar_card)}
                        url={documentsData?.student_adhaar_card}
                      />
                      <DocumentCard
                        title="Father's Aadhaar"
                        documentKey="father_adhaar_card"
                        icon={CreditCard}
                        available={!!(documentsData?.father_adhaar_card)}
                        url={documentsData?.father_adhaar_card}
                      />
                      <DocumentCard
                        title="Mother's Aadhaar"
                        documentKey="mother_adhaar_card"
                        icon={CreditCard}
                        available={!!(documentsData?.mother_adhaar_card)}
                        url={documentsData?.mother_adhaar_card}
                      />
                      <DocumentCard
                        title="Previous Marksheet"
                        documentKey="previous_school_marksheet"
                        icon={BookOpen}
                        available={!!(documentsData?.previous_school_marksheet)}
                        url={documentsData?.previous_school_marksheet}
                      />
                      <DocumentCard
                        title="Leaving Certificate"
                        documentKey="school_leaving_certificate"
                        icon={FileText}
                        available={!!(documentsData?.school_leaving_certificate)}
                        url={documentsData?.school_leaving_certificate}
                      />
                    </div>
                  </div>
                </div>
              </InfoSection>

              {/* Identity Information */}
              <InfoSection title="Identity Information" icon={Shield} color="bg-red-500">
                <div className="bg-red-50 rounded-lg p-6">
                  <h4 className="font-medium text-gray-900 mb-4">Student Aadhar Details</h4>
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <CreditCard className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Aadhar Number</p>
                      <p className="font-semibold text-gray-900 text-lg">
                        {user.child_aadhar_number || 'Not Provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </InfoSection>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;