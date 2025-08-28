/**
 * MediCare+ Hospital Management System - Admin Module
 * Handles admin-specific functionality and dashboard
 */

// Admin module state
const AdminModule = {
    doctors: [],
    patients: [],
    appointments: [],
    analytics: {},
    charts: {},
    isLoading: false
};

// Chart.js instances
let appointmentsChart = null;
let demographicsChart = null;
let diseaseTrendsChart = null;
let doctorWorkloadChart = null;

/**
 * Initialize admin module
 */
$(document).ready(function() {
    if (App.currentUser && App.currentUser.role === 'admin') {
        initializeAdminModule();
    }
});

function initializeAdminModule() {
    loadAdminData();
    setupAdminEventListeners();
    
    console.log('Admin module initialized');
}

/**
 * Setup event listeners for admin functionality
 */
function setupAdminEventListeners() {
    // Add doctor form submission
    $('#addDoctorForm').on('submit', handleAddDoctor);
    
    // Settings forms
    $('#generalSettingsForm').on('submit', saveGeneralSettings);
    $('#aiSettingsForm').on('submit', saveAISettings);
    
    // Analytics filter
    $('#analyticsFilter').on('change', updateAnalytics);
    
    // Search and filter functionality
    $('#doctorSearch').on('input', filterDoctorsTable);
    $('#doctorFilter').on('change', filterDoctorsTable);
    $('#patientSearch').on('input', filterPatientsTable);
    $('#patientFilter').on('change', filterPatientsTable);
    
    // AI confidence threshold slider
    $('#aiConfidenceThreshold').on('input', function() {
        $(this).next('.text-center').text($(this).val() + '%');
    });
}

/**
 * Load admin dashboard
 */
function loadAdminDashboard() {
    if (!App.currentUser || App.currentUser.role !== 'admin') return;
    
    loadAdminOverview();
}

/**
 * Load admin overview data
 */
function loadAdminOverview() {
    // Load doctors
    AdminModule.doctors = generateMockDoctors();
    
    // Load patients
    AdminModule.patients = generateMockPatients();
    
    // Load appointments
    AdminModule.appointments = loadFromStorage('patient_appointments') || [];
    
    // Update stats
    updateAdminStats();
    
    // Initialize charts
    initializeCharts();
}

/**
 * Generate mock doctors data
 */
function generateMockDoctors() {
    return [
        {
            id: 'doc_001',
            name: 'Dr. Sarah Johnson',
            specialization: 'cardiology',
            experience: 12,
            status: 'active',
            patients: 45,
            rating: 4.8,
            joinDate: '2020-03-15'
        },
        {
            id: 'doc_002',
            name: 'Dr. Michael Chen',
            specialization: 'neurology',
            experience: 8,
            status: 'active',
            patients: 32,
            rating: 4.6,
            joinDate: '2021-07-22'
        },
        {
            id: 'doc_003',
            name: 'Dr. Emily Davis',
            specialization: 'orthopedics',
            experience: 15,
            status: 'active',
            patients: 58,
            rating: 4.9,
            joinDate: '2019-01-10'
        },
        {
            id: 'doc_004',
            name: 'Dr. James Wilson',
            specialization: 'dermatology',
            experience: 10,
            status: 'active',
            patients: 28,
            rating: 4.7,
            joinDate: '2020-11-05'
        },
        {
            id: 'doc_005',
            name: 'Dr. Lisa Thompson',
            specialization: 'pediatrics',
            experience: 12,
            status: 'active',
            patients: 67,
            rating: 4.8,
            joinDate: '2020-08-18'
        }
    ];
}

/**
 * Generate mock patients data
 */
