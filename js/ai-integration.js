/**
 * MediCare+ Hospital Management System - AI Integration Module
 * Handles AI-powered features including symptom analysis, image analysis, and triage
 */

// AI Integration module state
const AIIntegration = {
    isProcessing: false,
    confidenceThreshold: 80,
    analysisHistory: [],
    models: {
        symptomAnalyzer: true,
        imageAnalyzer: true,
        triageSystem: true,
        prescriptionSuggester: true
    }
};

// Medical knowledge base for AI responses
const MedicalKnowledge = {
    symptoms: {
        'fever': { urgency: 'medium', specialties: ['general', 'infectious-disease'] },
        'chest pain': { urgency: 'high', specialties: ['cardiology', 'emergency'] },
        'headache': { urgency: 'low', specialties: ['neurology', 'general'] },
        'shortness of breath': { urgency: 'high', specialties: ['cardiology', 'pulmonology'] },
        'nausea': { urgency: 'low', specialties: ['gastroenterology', 'general'] },
        'dizziness': { urgency: 'medium', specialties: ['neurology', 'cardiology'] },
        'fatigue': { urgency: 'low', specialties: ['general', 'endocrinology'] },
        'joint pain': { urgency: 'low', specialties: ['orthopedics', 'rheumatology'] },
        'skin rash': { urgency: 'low', specialties: ['dermatology'] },
        'abdominal pain': { urgency: 'medium', specialties: ['gastroenterology', 'general'] }
    },
    
    conditions: {
        'common_cold': {
            probability: 0.85,
            symptoms: ['runny nose', 'sore throat', 'mild fever', 'fatigue'],
            urgency: 'low',
            treatment: 'Rest, fluids, over-the-counter medications',
            specialty: 'general'
        },
        'hypertension': {
            probability: 0.75,
            symptoms: ['headache', 'dizziness', 'chest pain'],
            urgency: 'medium',
            treatment: 'Lifestyle changes, antihypertensive medications',
            specialty: 'cardiology'
        },
        'migraine': {
            probability: 0.70,
            symptoms: ['severe headache', 'nausea', 'light sensitivity'],
            urgency: 'medium',
            treatment: 'Pain relief medications, rest in dark room',
            specialty: 'neurology'
        },
        'allergic_reaction': {
            probability: 0.65,
            symptoms: ['skin rash', 'itching', 'swelling'],
            urgency: 'medium',
            treatment: 'Antihistamines, avoid triggers',
            specialty: 'allergology'
        }
    },
    
    medications: {
        'pain': ['Acetaminophen 500mg', 'Ibuprofen 200mg', 'Naproxen 220mg'],
        'fever': ['Acetaminophen 500mg', 'Aspirin 325mg', 'Ibuprofen 400mg'],
        'allergy': ['Loratadine 10mg', 'Cetirizine 10mg', 'Diphenhydramine 25mg'],
        'hypertension': ['Lisinopril 10mg', 'Amlodipine 5mg', 'Metoprolol 50mg'],
        'infection': ['Amoxicillin 500mg', 'Azithromycin 250mg', 'Cephalexin 500mg']
    }
};

/**
 * Initialize AI Integration module
 */
$(document).ready(function() {
    initializeAIIntegration();
});

function initializeAIIntegration() {
    // Load AI settings
    loadAISettings();
    
    // Initialize AI models (mock initialization)
    initializeAIModels();
    
    console.log('AI Integration module initialized');
}

/**
 * Load AI settings from storage
 */
function loadAISettings() {
    const settings = loadFromStorage('ai_settings');
    if (settings) {
        AIIntegration.confidenceThreshold = settings.confidenceThreshold || 80;
        AIIntegration.models.triageSystem = settings.autoTriage !== false;
    }
}

/**
 * Initialize AI models (mock)
 */
function initializeAIModels() {
    // Simulate model loading
    Object.keys(AIIntegration.models).forEach(model => {
        console.log(`AI Model ${model} loaded successfully`);
    });
}

/**
 * Analyze symptoms using AI
 * @param {string} symptoms - Patient's symptom description
 * @param {object} patientInfo - Additional patient information
 * @returns {Promise} Analysis results
 */
