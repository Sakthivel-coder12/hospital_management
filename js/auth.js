/**
 * MediCare+ Hospital Management System - Authentication Module
 * Handles user login, signup, and session management
 */

// Authentication state
const Auth = {
    isAuthenticating: false,
    passwordStrength: 0
};

// Initialize authentication module
$(document).ready(function() {
    initializeAuth();
});

/**
 * Initialize authentication functionality
 */
function initializeAuth() {
    // Login form handler
    $('#loginForm').on('submit', handleLogin);
    
    // Signup form handler
    $('#signupForm').on('submit', handleSignup);
    
    // Forgot password form handler
    $('#forgotPasswordForm').on('submit', handleForgotPassword);
    
    // Emergency form handler
    $('#emergencyForm').on('submit', handleEmergencyBooking);
    
    // Password strength checker
    $('#signupPassword').on('input', checkPasswordStrength);
    
    // Confirm password validation
    $('#confirmPassword').on('input', validatePasswordMatch);
    
    // Step navigation for signup
    window.nextStep = nextStep;
    window.prevStep = prevStep;
    
    console.log('Authentication module initialized');
}

/**
 * Handle user login
 */
function handleLogin(e) {
    e.preventDefault();
    
    if (Auth.isAuthenticating) return;
    
    const email = $('#loginEmail').val();
    const password = $('#loginPassword').val();
    const role = $('#loginRole').val();
    const rememberMe = $('#rememberMe').is(':checked');
    
    // Validate inputs
    if (!validateLoginForm(email, password, role)) {
        return;
    }
    
    Auth.isAuthenticating = true;
    const submitBtn = $('#loginForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="loading-spinner"></span> Logging in...').prop('disabled', true);
    
    // Simulate API call
    setTimeout(() => {
        authenticateUser(email, password, role, rememberMe);
        Auth.isAuthenticating = false;
        submitBtn.html(originalText).prop('disabled', false);
    }, 1500);
}

/**
 * Validate login form
 */
