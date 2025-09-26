// API Configuration
const JOBS_API_URL = 'https://web-production-4db85.up.railway.app/api/v1/search-jobs';
const CANDIDATES_API_URL = 'https://web-production-4db85.up.railway.app/api/v1/find-candidates';

// DOM Elements - Jobs
const jobForm = document.getElementById('jobSearchForm');
const fileInput = document.getElementById('resumeFile');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');
const removeFileBtn = document.getElementById('removeFile');
const locationInput = document.getElementById('location');
const submitBtn = document.getElementById('submitBtn');

// DOM Elements - Candidates
const candidateForm = document.getElementById('candidateSearchForm');
const jobDescriptionInput = document.getElementById('jobDescription');
const candidateSubmitBtn = document.getElementById('candidateSubmitBtn');

// Navigation Elements
const jobsTab = document.getElementById('jobsTab');
const candidatesTab = document.getElementById('candidatesTab');
const headerSubtitle = document.getElementById('headerSubtitle');

// Section Elements
const uploadSection = document.querySelector('.upload-section');
const candidateSection = document.getElementById('candidateSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const candidatesResultsSection = document.getElementById('candidatesResultsSection');
const errorSection = document.getElementById('errorSection');

// Results Elements - Jobs
const resumeSummary = document.getElementById('resumeSummary');
const jobsGrid = document.getElementById('jobsGrid');
const resultsCount = document.getElementById('resultsCount');

// Results Elements - Candidates
const jobDescriptionSummary = document.getElementById('jobDescriptionSummary');
const candidatesGrid = document.getElementById('candidatesGrid');
const candidatesResultsCount = document.getElementById('candidatesResultsCount');

// Common Elements
const errorMessage = document.getElementById('errorMessage');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSubtitle = document.getElementById('loadingSubtitle');
const loadingSteps = document.getElementById('loadingSteps');

// State
let selectedFile = null;
let currentMode = 'jobs'; // 'jobs' or 'candidates'

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    initializeForm();
    initializeCandidateForm();
});

// File Upload Functionality
function initializeFileUpload() {
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    fileUploadArea.addEventListener('click', () => fileInput.click());
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    // Remove file
    removeFileBtn.addEventListener('click', removeFile);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        validateAndSetFile(file);
    }
}

function handleDragOver(event) {
    event.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleFileDrop(event) {
    event.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        validateAndSetFile(files[0]);
    }
}

function validateAndSetFile(file) {
    // Validate file type
    if (file.type !== 'application/pdf') {
        showError('Please select a PDF file only.');
        return;
    }
    
    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        showError('File size must be less than 10MB.');
        return;
    }
    
    selectedFile = file;
    showFilePreview(file);
}

function showFilePreview(file) {
    fileUploadArea.style.display = 'none';
    filePreview.style.display = 'flex';
    filePreview.querySelector('.file-name').textContent = file.name;
}

function removeFile() {
    selectedFile = null;
    fileInput.value = '';
    fileUploadArea.style.display = 'block';
    filePreview.style.display = 'none';
}

// Form Functionality
function initializeForm() {
    jobForm.addEventListener('submit', handleFormSubmit);
}

function initializeCandidateForm() {
    candidateForm.addEventListener('submit', handleCandidateFormSubmit);
}

// Tab Switching
function switchTab(mode) {
    currentMode = mode;
    
    // Update tab states
    jobsTab.classList.toggle('active', mode === 'jobs');
    candidatesTab.classList.toggle('active', mode === 'candidates');
    
    // Update header subtitle
    if (mode === 'jobs') {
        headerSubtitle.textContent = 'Upload your resume and discover perfect job matches from LinkedIn';
    } else {
        headerSubtitle.textContent = 'Describe your ideal candidate and find matching profiles from LinkedIn';
    }
    
    // Show/hide appropriate sections
    hideAllSections();
    if (mode === 'jobs') {
        uploadSection.style.display = 'block';
    } else {
        candidateSection.style.display = 'block';
    }
}

// Make switchTab globally available
window.switchTab = switchTab;

async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!selectedFile) {
        showError('Please select a PDF resume file.');
        return;
    }
    
    const location = locationInput.value.trim();
    const maxResults = '20'; // Fixed to 20 jobs
    
    if (!location) {
        showError('Please select a location.');
        return;
    }
    
    await searchJobs(selectedFile, location, maxResults);
}

