/**
 * MediCare+ Hospital Management System - Doctor Module
 * Handles doctor-specific functionality and dashboard
 */

// Doctor module state
const DoctorModule = {
    patientQueue: [],
    schedule: [],
    prescriptions: [],
    aiAnalyses: [],
    isLoading: false
};

// Mock patient data for demonstration
const mockPatients = [
    { id: 'pat_001', name: 'John Doe', age: 35, gender: 'Male' },
    { id: 'pat_002', name: 'Jane Smith', age: 28, gender: 'Female' },
    { id: 'pat_003', name: 'Bob Johnson', age: 45, gender: 'Male' },
    { id: 'pat_004', name: 'Alice Brown', age: 32, gender: 'Female' },
    { id: 'pat_005', name: 'Charlie Wilson', age: 41, gender: 'Male' }
];

/**
 * Initialize doctor module
 */
$(document).ready(function() {
    if (App.currentUser && App.currentUser.role === 'doctor') {
        initializeDoctorModule();
    }
});

function initializeDoctorModule() {
    loadDoctorData();
    setupDoctorEventListeners();
    
    console.log('Doctor module initialized');
}

/**
 * Setup event listeners for doctor functionality
 */
function setupDoctorEventListeners() {
    // Availability form submission
    $('#availabilityForm').on('submit', saveAvailability);
    
    // Doctor profile form submission
    $('#doctorProfileForm').on('submit', saveDoctorProfile);
    
    // Doctor profile image upload
    $('#doctorProfileImageInput').on('change', updateDoctorProfileImage);
    
    // Queue search functionality
    $('#queueSearch').on('input', filterPatientQueue);
}

/**
 * Load doctor dashboard
 */
function loadDoctorDashboard() {
    if (!App.currentUser || App.currentUser.role !== 'doctor') return;
    
    loadDoctorOverview();
    loadDoctorProfile();
}

/**
 * Load doctor overview data
 */
function loadDoctorOverview() {
    // Load patient queue
    DoctorModule.patientQueue = loadFromStorage('doctor_queue') || [];
    
    // Load schedule
    DoctorModule.schedule = loadFromStorage('doctor_schedule') || [];
    
    // Load prescriptions
    DoctorModule.prescriptions = loadFromStorage('doctor_prescriptions') || [];
    
    // Check for emergency alerts
    checkEmergencyAlerts();
    
    // Update stats
    updateDoctorStats();
    
    // Load today's schedule
    loadTodaySchedule();
}

/**
 * Update doctor statistics
 */
function updateDoctorStats() {
    const today = new Date().toDateString();
    
    const todayPatients = DoctorModule.patientQueue.filter(patient => 
        new Date(patient.date).toDateString() === today
    ).length;
    
    const pendingQueue = DoctorModule.patientQueue.filter(patient => 
        patient.status === 'scheduled'
    ).length;
    
    const aiAnalyses = DoctorModule.aiAnalyses.length;
    
    const prescriptionsIssued = DoctorModule.prescriptions.filter(presc => 
        new Date(presc.date).toDateString() === today
    ).length;
    
    $('#todayPatients').text(todayPatients);
    $('#pendingQueue').text(pendingQueue);
    $('#aiAnalyses').text(aiAnalyses);
    $('#prescriptionsIssued').text(prescriptionsIssued);
}

/**
 * Check for emergency alerts
 */
function checkEmergencyAlerts() {
    const emergencies = loadFromStorage('emergencies') || [];
    const pendingEmergencies = emergencies.filter(em => em.status === 'pending');
    
    if (pendingEmergencies.length > 0) {
        const latestEmergency = pendingEmergencies[0];
        $('#emergencyContent').html(`
            <strong>Patient:</strong> ${latestEmergency.name}<br>
            <strong>Condition:</strong> ${latestEmergency.symptoms}<br>
            <strong>Location:</strong> ${latestEmergency.location || 'Not specified'}<br>
            <strong>Time:</strong> ${formatDateTime(latestEmergency.timestamp)}<br>
            <button class="btn btn-light btn-sm mt-2" onclick="acknowledgeEmergency('${latestEmergency.id}')">
                Acknowledge
            </button>
        `);
        $('#emergencyAlerts').show();
    } else {
        $('#emergencyAlerts').hide();
    }
}

