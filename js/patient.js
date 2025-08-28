/**
 * MediCare+ Hospital Management System - Patient Module
 * Handles patient-specific functionality and dashboard
 */

// Patient module state
const PatientModule = {
    appointments: [],
    prescriptions: [],
    reports: [],
    isLoading: false
};

// Mock doctors data
const mockDoctors = [
    { id: 'doc_001', name: 'Dr. Sarah Johnson', specialization: 'cardiology', experience: 12, rating: 4.8 },
    { id: 'doc_002', name: 'Dr. Michael Chen', specialization: 'neurology', experience: 8, rating: 4.6 },
    { id: 'doc_003', name: 'Dr. Emily Davis', specialization: 'orthopedics', experience: 15, rating: 4.9 },
    { id: 'doc_004', name: 'Dr. James Wilson', specialization: 'dermatology', experience: 10, rating: 4.7 },
    { id: 'doc_005', name: 'Dr. Lisa Thompson', specialization: 'pediatrics', experience: 12, rating: 4.8 },
    { id: 'doc_006', name: 'Dr. Robert Brown', specialization: 'general', experience: 20, rating: 4.5 }
];

// Time slots for appointments
const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
];

/**
 * Initialize patient module
 */
$(document).ready(function() {
    if (App.currentUser && App.currentUser.role === 'patient') {
        initializePatientModule();
    }
});

function initializePatientModule() {
    loadPatientData();
    setupPatientEventListeners();
    
    console.log('Patient module initialized');
}

/**
 * Setup event listeners for patient functionality
 */
function setupPatientEventListeners() {
    // Appointment booking modal
    $('#appointmentSpecialization').on('change', loadDoctorsBySpecialization);
    $('#appointmentDoctor').on('change', loadAvailableTimeSlots);
    $('#appointmentDate').on('change', loadAvailableTimeSlots);
    
    // Profile form submission
    $('#profileForm').on('submit', savePatientProfile);
    
    // Symptom form submission
    $('#symptomForm').on('submit', analyzeSymptoms);
    
    // Medical image upload
    $('#medicalImage').on('change', analyzeMedicalImage);
    
    // Profile image upload
    $('#profileImageInput').on('change', updatePatientProfileImage);
}

/**
 * Load patient dashboard
 */
function loadPatientDashboard() {
    if (!App.currentUser || App.currentUser.role !== 'patient') return;
    
    loadPatientOverview();
    loadPatientProfile();
}

/**
 * Load patient overview data
 */
function loadPatientOverview() {
    // Load appointments
    PatientModule.appointments = loadFromStorage('patient_appointments') || [];
    
    // Load prescriptions
    PatientModule.prescriptions = loadFromStorage('patient_prescriptions') || [];
    
    // Load reports
    PatientModule.reports = loadFromStorage('patient_reports') || [];
    
    // Update stats
    updatePatientStats();
    
    // Load recent activity
    loadRecentActivity();
}

/**
 * Update patient statistics
 */
function updatePatientStats() {
    const today = new Date().toDateString();
    const upcomingAppointments = PatientModule.appointments.filter(apt => 
        new Date(apt.date).toDateString() >= today && apt.status === 'scheduled'
    ).length;
    
    const activePrescriptions = PatientModule.prescriptions.filter(presc => 
        presc.status === 'active'
    ).length;
    
    const lastVisit = PatientModule.appointments
        .filter(apt => apt.status === 'completed')
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    $('#upcomingAppointments').text(upcomingAppointments);
    $('#activePrescriptions').text(activePrescriptions);
    $('#medicalReports').text(PatientModule.reports.length);
    $('#lastVisit').text(lastVisit ? formatDate(lastVisit.date) : 'Never');
}

/**
 * Load recent activity
 */
