import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Search, Filter, UserCheck, X } from 'lucide-react';
import axios from 'axios'; // Make sure to install axios: npm install axios

const API_BASE_URL = 'http://localhost:8000'; // Change this to your actual API base URL

const TherapistAppointments = () => {
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [specializations, setSpecializations] = useState([]);
  const [filteredSpecialization, setFilteredSpecialization] = useState('');
  const [filteredLanguage, setFilteredLanguage] = useState('');
  const [userAppointments, setUserAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const navigate = useNavigate();
  
  // For demo purposes - in a real app, get this from authentication context
  const userId = "user123";
  
  useEffect(() => {
    // Fetch therapists on component mount
    fetchTherapists();
    fetchSpecializations();
    fetchUserAppointments();
  }, []);
  
  // Re-fetch therapists when filters change
  useEffect(() => {
    fetchTherapists();
  }, [filteredSpecialization, filteredLanguage]);
  
  const fetchTherapists = async () => {
    setIsLoading(true);
    try {
      let url = `${API_BASE_URL}/therapists/`;
      
      // Add query parameters for filtering
      const params = new URLSearchParams();
      if (filteredSpecialization) {
        params.append('specialization', filteredSpecialization);
      }
      if (filteredLanguage) {
        params.append('language', filteredLanguage);
      }
      
      // Append params to URL if they exist
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await axios.get(url);
      setTherapists(response.data);
    } catch (error) {
      console.error("Error fetching therapists:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
//   const fetchSpecializations = async () => {
//     try {
//       const response = await axios.get(`${API_BASE_URL}/therapists/specializations`);
//       setSpecializations(response.data.specializations);
//     } catch (error) {
//       console.error("Error fetching specializations:", error);
//     }
//   };

// Update in TherapistAppointments.jsx
    const fetchSpecializations = async () => {
        try {
        const response = await axios.get(`${API_BASE_URL}/therapists/specializations`);
        // Make sure we're accessing the correct property from the response
        if (response.data && response.data.specializations) {
            setSpecializations(response.data.specializations);
        } else {
            console.error("Unexpected specializations response format:", response.data);
            setSpecializations([]);
        }
        } catch (error) {
        console.error("Error fetching specializations:", error);
        setSpecializations([]);
        }
    };
  
  const fetchUserAppointments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/therapists/appointments/user/${userId}`);
      setUserAppointments(response.data);
    } catch (error) {
      console.error("Error fetching user appointments:", error);
    }
  };
  
  const handleTherapistSelect = async (therapist) => {
    try {
      setSelectedTherapist(therapist);
      setSelectedSlot(null); // Reset selected slot when selecting a new therapist
      
      const response = await axios.get(`${API_BASE_URL}/therapists/${therapist._id}`);
      const therapistWithAvailability = response.data;
      
      // Sort slots by date/time
      const sortedSlots = therapistWithAvailability.available_slots.sort((a, b) => 
        new Date(a.start_time) - new Date(b.start_time)
      );
      
      setAvailableSlots(sortedSlots);
    } catch (error) {
      console.error("Error fetching therapist details:", error);
    }
  };
  
  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    // Clear any previous booking errors
    setBookingError(null);
  };
  
//   const handleBookAppointment = async () => {
//     if (!selectedTherapist || !selectedSlot) return;
    
//     try {
//       setBookingError(null);
      
//       const appointmentData = {
//         user_id: userId,
//         therapist_id: selectedTherapist._id,
//         date: new Date(selectedSlot.start_time),
//         start_time: new Date(selectedSlot.start_time),
//         end_time: new Date(selectedSlot.end_time),
//         notes: "" // Could add a notes field in the UI for this
//       };
      
//       // Book the appointment
//       await axios.post(`${API_BASE_URL}/therapists/appointments`, appointmentData);
      
//       // Show success message
//       setBookingSuccess(true);
      
//       // Refresh user appointments and reset selection
//       fetchUserAppointments();
//       // Clear the selected therapist after a short delay to allow the user to see the success message
//       setTimeout(() => {
//         fetchTherapists(); // Refresh therapist list to update availability
//         setSelectedTherapist(null);
//         setSelectedSlot(null);
//         setBookingSuccess(false);
//       }, 3000);
//     } catch (error) {
//       console.error("Error booking appointment:", error);
//       setBookingError(error.response?.data?.detail || "Failed to book appointment. Please try again.");
//     }
//   };

    // Update in TherapistAppointments.jsx
// Update in TherapistAppointments.jsx
const handleBookAppointment = async () => {
    if (!selectedTherapist || !selectedSlot) return;
    
    try {
      setBookingError(null);
      
      // Format the date strings properly for the API
      const startTime = new Date(selectedSlot.start_time);
      const endTime = new Date(selectedSlot.end_time);
      
      const appointmentData = {
        user_id: userId,
        therapist_id: selectedTherapist._id,
        date: startTime.toISOString(), // Use ISO string format
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: ""
      };
      
      // Book the appointment
      const response = await axios.post(`${API_BASE_URL}/therapists/appointments`, appointmentData);
      console.log("Appointment booking response:", response.data);
      
      // Show success message
      setBookingSuccess(true);
      
      // Rest of the function remains the same...
    } catch (error) {
      console.error("Error booking appointment:", error);
      setBookingError(error.response?.data?.detail || "Failed to book appointment. Please try again.");
    }
  };
  
  const handleCancelAppointment = async (appointmentId) => {
    try {
      // Cancel the appointment
      await axios.delete(`${API_BASE_URL}/therapists/appointments/${appointmentId}`);
      
      // Refresh the appointments list
      fetchUserAppointments();
      // Refresh therapist list to update availability
      fetchTherapists();
    } catch (error) {
      console.error("Error cancelling appointment:", error);
    }
  };
  
  // Format time in a user-friendly way (e.g., "10:00 AM")
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Format date in a user-friendly way (e.g., "Monday, April 24")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };
  
  // Group available slots by date for better organization
  const groupedSlots = () => {
    const groups = {};
    
    availableSlots.forEach(slot => {
      const date = new Date(slot.start_time);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateDisplay: formatDate(date),
          slots: []
        };
      }
      
      groups[dateKey].slots.push(slot);
    });
    
    return groups;
  };
  
  return (
    <div className="w-full bg-gradient-to-b from-white to-indigo-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-indigo-900 mb-4">Find Your Mental Health Partner</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with professional therapists and schedule sessions to support your mental wellness journey.
          </p>
        </div>
        
        {/* Success message */}
        {bookingSuccess && (
          <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0 text-green-500">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Your appointment has been successfully booked!
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                className="inline-flex text-gray-400 hover:text-gray-500"
                onClick={() => setBookingSuccess(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Error message */}
        {bookingError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <div className="flex-shrink-0 text-red-500">
              <X className="h-5 w-5" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">
                {bookingError}
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                className="inline-flex text-gray-400 hover:text-gray-500"
                onClick={() => setBookingError(null)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Therapist search and list */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-2xl font-semibold text-indigo-900 mb-4">Find a Therapist</h2>
              
              {/* Search and filters */}
              <div className="mb-6">
                <div className="flex flex-wrap gap-4">
                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Specialization
                    </label>
                    <div className="relative">
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        value={filteredSpecialization}
                        onChange={(e) => setFilteredSpecialization(e.target.value)}
                      >
                        <option value="">All Specializations</option>
                        {specializations.map((spec) => (
                          <option key={spec} value={spec}>{spec}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <Filter className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Language
                    </label>
                    <div className="relative">
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                        value={filteredLanguage}
                        onChange={(e) => setFilteredLanguage(e.target.value)}
                      >
                        <option value="">All Languages</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="Mandarin">Mandarin</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Gujarati">Gujarati</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <Filter className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Therapists list */}
              <div className="space-y-6">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-600">Loading therapists...</p>
                  </div>
                ) : therapists.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No therapists found matching your criteria.</p>
                  </div>
                ) : (
                  therapists.map((therapist) => (
                    <div 
                      key={therapist._id}
                      className={`border rounded-lg overflow-hidden transition-all ${
                        selectedTherapist?._id === therapist._id
                          ? 'border-indigo-500 bg-indigo-50 shadow-md'
                          : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30'
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="md:w-1/4 flex-shrink-0">
                            <img 
                              src={therapist.photo_url || "/api/placeholder/150/150"} 
                              alt={therapist.name}
                              className="w-full rounded-lg object-cover aspect-square"
                            />
                          </div>
                          <div className="md:w-3/4">
                            <h3 className="text-xl font-semibold text-indigo-900 mb-2">{therapist.name}</h3>
                            
                            <div className="mb-2 flex flex-wrap gap-2">
                              {therapist.specializations.map((spec, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Experience:</span> {therapist.experience_years} years
                            </p>
                            
                            <p className="text-sm text-gray-600 mb-3">
                              <span className="font-medium">Education:</span> {therapist.education}
                            </p>
                            
                            <p className="text-sm text-gray-600 mb-4">
                              <span className="font-medium">Languages:</span> {therapist.languages.join(", ")}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold text-indigo-600">${therapist.hourly_rate}/hour</p>
                              <button
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md"
                                onClick={() => handleTherapistSelect(therapist)}
                              >
                                View Availability
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {selectedTherapist?._id === therapist._id && (
                        <div className="border-t border-indigo-200 bg-indigo-50 p-6">
                          <h4 className="text-lg font-medium text-indigo-900 mb-4">
                            Available Appointments
                          </h4>
                          
                          {availableSlots.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                              No available appointments found for this therapist.
                            </p>
                          ) : (
                            <div>
                              {/* Group slots by date */}
                              {Object.entries(groupedSlots()).map(([dateKey, group]) => (
                                <div key={dateKey} className="mb-6">
                                  <h5 className="font-medium text-indigo-800 mb-2">{group.dateDisplay}</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {group.slots.map((slot, idx) => (
                                      <button
                                        key={idx}
                                        className={`p-3 border rounded-md text-center transition-colors ${
                                          selectedSlot && 
                                          selectedSlot.start_time === slot.start_time && 
                                          selectedSlot.end_time === slot.end_time
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-indigo-300'
                                        }`}
                                        onClick={() => handleSlotSelect(slot)}
                                      >
                                        <div className="flex items-center justify-center">
                                          <Clock className="h-4 w-4 mr-1" />
                                          <span className="text-sm">
                                            {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                          </span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              
                              {selectedSlot && (
                                <div className="mt-6 text-center">
                                  <button
                                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
                                    onClick={handleBookAppointment}
                                  >
                                    Book Appointment
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {/* Right column - User appointments */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-semibold text-indigo-900 mb-4">Your Appointments</h2>
              
              {userAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">You don't have any appointments scheduled.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userAppointments.map((appointment) => (
                    <div 
                      key={appointment.appointment_id}
                      className={`border rounded-lg p-4 ${
                        appointment.status === 'scheduled' 
                          ? 'border-indigo-200 bg-indigo-50/50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-indigo-900">
                          {appointment.therapist_name}
                        </h3>
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${appointment.status === 'scheduled' 
                              ? 'bg-green-100 text-green-800' 
                              : appointment.status === 'completed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                        >
                          {appointment.status}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          {formatDate(appointment.date)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </div>
                      </div>
                      
                      {appointment.status === 'scheduled' && (
                        <div className="mt-4">
                          <button
                            className="w-full px-3 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-md text-sm"
                            onClick={() => handleCancelAppointment(appointment.appointment_id)}
                          >
                            Cancel Appointment
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="font-medium text-indigo-900 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you need assistance with appointment scheduling or have questions about our therapists, please contact our support team.
                </p>
                <Link
                  to="/contact"
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                >
                  Contact Support
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TherapistAppointments;