// API Configuration for Resume Matching
const RESUME_MATCH_API_URL = 'https://web-production-4db85.up.railway.app/api/v1/match-resumes';

// DOM Elements
const resumeMatchForm = document.getElementById('resumeMatchForm');
const jobDescriptionInput = document.getElementById('jobDescription');
const submitBtn = document.getElementById('submitBtn');

// Section Elements
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');

// Results Elements
const jobDescriptionSummary = document.getElementById('jobDescriptionSummary');
const resumesGrid = document.getElementById('resumesGrid');
const resultsCount = document.getElementById('resultsCount');

// Common Elements
const errorMessage = document.getElementById('errorMessage');
const loadingTitle = document.getElementById('loadingTitle');
const loadingSubtitle = document.getElementById('loadingSubtitle');
const loadingSteps = document.getElementById('loadingSteps');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
});

// Form Functionality
function initializeForm() {
    resumeMatchForm.addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const jobDescription = jobDescriptionInput.value.trim();
    
    if (!jobDescription) {
        showError('Please enter a job description.');
        return;
    }
    
    await searchResumes(jobDescription);
}

// API Integration
async function searchResumes(jobDescription) {
    try {
        showLoading();
        
        const response = await fetch(RESUME_MATCH_API_URL, {
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
        displayResults(data, jobDescription);
        
    } catch (error) {
        console.error('Error searching resumes:', error);
        showError(`Failed to search resumes: ${error.message}`);
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
function displayResults(data, jobDescription) {
    hideAllSections();
    resultsSection.style.display = 'block';
    
    displayJobDescriptionSummary(data, jobDescription);
    displayResumes(data.candidates, data.total_found);
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function displayJobDescriptionSummary(data, jobDescription) {
    const summaryHTML = `
        <div class="summary-header">
            <i class="fas fa-clipboard-list"></i>
            <h3>Job Description Analysis</h3>
        </div>
        <div class="summary-content">
            <div class="summary-item">
                <h4>Search Query</h4>
                <p class="job-description-text">${escapeHtml(data.search_query || jobDescription)}</p>
            </div>
            ${data.total_found ? `
                <div class="summary-item">
                    <h4>Results</h4>
                    <p><strong>${data.total_found}</strong> matching resumes found</p>
                    <p><small>Search completed in ${data.search_time_ms || 0}ms at ${new Date(data.timestamp).toLocaleString()}</small></p>
                </div>
            ` : ''}
        </div>
    `;
    
    jobDescriptionSummary.innerHTML = summaryHTML;
}

function displayResumes(candidates, totalFound) {
    resultsCount.textContent = `${totalFound || 0} resumes found`;
    
    if (!candidates || candidates.length === 0) {
        resumesGrid.innerHTML = `
            <div class="no-resumes">
                <i class="fas fa-file-pdf"></i>
                <h3>No matching resumes found</h3>
                <p>Try adjusting your job description or requirements.</p>
            </div>
        `;
        return;
    }
    
    const resumesHTML = candidates.map(candidate => createResumeCard(candidate)).join('');
    resumesGrid.innerHTML = resumesHTML;
}

function createResumeCard(candidate) {
    const matchScore = Math.round(candidate.match_score || 0);
    const experience = candidate.experience_years ? `${candidate.experience_years} years experience` : 'Experience not specified';
    
    // Limit skills display to first 10 skills
    const displaySkills = candidate.skills ? candidate.skills.slice(0, 10) : [];
    const remainingSkills = candidate.skills ? candidate.skills.length - 10 : 0;
    
    // Get job titles and companies
    const jobTitles = candidate.job_titles && candidate.job_titles.length > 0 
        ? candidate.job_titles.join(', ') 
        : '';
    
    const companies = candidate.companies && candidate.companies.length > 0 
        ? candidate.companies.join(', ') 
        : '';
    
    return `
        <div class="resume-card">
            <div class="resume-header">
                <div class="resume-info">
                    <h3 class="resume-name">${escapeHtml(candidate.name || 'Unknown Candidate')}</h3>
                    
                    <div class="resume-contact">
                        ${candidate.email ? `
                            <div>
                                <i class="fas fa-envelope"></i>
                                <span>${escapeHtml(candidate.email)}</span>
                            </div>
                        ` : ''}
                        ${candidate.phone ? `
                            <div>
                                <i class="fas fa-phone"></i>
                                <span>${escapeHtml(candidate.phone)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="resume-experience">${escapeHtml(experience)}</div>
                </div>
                <div class="match-score">${matchScore}% Match</div>
            </div>
            
            ${candidate.summary ? `
                <div class="resume-summary">${escapeHtml(candidate.summary.substring(0, 300))}${candidate.summary.length > 300 ? '...' : ''}</div>
            ` : ''}
            
            ${displaySkills.length > 0 ? `
                <div class="resume-skills">
                    <h4>Key Skills (${candidate.skills.length})</h4>
                    <div class="skills-list">
                        ${displaySkills.map(skill => 
                            `<span class="skill-tag">${escapeHtml(skill)}</span>`
                        ).join('')}
                        ${remainingSkills > 0 ? `<span class="skill-tag more-skills">+${remainingSkills} more</span>` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${jobTitles ? `
                <div class="resume-titles">
                    <h4>Job Titles</h4>
                    <p>${escapeHtml(jobTitles)}</p>
                </div>
            ` : ''}
            
            ${companies ? `
                <div class="resume-companies">
                    <h4>Companies</h4>
                    <p>${escapeHtml(companies)}</p>
                </div>
            ` : ''}
            
            ${candidate.education && candidate.education.length > 0 ? `
                <div class="resume-education">
                    <h4>Education</h4>
                    <p>${escapeHtml(candidate.education.join(', '))}</p>
                </div>
            ` : ''}
            
            ${candidate.match_explanation ? `
                <div class="match-explanation">
                    <h4>Match Details</h4>
                    <p>${escapeHtml(candidate.match_explanation)}</p>
                </div>
            ` : ''}
            
            <div class="resume-actions">
                ${candidate.resume_url ? `
                    <a href="${candidate.resume_url}" target="_blank" rel="noopener noreferrer" class="view-resume-btn">
                        <i class="fas fa-file-pdf"></i>
                        View Resume
                    </a>
                ` : ''}
                ${candidate.email ? `
                    <a href="mailto:${candidate.email}" class="contact-resume-btn">
                        <i class="fas fa-envelope"></i>
                        Contact
                    </a>
                ` : ''}
            </div>
            
            ${candidate.file_name ? `
                <div class="resume-file-info">
                    <small><i class="fas fa-file"></i> ${escapeHtml(candidate.file_name)}</small>
                </div>
            ` : ''}
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
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) uploadSection.style.display = 'none';
    loadingSection.style.display = 'none';
    resultsSection.style.display = 'none';
    errorSection.style.display = 'none';
}

function resetForm() {
    hideAllSections();
    const uploadSection = document.querySelector('.upload-section');
    if (uploadSection) uploadSection.style.display = 'block';
    resumeMatchForm.reset();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Global reset function for retry button
window.resetForm = resetForm;