function loadRecentActivity() {
    const activities = [];
    
    // Add recent appointments
    PatientModule.appointments
        .slice(0, 3)
        .forEach(apt => {
            activities.push({
                type: 'appointment',
                message: `Appointment with ${apt.doctorName} on ${formatDate(apt.date)}`,
                date: apt.date
            });
        });
    
    // Add recent prescriptions
    PatientModule.prescriptions
        .slice(0, 2)
        .forEach(presc => {
            activities.push({
                type: 'prescription',
                message: `New prescription: ${presc.diagnosis}`,
                date: presc.date
            });
        });
    
    // Sort by date
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const activityHtml = activities.length > 0 
        ? activities.map(activity => 
            `<div class="mb-2">
                <small class="text-white-50">${formatDate(activity.date)}</small><br>
                <span class="text-white">${activity.message}</span>
            </div>`
          ).join('')
        : '<p class="text-white-50">No recent activity to display.</p>';
    
    $('#recentActivity').html(activityHtml);
}

/**
 * Load patient appointments
 */
function loadPatientAppointments() {
    const appointments = PatientModule.appointments;
    const tbody = $('#appointmentsTableBody');
    
    if (appointments.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted">No appointments found. Book your first appointment!</td></tr>');
        return;
    }
    
    const appointmentRows = appointments.map(appointment => `
        <tr>
            <td>${formatDateTime(appointment.date)}</td>
            <td>${appointment.doctorName}</td>
            <td>${appointment.specialization}</td>
            <td><span class="status-badge status-${appointment.status}">${appointment.status}</span></td>
            <td>
                ${appointment.status === 'scheduled' ? 
                    `<button class="btn btn-sm btn-outline-danger" onclick="cancelAppointment('${appointment.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>` : 
                    `<button class="btn btn-sm btn-outline-info" onclick="viewAppointmentDetails('${appointment.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>`
                }
            </td>
        </tr>
    `).join('');
    
    tbody.html(appointmentRows);
}

/**
 * Show book appointment modal
 */
function showBookAppointmentModal() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    $('#appointmentDate').attr('min', today);
    
    // Reset form
    $('#bookAppointmentForm')[0].reset();
    $('#appointmentDoctor').empty().append('<option value="">Select Doctor</option>');
    $('#appointmentTime').empty().append('<option value="">Select Time Slot</option>');
    
    // Show modal
    $('#bookAppointmentModal').modal('show');
}

/**
 * Load doctors by specialization
 */
function loadDoctorsBySpecialization() {
    const specialization = $('#appointmentSpecialization').val();
    const doctorSelect = $('#appointmentDoctor');
    
    doctorSelect.empty().append('<option value="">Select Doctor</option>');
    
    if (!specialization) return;
    
    const filteredDoctors = mockDoctors.filter(doctor => 
        doctor.specialization === specialization
    );
    
    filteredDoctors.forEach(doctor => {
        doctorSelect.append(`
            <option value="${doctor.id}" data-name="${doctor.name}">
                ${doctor.name} (${doctor.experience} years, ⭐ ${doctor.rating})
            </option>
        `);
    });
}

/**
 * Load available time slots
 */
function loadAvailableTimeSlots() {
    const doctor = $('#appointmentDoctor').val();
    const date = $('#appointmentDate').val();
    const timeSelect = $('#appointmentTime');
    
    timeSelect.empty().append('<option value="">Select Time Slot</option>');
    
    if (!doctor || !date) return;
    
    // Simulate some slots being taken
    const takenSlots = ['10:00', '14:30', '16:00']; // Mock taken slots
    
    timeSlots.forEach(slot => {
        if (!takenSlots.includes(slot)) {
            timeSelect.append(`<option value="${slot}">${slot}</option>`);
        }
    });
}

/**
 * Confirm appointment booking
 */
function confirmAppointment() {
    const formData = {
        specialization: $('#appointmentSpecialization').val(),
        doctorId: $('#appointmentDoctor').val(),
        doctorName: $('#appointmentDoctor option:selected').data('name'),
        date: $('#appointmentDate').val(),
        time: $('#appointmentTime').val(),
        complaint: $('#appointmentComplaint').val(),
        urgent: $('#urgentAppointment').is(':checked')
    };
    
    // Validate form
    if (!formData.specialization || !formData.doctorId || !formData.date || !formData.time || !formData.complaint) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Create appointment object
    const appointment = {
        id: generateId(),
        patientId: App.currentUser.id,
        patientName: `${App.currentUser.firstName} ${App.currentUser.lastName}`,
        doctorId: formData.doctorId,
        doctorName: formData.doctorName,
        specialization: formData.specialization,
        date: `${formData.date}T${formData.time}:00`,
        complaint: formData.complaint,
        status: 'scheduled',
        urgent: formData.urgent,
        createdAt: new Date().toISOString()
    };
    
    // Add to appointments
    PatientModule.appointments.unshift(appointment);
    saveToStorage('patient_appointments', PatientModule.appointments);
    
    // Add to doctor's queue
    const doctorQueue = loadFromStorage('doctor_queue') || [];
    doctorQueue.push({
        ...appointment,
        priority: formData.urgent ? 'high' : 'medium'
    });
    saveToStorage('doctor_queue', doctorQueue);
    
    // Close modal
    $('#bookAppointmentModal').modal('hide');
    
    // Show success message
    showAlert(`Appointment booked successfully with ${formData.doctorName} on ${formatDateTime(appointment.date)}`, 'success');
    
    // Add notification
    addNotification('Appointment Booked', `Appointment with ${formData.doctorName}`, 'success');
    
    // Refresh appointments if on appointments page
    if ($('#patient-appointments').hasClass('active')) {
        loadPatientAppointments();
    }
    
    // Update overview stats
    updatePatientStats();
}

/**
 * Cancel appointment
 */
function cancelAppointment(appointmentId) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    
    const appointmentIndex = PatientModule.appointments.findIndex(apt => apt.id === appointmentId);
    if (appointmentIndex !== -1) {
        PatientModule.appointments[appointmentIndex].status = 'cancelled';
        saveToStorage('patient_appointments', PatientModule.appointments);
        
        showAlert('Appointment cancelled successfully.', 'info');
        loadPatientAppointments();
        updatePatientStats();
        
        addNotification('Appointment Cancelled', 'Your appointment has been cancelled', 'info');
    }
}

/**
 * Load patient prescriptions
 */
function loadPatientPrescriptions() {
    const prescriptions = PatientModule.prescriptions;
    const container = $('#prescriptionsList');
    
    if (prescriptions.length === 0) {
        container.html('<div class="col-12 text-center text-muted">No prescriptions found.</div>');
        return;
    }
    
    const prescriptionCards = prescriptions.map(prescription => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="prescription-card">
                <div class="prescription-header">
                    <h5 class="mb-1">${prescription.diagnosis}</h5>
                    <div class="prescription-date">${formatDate(prescription.date)}</div>
                    <div class="prescription-doctor">${prescription.doctorName || 'AI Suggested'}</div>
                </div>
                <div class="prescription-body">
                    <h6>Medications:</h6>
                    <p class="mb-2">${prescription.medications}</p>
                    ${prescription.instructions ? `
                        <h6>Instructions:</h6>
                        <p class="mb-2">${prescription.instructions}</p>
                    ` : ''}
                    <span class="status-badge status-${prescription.status}">${prescription.status}</span>
                </div>
                <div class="prescription-footer mt-3">
                    <button class="btn btn-sm btn-primary" onclick="downloadPrescription('${prescription.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    ${prescription.status === 'active' ? `
                        <button class="btn btn-sm btn-outline-secondary ms-2" onclick="markPrescriptionCompleted('${prescription.id}')">
                            <i class="fas fa-check"></i> Mark Complete
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
    
    container.html(prescriptionCards);
}

