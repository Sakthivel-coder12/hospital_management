/**
 * MediCare+ Hospital Management System - Main Application
 * Handles navigation, common utilities, and application state
 */

// Global application state
const App = {
    currentUser: null,
    currentPage: 'home',
    notifications: [],
    isInitialized: false
};

// Initialize application
$(document).ready(function() {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Check for existing user session
    checkUserSession();
    
    // Initialize navigation
    initializeNavigation();
    
    // Initialize common event listeners
    initializeEventListeners();
    
    // Initialize date inputs with minimum date as today
    initializeDateInputs();
    
    // Load notifications
    loadNotifications();
    
    App.isInitialized = true;
    console.log('MediCare+ Application initialized successfully');
}

/**
 * Check for existing user session
 */
function checkUserSession() {
    const userData = localStorage.getItem('medicare_user');
    if (userData) {
        try {
            App.currentUser = JSON.parse(userData);
            updateNavigationForRole(App.currentUser.role);
            
            // Navigate to appropriate dashboard if on home page
            if (App.currentPage === 'home') {
                navigateToPage(`${App.currentUser.role}-dashboard`);
            }
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('medicare_user');
        }
    }
}

/**
 * Navigation handling
 */
function navigateToPage(pageId) {
    // Hide all pages
    $('.page').removeClass('active');
    
    // Show target page
    $(`#${pageId}`).addClass('active');
    
    App.currentPage = pageId;
    
    // Update URL without page reload
    if (history.pushState) {
        history.pushState(null, null, `#${pageId}`);
    }
    
    // Load page-specific data
    loadPageData(pageId);
    
    // Update navigation active states
    updateNavigationActive(pageId);
}

/**
 * Update navigation for user role
 */
function updateNavigationForRole(role) {
    const navLinks = $('#navLinks');
    navLinks.empty();
    
    if (role) {
        // Authenticated user navigation
        const dashboardLink = `${role}-dashboard`;
        navLinks.append(`
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('${dashboardLink}')">Dashboard</div>
            </li>
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('emergency')">Emergency</div>
            </li>
            <li class="nav-item dropdown">
                <div class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button">
                    <i class="fas fa-user me-1"></i>${App.currentUser.firstName || 'User'}
                    ${getNotificationBadge()}
                </div>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="#" onclick="switchDashboardContent('${role}-profile')">Profile</a></li>
                    <li><a class="dropdown-item" href="#" onclick="showNotifications()">Notifications</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" onclick="logout()">Logout</a></li>
                </ul>
            </li>
        `);
    } else {
        // Guest navigation
        navLinks.append(`
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('home')">Home</div>
            </li>
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('about')">About</div>
            </li>
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('login')">Login</div>
            </li>
            <li class="nav-item">
                <div class="nav-link" onclick="navigateToPage('signup')">Sign Up</div>
            </li>
        `);
    }
}

/**
 * Update navigation active states
 */
function updateNavigationActive(pageId) {
    $('.nav-link').removeClass('active');
    $('.sidebar-link').removeClass('active');
    
    // Activate appropriate nav link
    $('.nav-link').each(function() {
        const onclick = $(this).attr('onclick');
        if (onclick && onclick.includes(pageId)) {
            $(this).addClass('active');
        }
    });
}

/**
 * Initialize navigation handlers
 */
function initializeNavigation() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
        const hash = location.hash.substring(1);
        if (hash) {
            navigateToPage(hash);
        } else {
            navigateToPage('home');
        }
    });
    
    // Set initial page from URL hash
    const hash = location.hash.substring(1);
    if (hash) {
        navigateToPage(hash);
    }
}

/**
 * Initialize common event listeners
 */
