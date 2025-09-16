// API Configuration
const API_URL = 'https://web-production-4db85.up.railway.app/api/v1/search-jobs';

// DOM Elements
const jobForm = document.getElementById('jobSearchForm');
const fileInput = document.getElementById('resumeFile');
const fileUploadArea = document.getElementById('fileUploadArea');
const filePreview = document.getElementById('filePreview');
const removeFileBtn = document.getElementById('removeFile');
const locationInput = document.getElementById('location');
const submitBtn = document.getElementById('submitBtn');

// Section Elements
const uploadSection = document.querySelector('.upload-section');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

// Results Elements
const resumeSummary = document.getElementById('resumeSummary');
const jobsGrid = document.getElementById('jobsGrid');
const resultsCount = document.getElementById('resultsCount');
const errorMessage = document.getElementById('errorMessage');

// State
let selectedFile = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeFileUpload();
    initializeForm();
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

// API Integration
async function searchJobs(file, location, maxResults) {
    try {
        showLoading();
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('location', location);
        formData.append('max_results', maxResults);
        
        const response = await fetch(API_URL, {
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

// Loading Animation
function showLoading() {
    hideAllSections();
    loadingSection.style.display = 'block';
    
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

// Error Handling
function showError(message) {
    hideAllSections();
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
}

// Utility Functions
function hideAllSections() {
    uploadSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetForm() {
    hideAllSections();
    uploadSection.style.display = 'block';
    removeFile();
    jobForm.reset();
    locationInput.value = 'Remote';
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