function generateMockPatients() {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Jessica', 'William', 'Ashley'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const genders = ['male', 'female'];
    
    const patients = [];
    
    for (let i = 1; i <= 50; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const age = Math.floor(Math.random() * 60) + 18;
        const gender = genders[Math.floor(Math.random() * genders.length)];
        const bloodGroup = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
        
        patients.push({
            id: `pat_${String(i).padStart(3, '0')}`,
            name: `${firstName} ${lastName}`,
            age,
            gender,
            bloodGroup,
            lastVisit: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            joinDate: new Date(Date.now() - Math.random() * 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    
    return patients;
}

/**
 * Update admin statistics
 */
function updateAdminStats() {
    const totalDoctors = AdminModule.doctors.filter(doc => doc.status === 'active').length;
    const totalPatients = AdminModule.patients.filter(pat => pat.status === 'active').length;
    const totalAppointments = AdminModule.appointments.length;
    
    $('#totalDoctors').text(totalDoctors);
    $('#totalPatients').text(totalPatients);
    $('#totalAppointments').text(totalAppointments);
}

/**
 * Initialize dashboard charts
 */
function initializeCharts() {
    // Appointments per day chart
    const appointmentsCtx = document.getElementById('appointmentsChart');
    if (appointmentsCtx) {
        appointmentsChart = new Chart(appointmentsCtx, {
            type: 'line',
            data: {
                labels: getLast7Days(),
                datasets: [{
                    label: 'Appointments',
                    data: generateAppointmentsData(),
                    borderColor: '#4a90e2',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    // Demographics chart
    const demographicsCtx = document.getElementById('demographicsChart');
    if (demographicsCtx) {
        demographicsChart = new Chart(demographicsCtx, {
            type: 'doughnut',
            data: {
                labels: ['Male', 'Female'],
                datasets: [{
                    data: getDemographicsData(),
                    backgroundColor: ['#4a90e2', '#50c878']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'white'
                        }
                    }
                }
            }
        });
    }
}

/**
 * Load admin analytics
 */
function loadAdminAnalytics() {
    initializeAnalyticsCharts();
    updateKPIs();
}

/**
 * Initialize analytics charts
 */
function initializeAnalyticsCharts() {
    // Disease trends chart
    const diseaseTrendsCtx = document.getElementById('diseaseTrendsChart');
    if (diseaseTrendsCtx) {
        diseaseTrendsChart = new Chart(diseaseTrendsCtx, {
            type: 'bar',
            data: {
                labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Pediatrics', 'General'],
                datasets: [{
                    label: 'Cases',
                    data: [45, 32, 58, 28, 67, 89],
                    backgroundColor: '#4a90e2'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
    
    // Doctor workload chart
    const doctorWorkloadCtx = document.getElementById('doctorWorkloadChart');
    if (doctorWorkloadCtx) {
        doctorWorkloadChart = new Chart(doctorWorkloadCtx, {
            type: 'horizontalBar',
            data: {
                labels: AdminModule.doctors.map(doc => doc.name),
                datasets: [{
                    label: 'Patients',
                    data: AdminModule.doctors.map(doc => doc.patients),
                    backgroundColor: '#50c878'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: 'white' }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    },
                    y: {
                        ticks: { color: 'white' },
                        grid: { color: 'rgba(255,255,255,0.1)' }
                    }
                }
            }
        });
    }
}

/**
 * Update KPIs
 */
function updateKPIs() {
    // Mock KPI data
    $('#satisfactionRate').text('94%');
    $('#avgWaitTime').text('12');
    $('#aiAccuracy').text('89%');
}

/**
 * Load doctors management
 */
function loadDoctorsManagement() {
    const tbody = $('#doctorsTableBody');
    
    if (AdminModule.doctors.length === 0) {
        tbody.html('<tr><td colspan="6" class="text-center text-muted">No doctors found.</td></tr>');
        return;
    }
    
    const doctorRows = AdminModule.doctors.map(doctor => `
        <tr>
            <td>${doctor.name}</td>
            <td>${doctor.specialization.charAt(0).toUpperCase() + doctor.specialization.slice(1)}</td>
            <td>${doctor.experience} years</td>
            <td><span class="status-badge status-${doctor.status}">${doctor.status}</span></td>
            <td>${doctor.patients}</td>
            <td>
                <button class="btn btn-sm btn-outline-info me-1" onclick="viewDoctor('${doctor.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editDoctor('${doctor.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="toggleDoctorStatus('${doctor.id}')">
                    <i class="fas fa-${doctor.status === 'active' ? 'pause' : 'play'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    tbody.html(doctorRows);
}

/**
 * Load patients management
 */
function loadPatientsManagement() {
    const tbody = $('#patientsTableBody');
    
    if (AdminModule.patients.length === 0) {
        tbody.html('<tr><td colspan="7" class="text-center text-muted">No patients found.</td></tr>');
        return;
    }
    
    const patientRows = AdminModule.patients.slice(0, 20).map(patient => `
        <tr>
            <td>${patient.name}</td>
            <td>${patient.age}</td>
            <td>${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</td>
            <td>${patient.bloodGroup}</td>
            <td>${formatDate(patient.lastVisit)}</td>
            <td><span class="status-badge status-${patient.status}">${patient.status}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info me-1" onclick="viewPatient('${patient.id}')">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editPatient('${patient.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="togglePatientStatus('${patient.id}')">
                    <i class="fas fa-${patient.status === 'active' ? 'pause' : 'play'}"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    tbody.html(patientRows);
}

/**
 * Show add doctor modal
 */
function showAddDoctorModal() {
    $('#addDoctorModal').modal('show');
}

/**
 * Handle add doctor
 */
function handleAddDoctor(e) {
    e.preventDefault();
    
    const doctorData = {
        firstName: $('#newDoctorFirstName').val(),
        lastName: $('#newDoctorLastName').val(),
        email: $('#newDoctorEmail').val(),
        phone: $('#newDoctorPhone').val(),
        specialization: $('#newDoctorSpecialization').val(),
        experience: parseInt($('#newDoctorExperience').val()) || 0,
        license: $('#newDoctorLicense').val(),
        bio: $('#newDoctorBio').val()
    };
    
    // Validate required fields
    if (!doctorData.firstName || !doctorData.lastName || !doctorData.email || 
        !doctorData.specialization || !doctorData.license) {
        showAlert('Please fill in all required fields.', 'warning');
        return;
    }
    
    // Create new doctor
    const newDoctor = {
        id: generateId(),
        name: `Dr. ${doctorData.firstName} ${doctorData.lastName}`,
        specialization: doctorData.specialization,
        experience: doctorData.experience,
        status: 'active',
        patients: 0,
        rating: 0,
        joinDate: new Date().toISOString(),
        ...doctorData
    };
    
    // Add to doctors list
    AdminModule.doctors.unshift(newDoctor);
    
    // Close modal and reset form
    $('#addDoctorModal').modal('hide');
    $('#addDoctorForm')[0].reset();
    
    // Show success message
    showAlert(`Doctor ${newDoctor.name} added successfully!`, 'success');
    
    // Refresh doctors table if active
    if ($('#admin-doctors').hasClass('active')) {
        loadDoctorsManagement();
    }
    
    updateAdminStats();
    addNotification('Doctor Added', `${newDoctor.name} has been added to the system`, 'success');
}

/**
 * Add new doctor
 */
function addNewDoctor() {
    $('#addDoctorForm').submit();
}

/**
 * Filter functions
 */
function filterDoctorsTable() {
    const searchTerm = $('#doctorSearch').val().toLowerCase();
    const filterValue = $('#doctorFilter').val().toLowerCase();
    
    $('#doctorsTableBody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        const matchesSearch = !searchTerm || rowText.includes(searchTerm);
        const matchesFilter = !filterValue || rowText.includes(filterValue);
        
        if (matchesSearch && matchesFilter) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

function filterPatientsTable() {
    const searchTerm = $('#patientSearch').val().toLowerCase();
    const filterValue = $('#patientFilter').val().toLowerCase();
    
    $('#patientsTableBody tr').each(function() {
        const rowText = $(this).text().toLowerCase();
        const matchesSearch = !searchTerm || rowText.includes(searchTerm);
        const matchesFilter = !filterValue || rowText.includes(filterValue);
        
        if (matchesSearch && matchesFilter) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/**
 * Doctor management functions
 */
function viewDoctor(doctorId) {
    const doctor = AdminModule.doctors.find(d => d.id === doctorId);
    if (doctor) {
        showAlert(`Doctor: ${doctor.name}\nSpecialization: ${doctor.specialization}\nExperience: ${doctor.experience} years\nPatients: ${doctor.patients}`, 'info');
    }
}

function editDoctor(doctorId) {
    const doctor = AdminModule.doctors.find(d => d.id === doctorId);
    if (doctor) {
        showAlert(`Edit functionality for ${doctor.name} would open here.`, 'info');
    }
}

function toggleDoctorStatus(doctorId) {
    const doctor = AdminModule.doctors.find(d => d.id === doctorId);
    if (doctor) {
        doctor.status = doctor.status === 'active' ? 'inactive' : 'active';
        loadDoctorsManagement();
        updateAdminStats();
        showAlert(`Doctor ${doctor.name} status updated to ${doctor.status}.`, 'info');
    }
}

/**
 * Patient management functions
 */
function viewPatient(patientId) {
    const patient = AdminModule.patients.find(p => p.id === patientId);
    if (patient) {
        showAlert(`Patient: ${patient.name}\nAge: ${patient.age}\nGender: ${patient.gender}\nBlood Group: ${patient.bloodGroup}`, 'info');
    }
}

function editPatient(patientId) {
    const patient = AdminModule.patients.find(p => p.id === patientId);
    if (patient) {
        showAlert(`Edit functionality for ${patient.name} would open here.`, 'info');
    }
}

function togglePatientStatus(patientId) {
    const patient = AdminModule.patients.find(p => p.id === patientId);
    if (patient) {
        patient.status = patient.status === 'active' ? 'inactive' : 'active';
        loadPatientsManagement();
        updateAdminStats();
        showAlert(`Patient ${patient.name} status updated to ${patient.status}.`, 'info');
    }
}

/**
 * Export patients to CSV
 */
function exportPatients() {
    const csvContent = generatePatientsCSV();
    downloadCSV(csvContent, 'patients_export.csv');
    showAlert('Patients data exported successfully!', 'success');
}

function generatePatientsCSV() {
    const headers = ['Name', 'Age', 'Gender', 'Blood Group', 'Last Visit', 'Status'];
    const rows = AdminModule.patients.map(patient => [
        patient.name,
        patient.age,
        patient.gender,
        patient.bloodGroup,
        formatDate(patient.lastVisit),
        patient.status
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
    
    return csvContent;
}

function downloadCSV(content, fileName) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

/**
 * Settings management
 */
function saveGeneralSettings(e) {
    e.preventDefault();
    
    const settings = {
        hospitalName: $('#hospitalName').val(),
        hospitalAddress: $('#hospitalAddress').val(),
        emergencyContact: $('#emergencyContact').val()
    };
    
    saveToStorage('general_settings', settings);
    showAlert('General settings saved successfully!', 'success');
}

function saveAISettings(e) {
    e.preventDefault();
    
    const settings = {
        enableAI: $('#enableAI').is(':checked'),
        confidenceThreshold: $('#aiConfidenceThreshold').val(),
        autoTriage: $('#autoTriage').is(':checked')
    };
    
    saveToStorage('ai_settings', settings);
    showAlert('AI settings saved successfully!', 'success');
}

/**
 * Update analytics based on filter
 */
function updateAnalytics() {
    const filter = $('#analyticsFilter').val();
    console.log('Updating analytics for period:', filter);
    
    // In a real app, this would fetch new data based on the filter
    // For now, we'll just show a message
    showAlert(`Analytics updated for ${filter} period.`, 'info');
}

/**
 * Utility functions for chart data
 */
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return days;
}

function generateAppointmentsData() {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 20) + 5);
}

function getDemographicsData() {
    const maleCount = AdminModule.patients.filter(p => p.gender === 'male').length;
    const femaleCount = AdminModule.patients.filter(p => p.gender === 'female').length;
    return [maleCount, femaleCount];
}

// Export functions for global use
window.loadAdminDashboard = loadAdminDashboard;
window.loadAdminOverview = loadAdminOverview;
window.loadAdminAnalytics = loadAdminAnalytics;
window.loadDoctorsManagement = loadDoctorsManagement;
window.loadPatientsManagement = loadPatientsManagement;
window.showAddDoctorModal = showAddDoctorModal;
window.addNewDoctor = addNewDoctor;
window.viewDoctor = viewDoctor;
window.editDoctor = editDoctor;
window.toggleDoctorStatus = toggleDoctorStatus;
window.viewPatient = viewPatient;
window.editPatient = editPatient;
window.togglePatientStatus = togglePatientStatus;
window.exportPatients = exportPatients;

// Load management pages when switching to them
$(document).on('click', '.sidebar-link[data-target="admin-doctors"]', loadDoctorsManagement);
$(document).on('click', '.sidebar-link[data-target="admin-patients"]', loadPatientsManagement);
$(document).on('click', '.sidebar-link[data-target="admin-analytics"]', loadAdminAnalytics);

console.log('Admin.js loaded successfully');