async function handleCandidateFormSubmit(event) {
    event.preventDefault();
    
    const jobDescription = jobDescriptionInput.value.trim();
    
    if (!jobDescription) {
        showError('Please enter a job description.');
        return;
    }
    
    await searchCandidates(jobDescription);
}

// API Integration
async function searchJobs(file, location, maxResults) {
    try {
        showLoading();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('location', location);
        formData.append('max_results', maxResults);
        
        const response = await fetch(JOBS_API_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        displayResults(data);
        
    } catch (error) {
        console.error('Error searching jobs:', error);
        showError(`Failed to search jobs: ${error.message}`);
    }
}

async function searchCandidates(jobDescription) {
    try {
        showLoading('candidates');
        
        const response = await fetch(CANDIDATES_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                job_description: jobDescription
            })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        displayCandidateResults(data, jobDescription);
        
    } catch (error) {
        console.error('Error searching candidates:', error);
        showError(`Failed to search candidates: ${error.message}`);
    }
}

// Loading Animation
function showLoading(mode = 'jobs') {
    hideAllSections();
    loadingSection.style.display = 'block';
    
    // Update loading text based on mode
    if (mode === 'candidates') {
        loadingTitle.textContent = 'Analyzing Job Description';
        loadingSubtitle.textContent = 'Our AI is scanning LinkedIn for matching candidates...';
        loadingSteps.innerHTML = `
            <div class="step active">
                <i class="fas fa-clipboard-list"></i>
                <span>Processing Description</span>
            </div>
            <div class="step">
                <i class="fas fa-users"></i>
                <span>Searching Candidates</span>
            </div>
            <div class="step">
                <i class="fas fa-chart-line"></i>
                <span>Calculating Matches</span>
            </div>
        `;
    } else {
        loadingTitle.textContent = 'Analyzing Your Resume';
        loadingSubtitle.textContent = 'Our AI is scanning LinkedIn for the perfect job matches...';
        loadingSteps.innerHTML = `
            <div class="step active">
                <i class="fas fa-file-text"></i>
                <span>Parsing Resume</span>
            </div>
            <div class="step">
                <i class="fas fa-search"></i>
                <span>Searching Jobs</span>
            </div>
            <div class="step">
                <i class="fas fa-chart-line"></i>
                <span>Calculating Matches</span>
            </div>
        `;
    }
    
    // Animate loading steps
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        setTimeout(() => {
            steps.forEach(s => s.classList.remove('active'));
            step.classList.add('active');
        }, index * 2000);
    });
}