function analyzeSymptoms(symptoms, patientInfo = {}) {
    return new Promise((resolve) => {
        AIIntegration.isProcessing = true;
        
        // Simulate AI processing time
        setTimeout(() => {
            const analysis = performSymptomAnalysis(symptoms, patientInfo);
            
            // Save to analysis history
            AIIntegration.analysisHistory.push({
                id: generateId(),
                type: 'symptom_analysis',
                input: symptoms,
                result: analysis,
                timestamp: new Date().toISOString(),
                patientId: patientInfo.patientId
            });
            
            AIIntegration.isProcessing = false;
            resolve(analysis);
        }, 2000 + Math.random() * 1000); // Random delay 2-3 seconds
    });
}

/**
 * Perform symptom analysis logic
 */
function performSymptomAnalysis(symptoms, patientInfo) {
    const normalizedSymptoms = symptoms.toLowerCase();
    const detectedSymptoms = [];
    let maxUrgency = 'low';
    const possibleConditions = [];
    
    // Detect symptoms in text
    Object.keys(MedicalKnowledge.symptoms).forEach(symptom => {
        if (normalizedSymptoms.includes(symptom)) {
            detectedSymptoms.push(symptom);
            const urgency = MedicalKnowledge.symptoms[symptom].urgency;
            if (getUrgencyLevel(urgency) > getUrgencyLevel(maxUrgency)) {
                maxUrgency = urgency;
            }
        }
    });
    
    // Find matching conditions
    Object.keys(MedicalKnowledge.conditions).forEach(conditionKey => {
        const condition = MedicalKnowledge.conditions[conditionKey];
        let matchScore = 0;
        
        condition.symptoms.forEach(condSymptom => {
            if (detectedSymptoms.some(detected => 
                detected.includes(condSymptom.toLowerCase()) || 
                condSymptom.toLowerCase().includes(detected)
            )) {
                matchScore++;
            }
        });
        
        if (matchScore > 0) {
            possibleConditions.push({
                name: conditionKey.replace('_', ' ').toUpperCase(),
                probability: Math.min(95, condition.probability * 100 + (matchScore * 10)),
                treatment: condition.treatment,
                specialty: condition.specialty,
                urgency: condition.urgency
            });
        }
    });
    
    // Sort by probability
    possibleConditions.sort((a, b) => b.probability - a.probability);
    
    // Generate recommendations
    const recommendations = generateRecommendations(maxUrgency, detectedSymptoms);
    
    // Calculate confidence based on symptom matches
    const confidence = Math.min(95, 60 + (detectedSymptoms.length * 10));
    
    return {
        detectedSymptoms,
        primaryCondition: possibleConditions[0] || {
            name: 'General Health Concern',
            probability: 50,
            treatment: 'Consult with healthcare provider',
            specialty: 'general',
            urgency: maxUrgency
        },
        alternativeConditions: possibleConditions.slice(1, 3),
        urgencyLevel: maxUrgency,
        confidence,
        recommendations,
        suggestedSpecialty: getSuggestedSpecialty(detectedSymptoms),
        triageScore: calculateTriageScore(maxUrgency, detectedSymptoms.length, patientInfo),
        requiresImmediateAttention: maxUrgency === 'high',
        followUpRecommended: true,
        disclaimerShown: true
    };
}

/**
 * Analyze medical images using AI
 * @param {File} imageFile - Medical image file
 * @param {string} imageType - Type of medical image (x-ray, mri, ct, etc.)
 * @param {object} patientInfo - Patient information
 * @returns {Promise} Analysis results
 */
function analyzeMedicalImage(imageFile, imageType = 'unknown', patientInfo = {}) {
    return new Promise((resolve) => {
        AIIntegration.isProcessing = true;
        
        // Simulate AI processing time (longer for image analysis)
        setTimeout(() => {
            const analysis = performImageAnalysis(imageFile, imageType, patientInfo);
            
            // Save to analysis history
            AIIntegration.analysisHistory.push({
                id: generateId(),
                type: 'image_analysis',
                imageType,
                result: analysis,
                timestamp: new Date().toISOString(),
                patientId: patientInfo.patientId
            });
            
            AIIntegration.isProcessing = false;
            resolve(analysis);
        }, 3000 + Math.random() * 2000); // Random delay 3-5 seconds
    });
}