/**
 * Acknowledge emergency
 */
function acknowledgeEmergency(emergencyId) {
    const emergencies = loadFromStorage('emergencies') || [];
    const emergency = emergencies.find(em => em.id === emergencyId);
    
    if (emergency) {
        emergency.status = 'acknowledged';
        emergency.acknowledgedBy = App.currentUser.id;
        emergency.acknowledgedAt = new Date().toISOString();
        
        saveToStorage('emergencies', emergencies);
        checkEmergencyAlerts();
        
        showAlert('Emergency acknowledged. Medical team notified.', 'success');
    }
}

/**
 * Load today's schedule
 */
function loadTodaySchedule() {
    const today = new Date().toDateString();
    const todaySchedule = DoctorModule.schedule.filter(item => 
        new Date(item.date).toDateString() === today
    );
    
    if (todaySchedule.length === 0) {
        $('#todaySchedule').html('<p class="text-white-50">No appointments scheduled for today.</p>');
        return;
    }
    
    const scheduleHtml = todaySchedule.map(item => `
        <div class="d-flex justify-content-between align-items-center mb-2 p-2 rounded" style="background: rgba(255,255,255,0.1);">
            <div>
                <strong class="text-white">${formatDateTime(item.date)}</strong><br>
                <span class="text-white-50">${item.patientName || 'Available slot'}</span>
            </div>
            <span class="badge bg-${item.status === 'booked' ? 'warning' : 'success'}">${item.status || 'available'}</span>
        </div>
    `).join('');
    
    $('#todaySchedule').html(scheduleHtml);
}

/**
 * Load doctor patient queue
 */