// Results Display
function displayResults(data) {
    hideAllSections();
    resultsSection.style.display = 'block';
    
    displayResumeSummary(data.resume_summary);
    displayJobs(data.jobs, data.total_found);
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayCandidateResults(data, jobDescription) {
    hideAllSections();
    candidatesResultsSection.style.display = 'block';
    
    displayJobDescriptionSummary(jobDescription);
    displayCandidates(data.candidates);
    
    // Scroll to results
    candidatesResultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayResumeSummary(summary) {
    const summaryHTML = `
        <div class="summary-header">
            <i class="fas fa-user-circle"></i>
            <h3>Resume Analysis</h3>
        </div>
        <div class="summary-content">
            ${summary.email ? `
                <div class="summary-item">
                    <h4>Contact Information</h4>
                    <p><strong>Email:</strong> ${summary.email}</p>
                    ${summary.phone ? `<p><strong>Phone:</strong> ${summary.phone}</p>` : ''}
                </div>
            ` : ''}
            
            ${summary.experience_level ? `
                <div class="summary-item">
                    <h4>Experience Level</h4>
                    <p>${capitalizeFirst(summary.experience_level)}</p>
                </div>
            ` : ''}
            
            ${summary.skills && summary.skills.length > 0 ? `
                <div class="summary-item">
                    <h4>Key Skills (${summary.skills.length})</h4>
                    <div class="skills-list">
                        ${summary.skills.slice(0, 10).map(skill => 
                            `<span class="skill-tag">${skill}</span>`
                        ).join('')}
                        ${summary.skills.length > 10 ? `<span class="skill-tag">+${summary.skills.length - 10} more</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${summary.job_titles && summary.job_titles.length > 0 ? `
                <div class="summary-item">
                    <h4>Job Titles</h4>
                    <p>${summary.job_titles.join(', ')}</p>
                </div>
            ` : ''}
        </div>
    `;
    
    resumeSummary.innerHTML = summaryHTML;
}

function displayJobDescriptionSummary(jobDescription) {
    const summaryHTML = `
        <div class="summary-header">
            <i class="fas fa-clipboard-list"></i>
            <h3>Job Description Analysis</h3>
        </div>
        <div class="summary-content">
            <div class="summary-item">
                <h4>Job Requirements</h4>
                <p class="job-description-text">${escapeHtml(jobDescription)}</p>
            </div>
        </div>
    `;
    
    jobDescriptionSummary.innerHTML = summaryHTML;
}

function displayCandidates(candidates) {
    candidatesResultsCount.textContent = `${candidates ? candidates.length : 0} candidates found`;
    
    if (!candidates || candidates.length === 0) {
        candidatesGrid.innerHTML = `
            <div class="no-candidates">
                <i class="fas fa-users"></i>
                <h3>No candidates found</h3>
                <p>Try adjusting your job description or requirements.</p>
            </div>
        `;
        return;
    }
    
    const candidatesHTML = candidates.map(candidate => createCandidateCard(candidate)).join('');
    candidatesGrid.innerHTML = candidatesHTML;
}

function displayJobs(jobs, totalFound) {
    resultsCount.textContent = `${totalFound} jobs found`;
    
    if (!jobs || jobs.length === 0) {
        jobsGrid.innerHTML = `
            <div class="no-jobs">
                <i class="fas fa-search"></i>
                <h3>No jobs found</h3>
                <p>Try adjusting your search criteria or location.</p>
            </div>
        `;
        return;
    }
    
    const jobsHTML = jobs.map(job => createJobCard(job)).join('');
    jobsGrid.innerHTML = jobsHTML;
}

function createJobCard(job) {
    const matchScore = Math.round(job.match_score || 0);
    const description = job.description && job.description !== 'No description available' 
        ? job.description 
        : 'Job description not available. Click to view full details on LinkedIn.';
    
    return `
        <div class="job-card">
            <div class="job-header">
                <h3 class="job-title">${escapeHtml(job.title)}</h3>
                <div class="match-score">${matchScore}% Match</div>
            </div>
            
            <div class="job-company">${escapeHtml(job.company)}</div>
            
            ${job.location && job.location !== 'Unknown Location' ? `
                <div class="job-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(job.location)}</span>
                </div>
            ` : ''}
            
            <div class="job-description">${escapeHtml(description)}</div>
            
            <div class="job-meta">
                ${job.employment_type ? `
                    <span class="employment-type">${escapeHtml(job.employment_type)}</span>
                ` : ''}
                ${job.posted_date ? `
                    <span class="posted-date">Posted: ${formatDate(job.posted_date)}</span>
                ` : ''}
            </div>
            
            ${job.matched_keywords && job.matched_keywords.length > 0 ? `
                <div class="matched-keywords">
                    ${job.matched_keywords.map(keyword => 
                        `<span class="keyword-tag">${escapeHtml(keyword)}</span>`
                    ).join('')}
                </div>
            ` : ''}
            
            <div class="job-actions">
                <a href="${job.job_url}" target="_blank" rel="noopener noreferrer" class="view-job-btn">
                    <i class="fas fa-external-link-alt"></i>
                    View on LinkedIn
                </a>
            </div>
        </div>
    `;
}

function createCandidateCard(candidate) {
    const matchScore = Math.round(candidate.match_score || 0);
    const experience = candidate.years_of_experience || 'Not specified';
    const location = candidate.location || 'Location not specified';
    
    // Limit skills display to first 8 skills
    const displaySkills = candidate.skills ? candidate.skills.slice(0, 8) : [];
    const remainingSkills = candidate.skills ? candidate.skills.length - 8 : 0;
    
    // Get current position or default position title
    const currentTitle = candidate.current_title || candidate.default_position_title || 'Professional';
    
    // Get current employer
    const currentEmployer = candidate.employer && candidate.employer.length > 0 
        ? candidate.employer.find(emp => emp.is_default)?.company_name || candidate.employer[0]?.company_name
        : 'Not specified';
    
    return `
        <div class="candidate-card">
            <div class="candidate-header">
                <div class="candidate-info">
                    ${candidate.profile_picture_url ? `
                        <img src="${candidate.profile_picture_url}" alt="${escapeHtml(candidate.name)}" class="candidate-avatar">
                    ` : `
                        <div class="candidate-avatar-placeholder">
                            <i class="fas fa-user"></i>
                        </div>
                    `}
                    <div class="candidate-details">
                        <h3 class="candidate-name">${escapeHtml(candidate.name)}</h3>
                        <p class="candidate-title">${escapeHtml(currentTitle)}</p>
                        <p class="candidate-company">${escapeHtml(currentEmployer)}</p>
                    </div>
                </div>
                <div class="match-score">${matchScore}% Match</div>
            </div>
            
            <div class="candidate-meta">
                <div class="candidate-location">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${escapeHtml(location)}</span>
                </div>
                <div class="candidate-experience">
                    <i class="fas fa-briefcase"></i>
                    <span>${escapeHtml(experience)} experience</span>
                </div>
                ${candidate.num_of_connections ? `
                    <div class="candidate-connections">
                        <i class="fas fa-users"></i>
                        <span>${candidate.num_of_connections} connections</span>
                    </div>
                ` : ''}
            </div>
            
            ${candidate.headline ? `
                <div class="candidate-headline">${escapeHtml(candidate.headline)}</div>
            ` : ''}
            
            ${candidate.summary ? `
                <div class="candidate-summary">${escapeHtml(candidate.summary.substring(0, 300))}${candidate.summary.length > 300 ? '...' : ''}</div>
            ` : ''}
            
            ${displaySkills.length > 0 ? `
                <div class="candidate-skills">
                    <h4>Key Skills</h4>
                    <div class="skills-list">
                        ${displaySkills.map(skill => 
                            `<span class="skill-tag">${escapeHtml(skill)}</span>`
                        ).join('')}
                        ${remainingSkills > 0 ? `<span class="skill-tag more-skills">+${remainingSkills} more</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${candidate.education_background && candidate.education_background.length > 0 ? `
                <div class="candidate-education">
                    <h4>Education</h4>
                    <p class="education-item">
                        <strong>${escapeHtml(candidate.education_background[0].degree_name || 'Degree')}</strong>
                        ${candidate.education_background[0].field_of_study ? ` in ${escapeHtml(candidate.education_background[0].field_of_study)}` : ''}
                        <br>
                        <span class="education-school">${escapeHtml(candidate.education_background[0].institute_name || 'Institution')}</span>
                    </p>
                </div>
            ` : ''}
            
            ${candidate.match_explanation ? `
                <div class="match-explanation">
                    <h4>Match Details</h4>
                    <p>${escapeHtml(candidate.match_explanation)}</p>
                </div>
            ` : ''}
            
            <div class="candidate-actions">
                <a href="${candidate.linkedin_profile_url}" target="_blank" rel="noopener noreferrer" class="view-profile-btn">
                    <i class="fab fa-linkedin"></i>
                    View LinkedIn Profile
                </a>
                ${candidate.emails && candidate.emails.length > 0 ? `
                    <a href="mailto:${candidate.emails[0]}" class="contact-btn">
                        <i class="fas fa-envelope"></i>
                        Contact
                    </a>
                ` : ''}
            </div>
        </div>
    `;
}

// Error Handling
function showError(message) {
    hideAllSections();
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// Utility Functions
function hideAllSections() {
    uploadSection.style.display = 'none';
    candidateSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    candidatesResultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetForm() {
    hideAllSections();
    
    // Show appropriate section based on current mode
    if (currentMode === 'candidates') {
        candidateSection.style.display = 'block';
        candidateForm.reset();
    } else {
        uploadSection.style.display = 'block';
        removeFile();
        jobForm.reset();
        locationInput.value = 'Remote';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    } catch {
        return dateString;
    }
}

// Global reset function for retry button
window.resetForm = resetForm;