/**
 * Perform image analysis logic
 */
function performImageAnalysis(imageFile, imageType, patientInfo) {
    const imageAnalysisResults = {
        'x-ray': [
            {
                confidence: 89,
                findings: 'Clear lung fields with normal cardiac silhouette. No acute abnormalities detected.',
                recommendation: 'Continue routine monitoring. Results within normal limits.',
                followUp: 'routine',
                severity: 'normal'
            },
            {
                confidence: 76,
                findings: 'Mild infiltrate in lower right lung field. Possible early pneumonia.',
                recommendation: 'Antibiotic therapy recommended. Follow-up chest X-ray in 1 week.',
                followUp: 'urgent',
                severity: 'mild'
            },
            {
                confidence: 84,
                findings: 'Normal bone structure and alignment. No fractures or dislocations observed.',
                recommendation: 'No acute intervention required. Consider physiotherapy if pain persists.',
                followUp: 'routine',
                severity: 'normal'
            }
        ],
        'mri': [
            {
                confidence: 91,
                findings: 'Brain tissue appears normal with good gray-white matter differentiation.',
                recommendation: 'No abnormal findings. Continue current treatment plan.',
                followUp: 'routine',
                severity: 'normal'
            },
            {
                confidence: 73,
                findings: 'Small area of increased signal intensity in white matter. Clinical correlation needed.',
                recommendation: 'Neurology consultation recommended for further evaluation.',
                followUp: 'priority',
                severity: 'mild'
            }
        ],
        'ct': [
            {
                confidence: 87,
                findings: 'No acute intracranial abnormalities. Normal brain parenchyma.',
                recommendation: 'Reassuring findings. Continue symptomatic management.',
                followUp: 'routine',
                severity: 'normal'
            },
            {
                confidence: 82,
                findings: 'Normal abdominal organs with no signs of acute pathology.',
                recommendation: 'No immediate concerns. Consider dietary modifications.',
                followUp: 'routine',
                severity: 'normal'
            }
        ],
        'unknown': [
            {
                confidence: 65,
                findings: 'Image quality adequate for preliminary assessment. No obvious abnormalities.',
                recommendation: 'Professional radiological review recommended for definitive interpretation.',
                followUp: 'routine',
                severity: 'normal'
            }
        ]
    };
    
    const possibleResults = imageAnalysisResults[imageType.toLowerCase()] || imageAnalysisResults['unknown'];
    const selectedResult = possibleResults[Math.floor(Math.random() * possibleResults.length)];
    
    // Add some randomization to confidence
    const confidence = Math.max(50, Math.min(95, selectedResult.confidence + (Math.random() - 0.5) * 10));
    
    return {
        imageType: imageType.toUpperCase(),
        confidence: Math.round(confidence),
        findings: selectedResult.findings,
        recommendation: selectedResult.recommendation,
        severity: selectedResult.severity,
        followUpPriority: selectedResult.followUp,
        requiresSpecialistReview: confidence < AIIntegration.confidenceThreshold,
        suggestedSpecialty: getSpecialtyForImageType(imageType),
        qualityScore: Math.round(80 + Math.random() * 15), // Image quality score
        processingTime: '2.3 seconds',
        modelVersion: 'MediAI-Vision-v2.1',
        disclaimerShown: true,
        additionalRecommendations: generateImageRecommendations(selectedResult.severity, imageType)
    };
}

/**
 * Generate AI prescription suggestions
 * @param {string} diagnosis - Primary diagnosis
 * @param {object} patientInfo - Patient information including age, allergies, etc.
 * @param {array} symptoms - List of symptoms
 * @returns {Promise} Prescription suggestions
 */
function generatePrescriptionSuggestions(diagnosis, patientInfo = {}, symptoms = []) {
    return new Promise((resolve) => {
        AIIntegration.isProcessing = true;
        
        setTimeout(() => {
            const suggestions = performPrescriptionAnalysis(diagnosis, patientInfo, symptoms);
            
            AIIntegration.analysisHistory.push({
                id: generateId(),
                type: 'prescription_suggestion',
                diagnosis,
                result: suggestions,
                timestamp: new Date().toISOString(),
                patientId: patientInfo.patientId
            });
            
            AIIntegration.isProcessing = false;
            resolve(suggestions);
        }, 1500);
    });
}