/**
 * Load patient reports
 */
function loadPatientReports() {
    const reports = PatientModule.reports;
    const container = $('#reportsList');
    
    if (reports.length === 0) {
        container.html('<div class="col-12 text-center text-muted">No medical reports uploaded yet.</div>');
        return;
    }
    
    const reportCards = reports.map(report => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="report-card">
                ${report.type === 'image' ? `
                    <img src="${report.preview}" alt="${report.title}">
                ` : `
                    <div class="report-placeholder d-flex align-items-center justify-content-center" style="height: 200px; background: #f8f9fa;">
                        <i class="fas fa-file-medical fa-3x text-muted"></i>
                    </div>
                `}
                <div class="report-card-body">
                    <h6>${report.title}</h6>
                    <span class="report-type">${report.reportType}</span>
                    <p class="text-muted mt-2">${formatDate(report.date)}</p>
                    ${report.notes ? `<p class="small">${report.notes}</p>` : ''}
                    <button class="btn btn-sm btn-primary" onclick="viewReport('${report.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary ms-2" onclick="downloadReport('${report.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    container.html(reportCards);
}

/**
 * Show upload report modal
 */
function showUploadReportModal() {
    $('#uploadReportModal').modal('show');
}

/**
 * Upload report
 */
function uploadReport() {
    const title = $('#reportTitle').val();
    const type = $('#reportType').val();
    const date = $('#reportDate').val();
    const file = $('#reportFile')[0].files[0];
    const notes = $('#reportNotes').val();
    
    if (!title || !type || !date || !file) {
        showAlert('Please fill in all required fields and select a file.', 'warning');
        return;
    }
    
    // Create file reader for preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const report = {
            id: generateId(),
            title,
            reportType: type,
            date,
            notes,
            fileName: file.name,
            fileSize: file.size,
            type: file.type.startsWith('image/') ? 'image' : 'document',
            preview: file.type.startsWith('image/') ? e.target.result : null,
            uploadDate: new Date().toISOString()
        };
        
        PatientModule.reports.unshift(report);
        saveToStorage('patient_reports', PatientModule.reports);
        
        $('#uploadReportModal').modal('hide');
        $('#uploadReportForm')[0].reset();
        
        showAlert('Medical report uploaded successfully!', 'success');
        
        if ($('#patient-reports').hasClass('active')) {
            loadPatientReports();
        }
        
        updatePatientStats();
        addNotification('Report Uploaded', `${title} uploaded successfully`, 'success');
    };
    
    reader.readAsDataURL(file);
}