function loadDoctorQueue() {
    const queue = DoctorModule.patientQueue;
    const tbody = $('#queueTableBody');
    
    if (queue.length === 0) {
        tbody.html('<tr><td colspan="6" class="text-center text-muted">No patients in queue.</td></tr>');
        return;
    }
    
    const queueRows = queue
        .filter(patient => patient.status === 'scheduled')
        .sort((a, b) => {
            // Sort by priority and time
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            return new Date(a.date) - new Date(b.date);
        })
        .map(patient => `
            <tr>
                <td><span class="status-badge priority-${patient.priority}">${patient.priority}</span></td>
                <td>${patient.patientName}</td>
                <td>${getPatientAge(patient.patientId)}</td>
                <td>${patient.complaint}</td>
                <td>${formatDateTime(patient.date)}</td>
                <td>
                    <button class="btn btn-sm btn-success me-1" onclick="acceptPatient('${patient.id}')">
                        <i class="fas fa-check"></i> Accept
                    </button>
                    <button class="btn btn-sm btn-outline-info" onclick="viewPatientDetails('${patient.id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');
    
    tbody.html(queueRows);
}

/**
 * Get patient age from mock data
 */
function getPatientAge(patientId) {
    const patient = mockPatients.find(p => p.id === patientId);
    return patient ? patient.age : 'N/A';
}

/**
 * Filter patient queue
 */
function filterPatientQueue() {
    const searchTerm = $('#queueSearch').val().toLowerCase();
    $('#queueTableBody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        if (rowText.includes(searchTerm)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/**
 * Accept patient from queue
 */
function acceptPatient(appointmentId) {
    const appointment = DoctorModule.patientQueue.find(apt => apt.id === appointmentId);
    if (appointment) {
        appointment.status = 'in-progress';
        appointment.acceptedAt = new Date().toISOString();
        
        saveToStorage('doctor_queue', DoctorModule.patientQueue);
        loadDoctorQueue();
        updateDoctorStats();
        
        showAlert(`Accepted appointment with ${appointment.patientName}`, 'success');
        
        // Open patient analysis interface
        switchDashboardContent('doctor-ai-analysis');
        loadPatientForAnalysis(appointment);
    }
}

/**
 * View patient details
 */
function viewPatientDetails(appointmentId) {
    const appointment = DoctorModule.patientQueue.find(apt => apt.id === appointmentId);
    if (appointment) {
        showAlert(`Patient: ${appointment.patientName}\nComplaint: ${appointment.complaint}\nTime: ${formatDateTime(appointment.date)}`, 'info');
    }
}

/**
 * Load patient for AI analysis
 */
function loadPatientForAnalysis(appointment) {
    // Generate mock patient images for analysis
    const patientImages = generateMockPatientImages(appointment.patientId);
    
    const imagesHtml = patientImages.map(image => `
        <div class="col-md-4 mb-3">
            <div class="image-item" onclick="analyzePatientImage('${image.id}', '${appointment.id}')">
                <img src="${image.url}" alt="${image.type}">
                <div class="image-item-info">
                    <small>${image.type}</small><br>
                    <small class="text-muted">${image.date}</small>
                </div>
            </div>
        </div>
    `).join('');
    
    $('#patientImagesGrid').html(imagesHtml);
    
    $('#aiAnalysisResults').html(`
        <div class="text-center">
            <i class="fas fa-images fa-3x text-white-50 mb-3"></i>
            <p class="text-white-50">Select an image to analyze</p>
            <p class="text-white">Patient: ${appointment.patientName}</p>
            <p class="text-white-50">Complaint: ${appointment.complaint}</p>
        </div>
    `);
}

/**
 * Generate mock patient images
 */
function generateMockPatientImages(patientId) {
    const imageTypes = ['X-Ray', 'CT Scan', 'MRI', 'Blood Test', 'ECG'];
    const stockImages = [
        'https://pixabay.com/get/g2f9a330d37f6a06391e41edfe4850046bb649a6b45936bf6b49fa0b369c4e09b0ffb1d0070ab04d25ba42fed0d9c97eb744ff603ec19421000d8a5d6176c4109_1280.jpg',
        'https://pixabay.com/get/gdad9a992273f1d9b6e5e9217ed58cc2b1b426c89ce1d96aec4e37551d78e6b4e96ce1206ee79ca7fa65672e3175552b059d9f82dd7fffc5ba2e8bf06f78c2bbd_1280.jpg',
        'https://pixabay.com/get/ged8f69c64ef16e2eb609a982a9e67bdfae458a3df34316279d788f668120163915b903bedfc872b5897aa74f089897d2624950858ccab7a3c45747f1c95ea5a4_1280.jpg'
    ];
    
    return imageTypes.slice(0, 3).map((type, index) => ({
        id: `img_${patientId}_${index}`,
        type,
        url: stockImages[index % stockImages.length],
        date: formatDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000))
    }));
}

/**
 * Analyze patient image
 */
function analyzePatientImage(imageId, appointmentId) {
    $('#aiAnalysisResults').html(`
        <div class="text-center">
            <div class="loading-spinner mb-3"></div>
            <p class="text-white">Analyzing medical image...</p>
        </div>
    `);
    
    setTimeout(() => {
        const analysis = generateMedicalImageAnalysis();
        
        $('#aiAnalysisResults').html(`
            <div class="ai-result">
                <h5><i class="fas fa-brain me-2"></i>AI Analysis Results</h5>
                
                <div class="ai-confidence mb-3">
                    <strong>Confidence Level: ${analysis.confidence}%</strong>
                </div>
                
                <div class="ai-suggestion">
                    <h6>AI Findings:</h6>
                    <p>${analysis.findings}</p>
                    
                    <h6>Suggested Diagnosis:</h6>
                    <p class="mb-2">${analysis.diagnosis}</p>
                    
                    <h6>Recommended Treatment:</h6>
                    <p>${analysis.treatment}</p>
                    
                    <div class="mt-3">
                        <label for="doctorOverride" class="form-label text-white">Doctor's Assessment:</label>
                        <textarea class="form-control" id="doctorOverride" rows="3" placeholder="Enter your professional assessment..."></textarea>
                    </div>
                    
                    <div class="mt-3">
                        <button class="btn btn-primary me-2" onclick="createPrescriptionFromAnalysis('${appointmentId}', '${analysis.diagnosis}')">
                            <i class="fas fa-prescription"></i> Create Prescription
                        </button>
                        <button class="btn btn-outline-light" onclick="saveAnalysis('${appointmentId}', '${imageId}')">
                            <i class="fas fa-save"></i> Save Analysis
                        </button>
                    </div>
                </div>
            </div>
        `);
        
        // Add to AI analyses
        DoctorModule.aiAnalyses.push({
            id: generateId(),
            appointmentId,
            imageId,
            analysis,
            timestamp: new Date().toISOString()
        });
        
        updateDoctorStats();
        
    }, 2000);
}

/**
 * Generate medical image analysis
 */
function generateMedicalImageAnalysis() {
    const analyses = [
        {
            confidence: 89,
            findings: 'Image shows normal anatomical structures with no visible abnormalities.',
            diagnosis: 'Normal findings',
            treatment: 'No treatment required. Continue regular monitoring.'
        },
        {
            confidence: 76,
            findings: 'Mild inflammation detected in the tissue. No severe pathology observed.',
            diagnosis: 'Mild inflammatory condition',
            treatment: 'Anti-inflammatory medication recommended. Follow-up in 2 weeks.'
        },
        {
            confidence: 92,
            findings: 'Clear visualization of structures. All parameters within normal limits.',
            diagnosis: 'Healthy tissue',
            treatment: 'No immediate intervention needed. Maintain current health regimen.'
        },
        {
            confidence: 68,
            findings: 'Some areas require closer examination. Recommend additional testing.',
            diagnosis: 'Inconclusive findings',
            treatment: 'Further diagnostic tests recommended for complete evaluation.'
        }
    ];
    
    return analyses[Math.floor(Math.random() * analyses.length)];
}

/**
 * Save analysis
 */
function saveAnalysis(appointmentId, imageId) {
    const doctorNotes = $('#doctorOverride').val();
    
    showAlert('Analysis saved successfully.', 'success');
    addNotification('Analysis Saved', 'Medical image analysis completed', 'info');
    
    // In a real app, this would save to the database
    console.log('Saving analysis:', { appointmentId, imageId, doctorNotes });
}

/**
 * Create prescription from analysis
 */
function createPrescriptionFromAnalysis(appointmentId, diagnosis) {
    const appointment = DoctorModule.patientQueue.find(apt => apt.id === appointmentId);
    if (!appointment) return;
    
    // Pre-fill prescription modal
    $('#prescriptionPatient').empty().append(`
        <option value="${appointment.patientId}" selected>${appointment.patientName}</option>
    `);
    $('#prescriptionDate').val(new Date().toISOString().split('T')[0]);
    $('#prescriptionDiagnosis').val(diagnosis);
    
    showPrescriptionModal();
}

/**
 * Show prescription modal
 */
function showPrescriptionModal() {
    // Load patients for dropdown
    loadPatientsForPrescription();
    
    // Set current date
    $('#prescriptionDate').val(new Date().toISOString().split('T')[0]);
    
    $('#prescriptionModal').modal('show');
}

/**
 * Load patients for prescription dropdown
 */
function loadPatientsForPrescription() {
    const select = $('#prescriptionPatient');
    
    if (select.children().length <= 1) {
        mockPatients.forEach(patient => {
            select.append(`<option value="${patient.id}">${patient.name}</option>`);
        });
    }
}

/**
 * Save prescription
 */
function savePrescription() {
    const prescriptionData = {
        patientId: $('#prescriptionPatient').val(),
        patientName: $('#prescriptionPatient option:selected').text(),
        date: $('#prescriptionDate').val(),
        diagnosis: $('#prescriptionDiagnosis').val(),
        medications: $('#prescriptionMedications').val(),
        instructions: $('#prescriptionInstructions').val(),
        followUpDate: $('#prescriptionFollowUp').val(),
        notifyPatient: $('#notifyPatient').is(':checked')
    };
    
    // Validate required fields
    if (!prescriptionData.patientId || !prescriptionData.diagnosis || !prescriptionData.medications) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Create prescription object
    const prescription = {
        id: generateId(),
        doctorId: App.currentUser.id,
        doctorName: `${App.currentUser.firstName} ${App.currentUser.lastName}`,
        ...prescriptionData,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    // Save to doctor's prescriptions
    DoctorModule.prescriptions.unshift(prescription);
    saveToStorage('doctor_prescriptions', DoctorModule.prescriptions);
    
    // Save to patient's prescriptions
    const patientPrescriptions = loadFromStorage('patient_prescriptions') || [];
    patientPrescriptions.unshift(prescription);
    saveToStorage('patient_prescriptions', patientPrescriptions);
    
    // Close modal and reset form
    $('#prescriptionModal').modal('hide');
    $('#newPrescriptionForm')[0].reset();
    
    // Show success message
    showAlert(`Prescription created for ${prescriptionData.patientName}`, 'success');
    
    if (prescriptionData.notifyPatient) {
        addNotification('Prescription Created', `New prescription for ${prescriptionData.patientName}`, 'success');
    }
    
    // Refresh prescriptions if on prescriptions page
    if ($('#doctor-prescriptions').hasClass('active')) {
        loadDoctorPrescriptions();
    }
    
    updateDoctorStats();
}

/**
 * Load doctor prescriptions
 */
function loadDoctorPrescriptions() {
    const prescriptions = DoctorModule.prescriptions;
    const tbody = $('#doctorPrescriptionsBody');
    
    if (prescriptions.length === 0) {
        tbody.html('<tr><td colspan="5" class="text-center text-muted">No prescriptions found.</td></tr>');
        return;
    }
    
    const prescriptionRows = prescriptions.map(prescription => `
        <tr>
            <td>${formatDate(prescription.date)}</td>
            <td>${prescription.patientName}</td>
            <td>${prescription.diagnosis}</td>
            <td>${prescription.medications.split('\n')[0]}...</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="viewPrescription('${prescription.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-sm btn-outline-secondary ms-1" onclick="downloadPrescription('${prescription.id}')">
                    <i class="fas fa-download"></i> PDF
                </button>
            </td>
        </tr>
    `).join('');
    
    tbody.html(prescriptionRows);
}

/**
 * Save availability
 */
function saveAvailability(e) {
    e.preventDefault();
    
    const availabilityData = {
        date: $('#availabilityDate').val(),
        startTime: $('#startTime').val(),
        endTime: $('#endTime').val()
    };
    
    if (!availabilityData.date || !availabilityData.startTime || !availabilityData.endTime) {
        showAlert('Please fill in all fields.', 'warning');
        return;
    }
    
    // Create schedule entry
    const scheduleEntry = {
        id: generateId(),
        doctorId: App.currentUser.id,
        date: `${availabilityData.date}T${availabilityData.startTime}:00`,
        endTime: `${availabilityData.date}T${availabilityData.endTime}:00`,
        status: 'available',
        createdAt: new Date().toISOString()
    };
    
    // Save to schedule
    DoctorModule.schedule.push(scheduleEntry);
    saveToStorage('doctor_schedule', DoctorModule.schedule);
    
    // Reset form
    $('#availabilityForm')[0].reset();
    
    showAlert('Availability saved successfully.', 'success');
    loadTodaySchedule();
}

/**
 * Load doctor profile
 */
function loadDoctorProfile() {
    if (!App.currentUser) return;
    
    const user = App.currentUser;
    
    // Update profile display
    $('#doctorProfileName').text(`${user.firstName} ${user.lastName}`);
    $('#doctorSpecialization').text(user.specialization ? 
        user.specialization.charAt(0).toUpperCase() + user.specialization.slice(1) : 'Specialist'
    );
    
    // Fill form fields
    $('#doctorFirstName').val(user.firstName || '');
    $('#doctorLastName').val(user.lastName || '');
    $('#doctorEmail').val(user.email || '');
    $('#doctorPhone').val(user.phone || '');
    $('#doctorSpecializationInput').val(user.specialization || '');
    $('#doctorExperience').val(user.experience || '');
    $('#doctorLicense').val(user.license || '');
    $('#doctorBio').val(user.bio || '');
}

/**
 * Save doctor profile
 */
function saveDoctorProfile(e) {
    e.preventDefault();
    
    const profileData = {
        firstName: $('#doctorFirstName').val(),
        lastName: $('#doctorLastName').val(),
        email: $('#doctorEmail').val(),
        phone: $('#doctorPhone').val(),
        specialization: $('#doctorSpecializationInput').val(),
        experience: parseInt($('#doctorExperience').val()) || 0,
        license: $('#doctorLicense').val(),
        bio: $('#doctorBio').val()
    };
    
    // Update current user
    Object.assign(App.currentUser, profileData);
    
    // Save to storage
    localStorage.setItem('medicare_user', JSON.stringify(App.currentUser));
    
    // Update display
    $('#doctorProfileName').text(`${profileData.firstName} ${profileData.lastName}`);
    $('#doctorSpecialization').text(profileData.specialization ? 
        profileData.specialization.charAt(0).toUpperCase() + profileData.specialization.slice(1) : 'Specialist'
    );
    
    showAlert('Profile updated successfully!', 'success');
    addNotification('Profile Updated', 'Your profile has been updated', 'info');
}

/**
 * Update doctor profile image
 */
function updateDoctorProfileImage(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageSrc = e.target.result;
            $('#doctorProfileAvatar').html(`<img src="${imageSrc}" alt="Profile">`);
            
            // Save to user data
            App.currentUser.profileImage = imageSrc;
            localStorage.setItem('medicare_user', JSON.stringify(App.currentUser));
        };
        reader.readAsDataURL(file);
    }
}

/**
 * Utility functions for doctor module
 */
function viewPrescription(prescriptionId) {
    const prescription = DoctorModule.prescriptions.find(p => p.id === prescriptionId);
    if (prescription) {
        showAlert(`Prescription for ${prescription.patientName}\nDiagnosis: ${prescription.diagnosis}`, 'info');
    }
}

function downloadPrescription(prescriptionId) {
    showAlert('Prescription PDF download started.', 'info');
    // In a real app, this would generate and download a PDF
}

// Export functions for global use
window.loadDoctorDashboard = loadDoctorDashboard;
window.loadDoctorOverview = loadDoctorOverview;
window.loadDoctorQueue = loadDoctorQueue;
window.acceptPatient = acceptPatient;
window.viewPatientDetails = viewPatientDetails;
window.analyzePatientImage = analyzePatientImage;
window.saveAnalysis = saveAnalysis;
window.createPrescriptionFromAnalysis = createPrescriptionFromAnalysis;
window.showPrescriptionModal = showPrescriptionModal;
window.savePrescription = savePrescription;
window.loadDoctorPrescriptions = loadDoctorPrescriptions;
window.saveAvailability = saveAvailability;
window.acknowledgeEmergency = acknowledgeEmergency;

console.log('Doctor.js loaded successfully');