/**
 * Perform prescription analysis
 */
function performPrescriptionAnalysis(diagnosis, patientInfo, symptoms) {
    const normalizedDiagnosis = diagnosis.toLowerCase();
    let medicationCategory = 'general';
    
    // Determine medication category
    if (normalizedDiagnosis.includes('pain') || normalizedDiagnosis.includes('ache')) {
        medicationCategory = 'pain';
    } else if (normalizedDiagnosis.includes('fever') || normalizedDiagnosis.includes('temperature')) {
        medicationCategory = 'fever';
    } else if (normalizedDiagnosis.includes('allerg') || normalizedDiagnosis.includes('rash')) {
        medicationCategory = 'allergy';
    } else if (normalizedDiagnosis.includes('hypertension') || normalizedDiagnosis.includes('blood pressure')) {
        medicationCategory = 'hypertension';
    } else if (normalizedDiagnosis.includes('infection') || normalizedDiagnosis.includes('bacterial')) {
        medicationCategory = 'infection';
    }
    
    const suggestedMedications = MedicalKnowledge.medications[medicationCategory] || 
                                MedicalKnowledge.medications['pain'];
    
    // Generate dosage and instructions
    const prescriptionItems = suggestedMedications.map(med => ({
        medication: med,
        dosage: generateDosage(med, patientInfo.age),
        frequency: generateFrequency(medicationCategory),
        duration: generateDuration(medicationCategory),
        instructions: generateInstructions(med, medicationCategory)
    }));
    
    const precautions = generatePrecautions(medicationCategory, patientInfo);
    const interactions = checkInteractions(suggestedMedications, patientInfo.currentMedications || []);
    
    return {
        primaryMedications: prescriptionItems.slice(0, 2),
        alternativeMedications: prescriptionItems.slice(2),
        precautions,
        interactions,
        lifestyle: generateLifestyleRecommendations(diagnosis),
        followUp: generateFollowUpInstructions(diagnosis),
        confidence: Math.round(75 + Math.random() * 20),
        warningsPresent: interactions.length > 0 || precautions.length > 2,
        requiresDoctorReview: true,
        pharmacyNotes: 'Verify patient allergies before dispensing',
        disclaimerShown: true
    };
}

/**
 * Calculate triage score for patient prioritization
 * @param {string} urgency - Urgency level from symptom analysis
 * @param {number} symptomCount - Number of detected symptoms
 * @param {object} patientInfo - Patient information
 * @returns {object} Triage score and priority
 */
function calculateTriageScore(urgency, symptomCount, patientInfo = {}) {
    let baseScore = 0;
    
    // Base score from urgency
    switch (urgency) {
        case 'high': baseScore = 80; break;
        case 'medium': baseScore = 50; break;
        case 'low': baseScore = 20; break;
        default: baseScore = 30;
    }
    
    // Adjust for symptom count
    baseScore += Math.min(20, symptomCount * 5);
    
    // Adjust for age (elderly get higher priority)
    if (patientInfo.age && patientInfo.age > 65) {
        baseScore += 15;
    } else if (patientInfo.age && patientInfo.age < 12) {
        baseScore += 10; // Children also get priority
    }
    
    // Adjust for chronic conditions
    if (patientInfo.chronicConditions && patientInfo.chronicConditions.length > 0) {
        baseScore += 10;
    }
    
    // Cap the score at 100
    baseScore = Math.min(100, baseScore);
    
    // Determine priority level
    let priority = 'low';
    if (baseScore >= 70) priority = 'high';
    else if (baseScore >= 40) priority = 'medium';
    
    return {
        score: baseScore,
        priority,
        estimatedWaitTime: calculateWaitTime(priority),
        recommendedAction: getRecommendedAction(priority),
        triageNotes: generateTriageNotes(urgency, symptomCount, patientInfo)
    };
}