/**
 * Load patient profile
 */
function loadPatientProfile() {
    if (!App.currentUser) return;
    
    const user = App.currentUser;
    
    // Update profile display
    $('#profileName').text(`${user.firstName} ${user.lastName}`);
    $('#profileRole').text(user.role.charAt(0).toUpperCase() + user.role.slice(1));
    
    // Fill form fields
    $('#profileFirstName').val(user.firstName || '');
    $('#profileLastName').val(user.lastName || '');
    $('#profileEmail').val(user.email || '');
    $('#profilePhone').val(user.phone || '');
    $('#profileAge').val(user.age || '');
    $('#profileGender').val(user.gender || '');
    $('#profileBloodGroup').val(user.bloodGroup || '');
    $('#profileAllergies').val(user.allergies || '');
    $('#profileMedications').val(user.currentMedications || '');
}

/**
 * Save patient profile
 */
function savePatientProfile(e) {
    e.preventDefault();
    
    const profileData = {
        firstName: $('#profileFirstName').val(),
        lastName: $('#profileLastName').val(),
        email: $('#profileEmail').val(),
        phone: $('#profilePhone').val(),
        age: parseInt($('#profileAge').val()) || null,
        gender: $('#profileGender').val(),
        bloodGroup: $('#profileBloodGroup').val(),
        allergies: $('#profileAllergies').val(),
        currentMedications: $('#profileMedications').val()
    };
    
    // Update current user
    Object.assign(App.currentUser, profileData);
    
    // Save to storage
    localStorage.setItem('medicare_user', JSON.stringify(App.currentUser));
    
    // Update display
    $('#profileName').text(`${profileData.firstName} ${profileData.lastName}`);
    
    showAlert('Profile updated successfully!', 'success');
    addNotification('Profile Updated', 'Your profile has been updated', 'info');
}

/**
 * Update patient profile image
 */