function initializeEventListeners() {
    // Password toggle functionality
    $(document).on('click', '[id^="toggle"][id$="Password"]', function() {
        const targetId = $(this).attr('id').replace('toggle', '').replace('Password', 'Password');
        const target = $(`#${targetId}`);
        const icon = $(this).find('i');
        
        if (target.attr('type') === 'password') {
            target.attr('type', 'text');
            icon.removeClass('fa-eye').addClass('fa-eye-slash');
        } else {
            target.attr('type', 'password');
            icon.removeClass('fa-eye-slash').addClass('fa-eye');
        }
    });
    
    // Image preview functionality
    $(document).on('change', 'input[type="file"]', function(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewContainer = $(e.target).siblings('#imagePreview, .image-preview');
                if (previewContainer.length) {
                    previewContainer.show().find('img').attr('src', e.target.result);
                }
                
                // Update profile avatar if this is profile image
                if ($(e.target).attr('id').includes('profile') || $(e.target).attr('id').includes('Profile')) {
                    updateProfileAvatar(e.target.result);
                }
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Search functionality
    $(document).on('input', '[id$="Search"]', function() {
        const searchTerm = $(this).val().toLowerCase();
        const targetTable = $(this).attr('id').replace('Search', 'Table');
        filterTable(targetTable, searchTerm);
    });
    
    // Filter functionality
    $(document).on('change', '[id$="Filter"]', function() {
        const filterValue = $(this).val();
        const targetTable = $(this).attr('id').replace('Filter', 'Table');
        filterTableByColumn(targetTable, filterValue);
    });
    
    // Sidebar navigation
    $(document).on('click', '.sidebar-link', function(e) {
        e.preventDefault();
        const target = $(this).data('target');
        if (target) {
            switchDashboardContent(target);
        }
    });
}

/**
 * Initialize date inputs
 */
function initializeDateInputs() {
    const today = new Date().toISOString().split('T')[0];
    $('input[type="date"]').attr('min', today);
}

/**
 * Load page-specific data
 */
function loadPageData(pageId) {
    switch (pageId) {
        case 'patient-dashboard':
            if (typeof loadPatientDashboard === 'function') {
                loadPatientDashboard();
            }
            break;
        case 'doctor-dashboard':
            if (typeof loadDoctorDashboard === 'function') {
                loadDoctorDashboard();
            }
            break;
        case 'admin-dashboard':
            if (typeof loadAdminDashboard === 'function') {
                loadAdminDashboard();
            }
            break;
    }
}

/**
 * Switch dashboard content sections
 */
function switchDashboardContent(targetId) {
    // Hide all dashboard content
    $('.dashboard-content').removeClass('active');
    
    // Show target content
    $(`#${targetId}`).addClass('active');
    
    // Update sidebar active state
    $('.sidebar-link').removeClass('active');
    $(`.sidebar-link[data-target="${targetId}"]`).addClass('active');
    
    // Load content-specific data
    loadContentData(targetId);
}

/**
 * Load content-specific data
 */
function loadContentData(contentId) {
    switch (contentId) {
        case 'patient-overview':
            if (typeof loadPatientOverview === 'function') {
                loadPatientOverview();
            }
            break;
        case 'patient-appointments':
            if (typeof loadPatientAppointments === 'function') {
                loadPatientAppointments();
            }
            break;
        case 'patient-prescriptions':
            if (typeof loadPatientPrescriptions === 'function') {
                loadPatientPrescriptions();
            }
            break;
        case 'doctor-queue':
            if (typeof loadDoctorQueue === 'function') {
                loadDoctorQueue();
            }
            break;
        case 'admin-analytics':
            if (typeof loadAdminAnalytics === 'function') {
                loadAdminAnalytics();
            }
            break;
    }
}

/**
 * Utility functions
 */

/**
 * Show alert message
 */
function showAlert(message, type = 'info', duration = 5000) {
    const alertHtml = `
        <div class="alert alert-${type} alert-custom alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    $('#alertContainer').append(alertHtml);
    
    // Auto-dismiss after duration
    setTimeout(() => {
        $('#alertContainer .alert').first().alert('close');
    }, duration);
}

/**
 * Format date for display
 */
function formatDate(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Format date and time for display
 */
function formatDateTime(date) {
    if (!date) return 'N/A';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Generate unique ID
 */
function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

/**
 * Filter table by search term
 */
function filterTable(tableId, searchTerm) {
    $(`#${tableId} tbody tr`).each(function() {
        const rowText = $(this).text().toLowerCase();
        if (rowText.includes(searchTerm)) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/**
 * Filter table by column value
 */
function filterTableByColumn(tableId, filterValue) {
    if (!filterValue) {
        $(`#${tableId} tbody tr`).show();
        return;
    }
    
    $(`#${tableId} tbody tr`).each(function() {
        const rowText = $(this).text().toLowerCase();
        if (rowText.includes(filterValue.toLowerCase())) {
            $(this).show();
        } else {
            $(this).hide();
        }
    });
}

/**
 * Update profile avatar
 */
function updateProfileAvatar(imageSrc) {
    $('.profile-avatar').html(`<img src="${imageSrc}" alt="Profile">`);
}

/**
 * Notification management
 */
function loadNotifications() {
    const notifications = localStorage.getItem('medicare_notifications');
    if (notifications) {
        try {
            App.notifications = JSON.parse(notifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
            App.notifications = [];
        }
    }
}

function addNotification(title, message, type = 'info') {
    const notification = {
        id: generateId(),
        title,
        message,
        type,
        timestamp: new Date().toISOString(),
        read: false
    };
    
    App.notifications.unshift(notification);
    
    // Keep only last 50 notifications
    if (App.notifications.length > 50) {
        App.notifications = App.notifications.slice(0, 50);
    }
    
    saveNotifications();
    updateNotificationBadge();
    
    // Show toast notification
    showAlert(`${title}: ${message}`, type, 3000);
}

function markNotificationAsRead(notificationId) {
    const notification = App.notifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        saveNotifications();
        updateNotificationBadge();
    }
}

function saveNotifications() {
    localStorage.setItem('medicare_notifications', JSON.stringify(App.notifications));
}

function getNotificationBadge() {
    const unreadCount = App.notifications.filter(n => !n.read).length;
    return unreadCount > 0 ? `<span class="notification-badge">${unreadCount}</span>` : '';
}

function updateNotificationBadge() {
    $('.notification-badge').remove();
    const badge = getNotificationBadge();
    if (badge) {
        $('.dropdown-toggle').append(badge);
    }
}

function showNotifications() {
    // Implementation for notification modal would go here
    console.log('Show notifications modal');
}

/**
 * Logout functionality
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('medicare_user');
        App.currentUser = null;
        updateNavigationForRole(null);
        navigateToPage('home');
        showAlert('You have been logged out successfully.', 'info');
    }
}

/**
 * Data validation utilities
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\+]?[1-9][\d]{0,15}$/;
    return re.test(phone.replace(/[\s\-\(\)]/g, ''));
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

/**
 * Local storage utilities
 */
function saveToStorage(key, data) {
    try {
        localStorage.setItem(`medicare_${key}`, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to storage:', error);
        return false;
    }
}

function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(`medicare_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error loading from storage:', error);
        return null;
    }
}

function removeFromStorage(key) {
    localStorage.removeItem(`medicare_${key}`);
}

/**
 * Export utilities for other modules
 */
window.App = App;
window.navigateToPage = navigateToPage;
window.switchDashboardContent = switchDashboardContent;
window.showAlert = showAlert;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.generateId = generateId;
window.addNotification = addNotification;
window.validateEmail = validateEmail;
window.validatePhone = validatePhone;
window.validatePassword = validatePassword;
window.saveToStorage = saveToStorage;
window.loadFromStorage = loadFromStorage;
window.removeFromStorage = removeFromStorage;
window.logout = logout;

console.log('App.js loaded successfully');