/**
 * Get AI analysis history
 * @param {string} patientId - Patient ID (optional)
 * @param {string} type - Analysis type filter (optional)
 * @returns {array} Analysis history
 */
function getAnalysisHistory(patientId = null, type = null) {
    let history = AIIntegration.analysisHistory;
    
    if (patientId) {
        history = history.filter(analysis => analysis.patientId === patientId);
    }
    
    if (type) {
        history = history.filter(analysis => analysis.type === type);
    }
    
    return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Generate health insights based on patient data
 * @param {object} patientData - Comprehensive patient information
 * @returns {object} Health insights and recommendations
 */
function generateHealthInsights(patientData) {
    const insights = {
        riskFactors: [],
        preventiveRecommendations: [],
        lifestyleInsights: [],
        followUpRecommendations: []
    };
    
    // Age-based insights
    if (patientData.age > 40) {
        insights.preventiveRecommendations.push('Annual cardiovascular screening');
        insights.preventiveRecommendations.push('Regular blood pressure monitoring');
    }
    
    if (patientData.age > 50) {
        insights.preventiveRecommendations.push('Colonoscopy screening');
        insights.preventiveRecommendations.push('Bone density testing');
    }
    
    // BMI-based insights (if weight/height available)
    if (patientData.bmi) {
        if (patientData.bmi > 30) {
            insights.riskFactors.push('Obesity');
            insights.lifestyleInsights.push('Weight management program recommended');
        } else if (patientData.bmi < 18.5) {
            insights.riskFactors.push('Underweight');
            insights.lifestyleInsights.push('Nutritional consultation recommended');
        }
    }
    
    // Allergy considerations
    if (patientData.allergies && patientData.allergies.length > 0) {
        insights.riskFactors.push('Known allergies: ' + patientData.allergies.join(', '));
    }
    
    return insights;
}

// Utility functions for AI analysis

function getUrgencyLevel(urgency) {
    const levels = { 'low': 1, 'medium': 2, 'high': 3 };
    return levels[urgency] || 1;
}

function generateRecommendations(urgency, symptoms) {
    const recommendations = [];
    
    if (urgency === 'high') {
        recommendations.push('Seek immediate medical attention');
        recommendations.push('Consider emergency room visit if symptoms worsen');
    } else if (urgency === 'medium') {
        recommendations.push('Schedule appointment with healthcare provider within 24-48 hours');
        recommendations.push('Monitor symptoms closely');
    } else {
        recommendations.push('Schedule routine appointment with primary care physician');
        recommendations.push('Rest and maintain good hydration');
    }
    
    // Symptom-specific recommendations
    if (symptoms.includes('fever')) {
        recommendations.push('Take temperature regularly and record');
        recommendations.push('Use fever-reducing medications as needed');
    }
    
    if (symptoms.includes('chest pain')) {
        recommendations.push('Avoid physical exertion');
        recommendations.push('Seek immediate help if pain worsens');
    }
    
    return recommendations;
}

function getSuggestedSpecialty(symptoms) {
    const specialtyMap = {
        'chest pain': 'cardiology',
        'headache': 'neurology',
        'joint pain': 'orthopedics',
        'skin rash': 'dermatology',
        'abdominal pain': 'gastroenterology'
    };
    
    for (const symptom of symptoms) {
        if (specialtyMap[symptom]) {
            return specialtyMap[symptom];
        }
    }
    
    return 'general';
}

function getSpecialtyForImageType(imageType) {
    const specialtyMap = {
        'x-ray': 'radiology',
        'mri': 'radiology',
        'ct': 'radiology',
        'ultrasound': 'radiology',
        'ecg': 'cardiology',
        'eeg': 'neurology'
    };
    
    return specialtyMap[imageType.toLowerCase()] || 'radiology';
}

function generateImageRecommendations(severity, imageType) {
    const recommendations = [];
    
    if (severity === 'normal') {
        recommendations.push('Continue current treatment plan');
        recommendations.push('Follow up as scheduled');
    } else {
        recommendations.push('Specialist consultation recommended');
        recommendations.push('Additional tests may be required');
    }
    
    return recommendations;
}

function generateDosage(medication, age) {
    const dosages = {
        'Acetaminophen 500mg': age && age < 12 ? '250mg' : '500mg',
        'Ibuprofen 200mg': age && age < 12 ? '100mg' : '200mg',
        'Amoxicillin 500mg': age && age < 12 ? '250mg' : '500mg'
    };
    
    return dosages[medication] || '1 tablet';
}

function generateFrequency(category) {
    const frequencies = {
        'pain': 'Every 6-8 hours as needed',
        'fever': 'Every 4-6 hours as needed',
        'allergy': 'Once daily',
        'hypertension': 'Once daily',
        'infection': 'Twice daily'
    };
    
    return frequencies[category] || 'As directed';
}

function generateDuration(category) {
    const durations = {
        'pain': '3-5 days',
        'fever': '3-5 days',
        'allergy': '7-14 days',
        'hypertension': 'Ongoing',
        'infection': '7-10 days'
    };
    
    return durations[category] || '5-7 days';
}

function generateInstructions(medication, category) {
    const instructions = [
        'Take with food to reduce stomach irritation',
        'Take with a full glass of water',
        'Do not exceed recommended dosage',
        'Complete the full course even if feeling better',
        'Take at the same time each day'
    ];
    
    return instructions[Math.floor(Math.random() * instructions.length)];
}

function generatePrecautions(category, patientInfo) {
    const precautions = [];
    
    if (patientInfo.age && patientInfo.age > 65) {
        precautions.push('Elderly patients may require dosage adjustment');
    }
    
    if (patientInfo.allergies && patientInfo.allergies.includes('penicillin') && category === 'infection') {
        precautions.push('Patient has penicillin allergy - alternative antibiotic recommended');
    }
    
    precautions.push('Monitor for side effects and report to healthcare provider');
    precautions.push('Do not consume alcohol while taking this medication');
    
    return precautions;
}

function checkInteractions(medications, currentMeds) {
    const interactions = [];
    
    if (currentMeds && currentMeds.length > 0) {
        interactions.push('Check for interactions with current medications');
    }
    
    return interactions;
}

function generateLifestyleRecommendations(diagnosis) {
    const recommendations = [
        'Maintain adequate hydration',
        'Get sufficient rest and sleep',
        'Eat a balanced diet rich in nutrients',
        'Engage in regular appropriate physical activity',
        'Avoid smoking and excessive alcohol consumption'
    ];
    
    return recommendations.slice(0, 3);
}

function generateFollowUpInstructions(diagnosis) {
    return {
        timeframe: '1-2 weeks',
        conditions: 'if symptoms persist or worsen',
        specialist: diagnosis.includes('chronic') ? 'specialist consultation' : 'primary care follow-up'
    };
}

function calculateWaitTime(priority) {
    const waitTimes = {
        'high': '0-15 minutes',
        'medium': '15-45 minutes',
        'low': '45-90 minutes'
    };
    
    return waitTimes[priority] || '30-60 minutes';
}

function getRecommendedAction(priority) {
    const actions = {
        'high': 'Immediate assessment required',
        'medium': 'Prompt medical evaluation',
        'low': 'Routine medical consultation'
    };
    
    return actions[priority] || 'Medical evaluation recommended';
}

function generateTriageNotes(urgency, symptomCount, patientInfo) {
    const notes = [];
    
    if (urgency === 'high') {
        notes.push('High priority case requiring immediate attention');
    }
    
    if (symptomCount > 3) {
        notes.push('Multiple symptoms reported - comprehensive assessment needed');
    }
    
    if (patientInfo.age && patientInfo.age > 65) {
        notes.push('Elderly patient - increased priority');
    }
    
    return notes.join('; ');
}

// Export functions for global use
window.AIIntegration = AIIntegration;
window.analyzeSymptoms = analyzeSymptoms;
window.analyzeMedicalImage = analyzeMedicalImage;
window.generatePrescriptionSuggestions = generatePrescriptionSuggestions;
window.calculateTriageScore = calculateTriageScore;
window.getAnalysisHistory = getAnalysisHistory;
window.generateHealthInsights = generateHealthInsights;

console.log('AI Integration module loaded successfully');