function updatePatientProfileImage(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageSrc = e.target.result;
            $('#profileAvatar').html(`<img src="${imageSrc}" alt="Profile">`);
            
            // Save to user data
            App.currentUser.profileImage = imageSrc;
            localStorage.setItem('medicare_user', JSON.stringify(App.currentUser));
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Analyze symptoms (AI mock)
 */
function analyzeSymptoms(e) {
    e.preventDefault();
    
    const symptoms = $('#symptoms').val();
    if (!symptoms.trim()) {
        showAlert('Please describe your symptoms.', 'warning');
        return;
    }
    
    // Show loading
    const submitBtn = $('#symptomForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="loading-spinner"></span> Analyzing...').prop('disabled', true);
    
    // Mock AI analysis
    setTimeout(() => {
        const aiResult = generateSymptomAnalysis(symptoms);
        displayAIResults(aiResult);
        
        submitBtn.html(originalText).prop('disabled', false);
        
        addNotification('AI Analysis Complete', 'Symptom analysis completed', 'info');
    }, 2000);
}

/**
 * Analyze medical image (AI mock)
 */
function analyzeMedicalImage(e) {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) {
        showAlert('Please select a valid image file.', 'warning');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#imageAnalysisResult').html(`
            <div class="text-center">
                <img src="${e.target.result}" alt="Medical Image" class="img-thumbnail mb-3" style="max-width: 200px;">
                <div class="loading-spinner"></div>
                <p class="text-white">Analyzing image...</p>
            </div>
        `).show();
        
        // Mock AI analysis
        setTimeout(() => {
            const aiResult = generateImageAnalysis();
            $('#imageAnalysisResult').html(`
                <div class="ai-result">
                    <h5><i class="fas fa-brain me-2"></i>AI Analysis Results</h5>
                    <div class="ai-confidence mb-3">
                        <strong>Confidence Level: ${aiResult.confidence}%</strong>
                    </div>
                    <div class="ai-suggestion">
                        <h6>Findings:</h6>
                        <p>${aiResult.findings}</p>
                        <h6>Recommendation:</h6>
                        <p>${aiResult.recommendation}</p>
                        <small class="text-white-50">Note: This is an AI analysis. Please consult with a doctor for proper diagnosis.</small>
                    </div>
                </div>
            `);
            
            addNotification('Image Analysis Complete', 'Medical image analysis completed', 'info');
        }, 3000);
    };
    
    reader.readAsDataURL(file);
}

/**
 * Generate mock symptom analysis
 */
function generateSymptomAnalysis(symptoms) {
    const mockAnalyses = [
        {
            condition: 'Common Cold',
            probability: 75,
            urgency: 'Low',
            recommendations: [
                'Rest and hydration',
                'Over-the-counter pain relievers',
                'Consult doctor if symptoms worsen'
            ],
            consultSpecialist: 'General Practitioner'
        },
        {
            condition: 'Migraine',
            probability: 68,
            urgency: 'Medium',
            recommendations: [
                'Rest in a dark, quiet room',
                'Apply cold compress',
                'Consider prescribed medication'
            ],
            consultSpecialist: 'Neurologist'
        },
        {
            condition: 'Allergic Reaction',
            probability: 45,
            urgency: 'Medium',
            recommendations: [
                'Identify and avoid triggers',
                'Antihistamine medication',
                'Monitor for severe reactions'
            ],
            consultSpecialist: 'Allergist'
        }
    ];
    
    return mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
}

/**
 * Generate mock image analysis
 */
function generateImageAnalysis() {
    const mockAnalyses = [
        {
            findings: 'No significant abnormalities detected in the uploaded image.',
            confidence: 89,
            recommendation: 'Continue regular monitoring. Consult with your doctor for routine follow-up.'
        },
        {
            findings: 'Minor irregularities observed that may require further examination.',
            confidence: 72,
            recommendation: 'Schedule an appointment with a specialist for detailed evaluation.'
        },
        {
            findings: 'Image quality is sufficient for preliminary analysis.',
            confidence: 81,
            recommendation: 'Results look normal, but professional medical review is recommended.'
        }
    ];
    
    return mockAnalyses[Math.floor(Math.random() * mockAnalyses.length)];
}

/**
 * Display AI results
 */
function displayAIResults(result) {
    const urgencyClass = result.urgency === 'High' ? 'danger' : result.urgency === 'Medium' ? 'warning' : 'success';
    
    $('#aiResults').html(`
        <div class="ai-result">
            <h5><i class="fas fa-brain me-2"></i>AI Health Assessment</h5>
            <div class="row">
                <div class="col-md-6">
                    <div class="ai-confidence mb-3">
                        <strong>Most Likely Condition:</strong><br>
                        ${result.condition} (${result.probability}% probability)
                    </div>
                    <div class="ai-suggestion">
                        <span class="badge bg-${urgencyClass}">${result.urgency} Priority</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <h6>Recommendations:</h6>
                    <ul class="mb-2">
                        ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                    <p><strong>Suggested Specialist:</strong> ${result.consultSpecialist}</p>
                </div>
            </div>
            <div class="mt-3">
                <button class="btn btn-primary me-2" onclick="bookSpecialistAppointment('${result.consultSpecialist}')">
                    <i class="fas fa-calendar-plus"></i> Book Appointment
                </button>
                <button class="btn btn-outline-light" onclick="shareWithDoctor()">
                    <i class="fas fa-share"></i> Share with Doctor
                </button>
            </div>
            <small class="text-white-50 d-block mt-2">
                Disclaimer: This AI analysis is for informational purposes only and should not replace professional medical advice.
            </small>
        </div>
    `).show();
}

/**
 * Book specialist appointment from AI recommendation
 */
function bookSpecialistAppointment(specialist) {
    // Map specialist to specialization
    const specializationMap = {
        'General Practitioner': 'general',
        'Neurologist': 'neurology',
        'Allergist': 'general',
        'Cardiologist': 'cardiology'
    };
    
    const specialization = specializationMap[specialist] || 'general';
    
    // Pre-fill appointment form
    $('#appointmentSpecialization').val(specialization);
    loadDoctorsBySpecialization();
    
    showBookAppointmentModal();
    showAlert(`Booking appointment with ${specialist}`, 'info');
}

/**
 * Utility functions for patient module
 */
function downloadPrescription(prescriptionId) {
    showAlert('Prescription download started.', 'info');
    // In a real app, this would generate and download a PDF
}

function markPrescriptionCompleted(prescriptionId) {
    const prescription = PatientModule.prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
        prescription.status = 'completed';
        saveToStorage('patient_prescriptions', PatientModule.prescriptions);
        loadPatientPrescriptions();
        updatePatientStats();
        showAlert('Prescription marked as completed.', 'success');
    }
}

function viewReport(reportId) {
    showAlert('Opening report viewer.', 'info');
    // In a real app, this would open a document viewer
}

function downloadReport(reportId) {
    showAlert('Report download started.', 'info');
    // In a real app, this would download the file
}

function viewAppointmentDetails(appointmentId) {
    const appointment = PatientModule.appointments.find(apt => apt.id === appointmentId);
    if (appointment) {
        showAlert(`Appointment with ${appointment.doctorName} on ${formatDateTime(appointment.date)}`, 'info');
    }
}

function shareWithDoctor() {
    showAlert('AI analysis shared with your primary care physician.', 'success');
    addNotification('Analysis Shared', 'AI analysis shared with doctor', 'info');
}

// Export functions for global use
window.loadPatientDashboard = loadPatientDashboard;
window.loadPatientOverview = loadPatientOverview;
window.loadPatientAppointments = loadPatientAppointments;
window.loadPatientPrescriptions = loadPatientPrescriptions;
window.loadPatientReports = loadPatientReports;
window.showBookAppointmentModal = showBookAppointmentModal;
window.confirmAppointment = confirmAppointment;
window.cancelAppointment = cancelAppointment;
window.showUploadReportModal = showUploadReportModal;
window.uploadReport = uploadReport;
window.savePatientProfile = savePatientProfile;
window.analyzeSymptoms = analyzeSymptoms;
window.analyzeMedicalImage = analyzeMedicalImage;

console.log('Patient.js loaded successfully');