function validateLoginForm(email, password, role) {
    let isValid = true;
    
    // Clear previous errors
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').text('');
    
    // Email validation
    if (!email) {
        showFieldError('loginEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('loginEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Password validation
    if (!password) {
        showFieldError('loginPassword', 'Password is required');
        isValid = false;
    }
    
    // Role validation
    if (!role) {
        showFieldError('loginRole', 'Please select a role');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Authenticate user (mock authentication)
 */
function authenticateUser(email, password, role, rememberMe) {
    // Mock user data - In a real app, this would come from server
    const mockUsers = {
        'patient@medicare.com': {
            id: 'pat_001',
            email: 'patient@medicare.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'patient',
            phone: '+1-555-0123',
            age: 35,
            gender: 'male',
            bloodGroup: 'O+',
            joinDate: '2023-01-15'
        },
        'doctor@medicare.com': {
            id: 'doc_001',
            email: 'doctor@medicare.com',
            firstName: 'Dr. Sarah',
            lastName: 'Johnson',
            role: 'doctor',
            phone: '+1-555-0124',
            specialization: 'cardiology',
            experience: 12,
            license: 'MD123456',
            joinDate: '2020-03-10'
        },
        'admin@medicare.com': {
            id: 'adm_001',
            email: 'admin@medicare.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            phone: '+1-555-0125',
            joinDate: '2019-01-01'
        }
    };
    
    // Check credentials
    const user = mockUsers[email.toLowerCase()];
    
    if (user && user.role === role && password === 'password123') {
        // Successful login
        App.currentUser = user;
        
        // Save to localStorage
        if (rememberMe) {
            localStorage.setItem('medicare_user', JSON.stringify(user));
        } else {
            sessionStorage.setItem('medicare_user', JSON.stringify(user));
        }
        
        // Update navigation
        updateNavigationForRole(role);
        
        // Navigate to dashboard
        navigateToPage(`${role}-dashboard`);
        
        // Show success message
        showAlert(`Welcome back, ${user.firstName}!`, 'success');
        
        // Add notification
        addNotification('Login Successful', `Logged in as ${role}`, 'success');
        
    } else {
        // Failed login
        showAlert('Invalid credentials. Please check your email, password, and role.', 'danger');
        
        // For demo purposes, show valid credentials
        showAlert(`Demo credentials: patient@medicare.com / doctor@medicare.com / admin@medicare.com with password: password123`, 'info', 8000);
    }
}

/**
 * Handle user signup
 */
function handleSignup(e) {
    e.preventDefault();
    
    if (Auth.isAuthenticating) return;
    
    // Get form data
    const formData = {
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        email: $('#signupEmail').val(),
        phone: $('#phone').val(),
        role: $('#signupRole').val(),
        password: $('#signupPassword').val(),
        confirmPassword: $('#confirmPassword').val(),
        profilePicture: $('#profilePicture')[0].files[0]
    };
    
    // Validate form
    if (!validateSignupForm(formData)) {
        return;
    }
    
    Auth.isAuthenticating = true;
    const submitBtn = $('#signupForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="loading-spinner"></span> Creating Account...').prop('disabled', true);
    
    // Simulate API call
    setTimeout(() => {
        createUserAccount(formData);
        Auth.isAuthenticating = false;
        submitBtn.html(originalText).prop('disabled', false);
    }, 2000);
}

/**
 * Validate signup form
 */
function validateSignupForm(formData) {
    let isValid = true;
    
    // Clear previous errors
    $('.form-control').removeClass('is-invalid');
    $('.invalid-feedback').text('');
    
    // First name validation
    if (!formData.firstName.trim()) {
        showFieldError('firstName', 'First name is required');
        isValid = false;
    }
    
    // Last name validation
    if (!formData.lastName.trim()) {
        showFieldError('lastName', 'Last name is required');
        isValid = false;
    }
    
    // Email validation
    if (!formData.email) {
        showFieldError('signupEmail', 'Email is required');
        isValid = false;
    } else if (!validateEmail(formData.email)) {
        showFieldError('signupEmail', 'Please enter a valid email address');
        isValid = false;
    }
    
    // Phone validation
    if (!formData.phone) {
        showFieldError('phone', 'Phone number is required');
        isValid = false;
    } else if (!validatePhone(formData.phone)) {
        showFieldError('phone', 'Please enter a valid phone number');
        isValid = false;
    }
    
    // Role validation
    if (!formData.role) {
        showFieldError('signupRole', 'Please select a role');
        isValid = false;
    }
    
    // Password validation
    if (!formData.password) {
        showFieldError('signupPassword', 'Password is required');
        isValid = false;
    } else if (!validatePassword(formData.password)) {
        showFieldError('signupPassword', 'Password must be at least 8 characters with uppercase, lowercase, and number');
        isValid = false;
    }
    
    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Create user account (mock)
 */
function createUserAccount(formData) {
    // Create user object
    const newUser = {
        id: generateId(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.toLowerCase(),
        phone: formData.phone,
        role: formData.role,
        joinDate: new Date().toISOString(),
        isActive: true
    };
    
    // Store user data
    const existingUsers = loadFromStorage('users') || [];
    
    // Check if email already exists
    if (existingUsers.find(user => user.email === newUser.email)) {
        showAlert('An account with this email already exists.', 'danger');
        return;
    }
    
    // Add new user
    existingUsers.push(newUser);
    saveToStorage('users', existingUsers);
    
    // Auto-login the new user
    App.currentUser = newUser;
    localStorage.setItem('medicare_user', JSON.stringify(newUser));
    
    // Update navigation
    updateNavigationForRole(newUser.role);
    
    // Navigate to dashboard
    navigateToPage(`${newUser.role}-dashboard`);
    
    // Show success message
    showAlert(`Account created successfully! Welcome to MediCare+, ${newUser.firstName}!`, 'success');
    
    // Add notification
    addNotification('Account Created', 'Welcome to MediCare+!', 'success');
}

/**
 * Handle forgot password
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = $('#resetEmail').val();
    
    if (!email) {
        showAlert('Please enter your email address.', 'danger');
        return;
    }
    
    if (!validateEmail(email)) {
        showAlert('Please enter a valid email address.', 'danger');
        return;
    }
    
    // Simulate sending reset email
    const submitBtn = $('#forgotPasswordForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="loading-spinner"></span> Sending...').prop('disabled', true);
    
    setTimeout(() => {
        $('#forgotPasswordModal').modal('hide');
        showAlert('Password reset link has been sent to your email address.', 'success');
        submitBtn.html(originalText).prop('disabled', false);
        $('#resetEmail').val('');
    }, 1500);
}

/**
 * Handle emergency booking
 */
function handleEmergencyBooking(e) {
    e.preventDefault();
    
    const emergencyData = {
        name: $('#emergencyName').val(),
        phone: $('#emergencyPhone').val(),
        symptoms: $('#emergencySymptoms').val(),
        location: $('#emergencyLocation').val(),
        conscious: $('#consciousCheck').is(':checked')
    };
    
    // Validate emergency form
    if (!emergencyData.name || !emergencyData.phone || !emergencyData.symptoms) {
        showAlert('Please fill in all required fields.', 'danger');
        return;
    }
    
    // Submit emergency request
    const submitBtn = $('#emergencyForm button[type="submit"]');
    const originalText = submitBtn.html();
    submitBtn.html('<span class="loading-spinner"></span> Processing Emergency Request...').prop('disabled', true);
    
    setTimeout(() => {
        // Generate emergency ID
        const emergencyId = 'EMG_' + generateId().substr(-6).toUpperCase();
        
        // Store emergency data
        const emergencies = loadFromStorage('emergencies') || [];
        emergencies.push({
            id: emergencyId,
            ...emergencyData,
            timestamp: new Date().toISOString(),
            status: 'pending',
            assignedDoctor: 'Dr. Emergency Team',
            estimatedArrival: '8-12 minutes'
        });
        saveToStorage('emergencies', emergencies);
        
        // Show success message
        showAlert(
            `Emergency request submitted successfully! Emergency ID: ${emergencyId}. 
            Medical team has been notified and will arrive in approximately 8-12 minutes.`, 
            'success', 
            10000
        );
        
        // Reset form
        $('#emergencyForm')[0].reset();
        submitBtn.html(originalText).prop('disabled', false);
        
        // Add notification to doctors
        addNotification('Emergency Alert', `New emergency case: ${emergencyData.name}`, 'danger');
        
    }, 2000);
}

/**
 * Password strength checker
 */
function checkPasswordStrength() {
    const password = $('#signupPassword').val();
    const strengthBar = $('#passwordStrength');
    const strengthText = $('#passwordStrengthText');
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strength === 0) {
        feedback = 'Enter a password';
        strengthBar.removeClass('bg-danger bg-warning bg-success').addClass('bg-secondary');
    } else if (strength < 50) {
        feedback = 'Weak password';
        strengthBar.removeClass('bg-warning bg-success bg-secondary').addClass('bg-danger');
    } else if (strength < 100) {
        feedback = 'Medium strength';
        strengthBar.removeClass('bg-danger bg-success bg-secondary').addClass('bg-warning');
    } else {
        feedback = 'Strong password';
        strengthBar.removeClass('bg-danger bg-warning bg-secondary').addClass('bg-success');
    }
    
    strengthBar.css('width', strength + '%');
    strengthText.text(feedback);
    Auth.passwordStrength = strength;
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
    const password = $('#signupPassword').val();
    const confirmPassword = $('#confirmPassword').val();
    const confirmField = $('#confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        confirmField.addClass('is-invalid');
        confirmField.siblings('.invalid-feedback').text('Passwords do not match');
    } else {
        confirmField.removeClass('is-invalid');
        confirmField.siblings('.invalid-feedback').text('');
    }
}

/**
 * Multi-step form navigation
 */
function nextStep(step) {
    if (validateCurrentStep(step - 1)) {
        $(`#step${step}-tab`).tab('show');
    }
}

function prevStep(step) {
    $(`#step${step}-tab`).tab('show');
}

/**
 * Validate current step
 */
function validateCurrentStep(step) {
    let isValid = true;
    
    switch (step) {
        case 1:
            // Validate step 1 fields
            const firstName = $('#firstName').val();
            const lastName = $('#lastName').val();
            const email = $('#signupEmail').val();
            const phone = $('#phone').val();
            const role = $('#signupRole').val();
            
            if (!firstName || !lastName || !email || !phone || !role) {
                showAlert('Please fill in all required fields in Step 1.', 'warning');
                isValid = false;
            } else if (!validateEmail(email)) {
                showAlert('Please enter a valid email address.', 'warning');
                isValid = false;
            } else if (!validatePhone(phone)) {
                showAlert('Please enter a valid phone number.', 'warning');
                isValid = false;
            }
            break;
            
        case 2:
            // Validate step 2 fields
            const password = $('#signupPassword').val();
            const confirmPassword = $('#confirmPassword').val();
            
            if (!password || !confirmPassword) {
                showAlert('Please enter and confirm your password.', 'warning');
                isValid = false;
            } else if (Auth.passwordStrength < 75) {
                showAlert('Please choose a stronger password.', 'warning');
                isValid = false;
            } else if (password !== confirmPassword) {
                showAlert('Passwords do not match.', 'warning');
                isValid = false;
            }
            break;
    }
    
    return isValid;
}

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const field = $(`#${fieldId}`);
    field.addClass('is-invalid');
    field.siblings('.invalid-feedback').text(message);
}

/**
 * Export functions for global use
 */
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.handleForgotPassword = handleForgotPassword;
window.handleEmergencyBooking = handleEmergencyBooking;

console.log('Auth.js loaded successfully');
