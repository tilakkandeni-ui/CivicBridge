// Admin Dashboard Management
class AdminManager {
    constructor() {
        this.allReports = [];
        this.init();
    }

    init() {
        this.loadAllReports();
    }

    loadAllReports() {
        try {
            this.allReports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
            return this.allReports;
        } catch (error) {
            console.error('Error loading reports:', error);
            this.allReports = [];
            return [];
        }
    }

    getAdminDashboardHTML() {
        const reports = this.loadAllReports();
        const stats = this.calculateStats(reports);
        
        return `
            <div class="container">
                <div class="dashboard-header">
                    <div>
                        <h2><i class="fas fa-user-shield"></i> Admin Dashboard</h2>
                        <p>Manage all reported issues in the system</p>
                        <small style="color: var(--text-color); opacity: 0.7;">
                            Logged in as: ${localStorage.getItem('adminUser') || 'Administrator'} (Administrator)
                        </small>
                    </div>
                    <button class="btn btn-primary" id="refreshAdminDashboardBtn">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                </div>

                <div class="dashboard-stats">
                    <div class="dashboard-stat-card">
                        <div class="dashboard-stat-number">${stats.total}</div>
                        <div class="dashboard-stat-label">Total Reports</div>
                    </div>
                    <div class="dashboard-stat-card">
                        <div class="dashboard-stat-number">${stats.pending}</div>
                        <div class="dashboard-stat-label">Pending</div>
                    </div>
                    <div class="dashboard-stat-card">
                        <div class="dashboard-stat-number">${stats.inProgress}</div>
                        <div class="dashboard-stat-label">In Progress</div>
                    </div>
                    <div class="dashboard-stat-card">
                        <div class="dashboard-stat-number">${stats.resolved}</div>
                        <div class="dashboard-stat-label">Resolved</div>
                    </div>
                </div>

                <div class="admin-controls">
                    <div class="search-filter">
                        <input type="text" id="adminSearch" class="form-control" placeholder="Search reports...">
                        <select id="statusFilter" class="form-control">
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                        </select>
                        <select id="userFilter" class="form-control">
                            <option value="all">All Users</option>
                            ${this.getUserFilterOptions()}
                        </select>
                    </div>
                </div>

                <div class="admin-issues-list" id="adminIssuesList">
                    ${this.renderAdminIssuesList(reports)}
                </div>
            </div>
        `;
    }

    getUserFilterOptions() {
        const reports = this.loadAllReports();
        const users = [...new Set(reports.map(report => report.userName || report.userId || 'Unknown User'))];
        return users.map(user => `<option value="${user}">${user}</option>`).join('');
    }

    calculateStats(reports) {
        return {
            total: reports.length,
            pending: reports.filter(r => r.status === 'pending').length,
            inProgress: reports.filter(r => r.status === 'in-progress').length,
            resolved: reports.filter(r => r.status === 'resolved').length
        };
    }

    renderAdminIssuesList(reports) {
        if (reports.length === 0) {
            return `
                <div class="no-issues">
                    <i class="fas fa-inbox"></i>
                    <h3>No issues reported yet</h3>
                    <p>No users have reported any issues in the system.</p>
                </div>
            `;
        }

        // Sort by timestamp (newest first)
        const sortedReports = reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return sortedReports.map(report => `
            <div class="issue-card admin-issue-card" data-report-id="${report.id}">
                <div class="issue-header">
                    <div>
                        <div class="issue-title">${this.formatIssueType(report.issueType)}</div>
                        <div class="issue-meta">
                            <span class="issue-type">
                                <i class="fas fa-user"></i> Reported by: ${report.userName || report.userId || 'Unknown User'}
                            </span>
                            <span class="issue-date">
                                <i class="fas fa-calendar"></i> ${report.timestamp ? new Date(report.timestamp).toLocaleDateString() : 'Unknown date'}
                            </span>
                        </div>
                    </div>
                    <div class="status-controls">
                        <select class="status-select" data-report-id="${report.id}" onchange="adminManager.updateIssueStatus(${report.id}, this.value)">
                            <option value="pending" ${(report.status || 'pending') === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in-progress" ${(report.status || 'pending') === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${(report.status || 'pending') === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                        <span class="status-badge status-${report.status || 'pending'}">
                            ${(report.status || 'pending').replace('-', ' ')}
                        </span>
                    </div>
                </div>
                <div class="issue-description">
                    <strong>Description:</strong> ${report.description || 'No description provided'}
                </div>
                <div class="issue-details">
                    <div class="detail-item">
                        <strong><i class="fas fa-map-marker-alt"></i> Location:</strong> 
                        ${report.address || 'Location not specified'}
                    </div>
                    ${report.location ? `
                        <div class="detail-item">
                            <strong><i class="fas fa-globe"></i> Coordinates:</strong> 
                            ${report.location.lat.toFixed(6)}, ${report.location.lng.toFixed(6)}
                        </div>
                    ` : ''}
                    ${report.photos && report.photos.length > 0 ? `
                        <div class="detail-item">
                            <strong><i class="fas fa-camera"></i> Photos:</strong> 
                            ${report.photos.length} attached
                        </div>
                    ` : ''}
                </div>
                <div class="admin-issue-actions">
                    <button class="btn btn-outline btn-small" onclick="adminManager.viewIssueDetails(${report.id})">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminManager.addAdminComment(${report.id})">
                        <i class="fas fa-comment"></i> Add Comment
                    </button>
                    ${report.photos && report.photos.length > 0 ? `
                        <button class="btn btn-outline btn-small" onclick="adminManager.viewPhotos(${report.id})">
                            <i class="fas fa-images"></i> View Photos (${report.photos.length})
                        </button>
                    ` : ''}
                    <button class="btn btn-danger btn-small" onclick="adminManager.deleteIssue(${report.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
                ${report.adminComment ? `
                    <div class="admin-comment">
                        <strong><i class="fas fa-user-shield"></i> Admin Comment:</strong>
                        <p>${report.adminComment}</p>
                        <small>Updated: ${report.adminCommentTimestamp ? new Date(report.adminCommentTimestamp).toLocaleString() : 'Recently'} 
                        by ${report.updatedBy || 'Administrator'}</small>
                    </div>
                ` : ''}
                ${report.photos && report.photos.length > 0 ? `
                <div class="detail-section">
                    <h3><i class="fas fa-camera"></i> Photos</h3>
                    <div class="photo-gallery">
                        ${report.photos.map((photo, index) => `
                            <img src="${photo}" alt="Photo ${index + 1}" style="width:100px; margin:5px; cursor:pointer;"
                                onclick="adminManager.viewPhotos(${report.id})">
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                ${report.statusUpdated ? `
                    <div class="status-update-info">
                        <small>Status last updated: ${new Date(report.statusUpdated).toLocaleString()} 
                        by ${report.updatedBy || 'Administrator'}</small>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    formatIssueType(issueType) {
        if (!issueType) return 'General Issue';
        return issueType.charAt(0).toUpperCase() + issueType.slice(1).replace('_', ' ') + ' Issue';
    }

    updateIssueStatus(reportId, newStatus) {
        try {
            const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
            const reportIndex = reports.findIndex(r => r.id === reportId);
            
            if (reportIndex !== -1) {
                const oldStatus = reports[reportIndex].status || 'pending';
                reports[reportIndex].status = newStatus;
                reports[reportIndex].statusUpdated = new Date().toISOString();
                reports[reportIndex].updatedBy = localStorage.getItem('adminUser') || 'Administrator';
                
                localStorage.setItem('CivicBridge_reports', JSON.stringify(reports));
                
                // Update the status badge immediately
                const issueCard = document.querySelector(`[data-report-id="${reportId}"]`);
                if (issueCard) {
                    const statusBadge = issueCard.querySelector('.status-badge');
                    const statusSelect = issueCard.querySelector('.status-select');
                    
                    if (statusBadge) {
                        statusBadge.className = `status-badge status-${newStatus}`;
                        statusBadge.textContent = newStatus.replace('-', ' ');
                    }
                    
                    if (statusSelect) {
                        statusSelect.value = newStatus;
                    }
                }
                
                showAlert(`Issue status updated from ${oldStatus} to ${newStatus}`, 'success');
                
                // Refresh stats
                this.refreshAdminDashboard();
            } else {
                showAlert('Issue not found', 'error');
            }
        } catch (error) {
            console.error('Error updating issue status:', error);
            showAlert('Error updating issue status', 'error');
        }
    }

    addAdminComment(reportId) {
        const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
        const report = reports.find(r => r.id === reportId);
        
        if (!report) {
            showAlert('Issue not found', 'error');
            return;
        }

        const currentComment = report.adminComment || '';
        
        const comment = prompt('Enter admin comment (this will be visible to the user):', currentComment);
        if (comment !== null) {
            if (comment.trim()) {
                try {
                    const reportIndex = reports.findIndex(r => r.id === reportId);
                    
                    if (reportIndex !== -1) {
                        reports[reportIndex].adminComment = comment.trim();
                        reports[reportIndex].adminCommentTimestamp = new Date().toISOString();
                        reports[reportIndex].updatedBy = localStorage.getItem('adminUser') || 'Administrator';
                        
                        localStorage.setItem('CivicBridge_reports', JSON.stringify(reports));
                        
                        showAlert('Admin comment added successfully', 'success');
                        this.refreshAdminDashboard();
                    } else {
                        showAlert('Issue not found', 'error');
                    }
                } catch (error) {
                    console.error('Error adding admin comment:', error);
                    showAlert('Error adding admin comment', 'error');
                }
            } else {
                showAlert('Comment cannot be empty', 'error');
            }
        }
    }

    viewIssueDetails(reportId) {
        try {
            const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
            const report = reports.find(r => r.id === reportId);
            
            if (report) {
                // Create a detailed modal view
                const detailModal = document.createElement('div');
                detailModal.className = 'modal';
                detailModal.style.display = 'block';
                detailModal.innerHTML = `
                    <div class="modal-content large-modal">
                        <span class="close">&times;</span>
                        <div class="login-header">
                            <h2><i class="fas fa-info-circle"></i> Issue Details</h2>
                            <p>Complete information about the reported issue</p>
                        </div>
                        <div class="issue-detail-content">
                            <div class="detail-section">
                                <h3><i class="fas fa-user"></i> Reporter Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Name:</strong> ${report.userName || 'Unknown'}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Email:</strong> ${report.userId || 'Unknown'}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Reported:</strong> ${report.timestamp ? new Date(report.timestamp).toLocaleString() : 'Unknown'}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h3><i class="fas fa-exclamation-circle"></i> Issue Information</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Type:</strong> ${this.formatIssueType(report.issueType)}
                                    </div>
                                    <div class="detail-item">
                                        <strong>Status:</strong> 
                                        <span class="status-badge status-${report.status || 'pending'}">
                                            ${(report.status || 'pending').replace('-', ' ')}
                                        </span>
                                    </div>
                                    <div class="detail-item full-width">
                                        <strong>Description:</strong> 
                                        <p>${report.description || 'No description provided'}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="detail-section">
                                <h3><i class="fas fa-map-marker-alt"></i> Location Details</h3>
                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <strong>Address:</strong> ${report.address || 'Not specified'}
                                    </div>
                                    ${report.location ? `
                                        <div class="detail-item">
                                            <strong>Latitude:</strong> ${report.location.lat.toFixed(6)}
                                        </div>
                                        <div class="detail-item">
                                            <strong>Longitude:</strong> ${report.location.lng.toFixed(6)}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            
                            ${report.adminComment ? `
                                <div class="detail-section">
                                    <h3><i class="fas fa-user-shield"></i> Admin Comments</h3>
                                    <div class="admin-comment-detail">
                                        <p>${report.adminComment}</p>
                                        <small>Posted: ${report.adminCommentTimestamp ? new Date(report.adminCommentTimestamp).toLocaleString() : 'Recently'} 
                                        by ${report.updatedBy || 'Administrator'}</small>
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${report.statusUpdated ? `
                                <div class="detail-section">
                                    <h3><i class="fas fa-history"></i> Status History</h3>
                                    <div class="status-history">
                                        <p>Last updated: ${new Date(report.statusUpdated).toLocaleString()} 
                                        by ${report.updatedBy || 'Administrator'}</p>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-primary" onclick="adminManager.editIssue(${reportId})">
                                <i class="fas fa-edit"></i> Edit Issue
                            </button>
                            <button class="btn btn-outline" onclick="this.closest('.modal').remove()">
                                Close
                            </button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(detailModal);
                
                // Close functionality
                detailModal.querySelector('.close').addEventListener('click', () => {
                    detailModal.remove();
                });
                
                detailModal.addEventListener('click', (e) => {
                    if (e.target === detailModal) {
                        detailModal.remove();
                    }
                });
            } else {
                showAlert('Issue not found', 'error');
            }
        } catch (error) {
            console.error('Error viewing issue details:', error);
            showAlert('Error loading issue details', 'error');
        }
    }

    editIssue(reportId) {
        // Close current modal
        document.querySelector('.modal')?.remove();
        
        const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
        const report = reports.find(r => r.id === reportId);
        
        if (!report) {
            showAlert('Issue not found', 'error');
            return;
        }

        const editModal = document.createElement('div');
        editModal.className = 'modal';
        editModal.style.display = 'block';
        editModal.innerHTML = `
            <div class="modal-content large-modal">
                <span class="close">&times;</span>
                <div class="login-header">
                    <h2><i class="fas fa-edit"></i> Edit Issue</h2>
                    <p>Update issue details and status</p>
                </div>
                <form id="editIssueForm">
                    <div class="form-group">
                        <label for="editIssueType">Issue Type</label>
                        <select id="editIssueType" class="form-control" required>
                            <option value="pothole" ${report.issueType === 'pothole' ? 'selected' : ''}>Pothole</option>
                            <option value="streetlight" ${report.issueType === 'streetlight' ? 'selected' : ''}>Streetlight Outage</option>
                            <option value="garbage" ${report.issueType === 'garbage' ? 'selected' : ''}>Garbage Accumulation</option>
                            <option value="graffiti" ${report.issueType === 'graffiti' ? 'selected' : ''}>Graffiti</option>
                            <option value="water_leak" ${report.issueType === 'water_leak' ? 'selected' : ''}>Water Leak</option>
                            <option value="other" ${report.issueType === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editDescription">Description</label>
                        <textarea id="editDescription" class="form-control" rows="4" required>${report.description || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="editStatus">Status</label>
                        <select id="editStatus" class="form-control" required>
                            <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="in-progress" ${report.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                            <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="editAddress">Location Address</label>
                        <input type="text" id="editAddress" class="form-control" value="${report.address || ''}">
                    </div>
                    
                    <div class="form-group">
                        <label for="editAdminComment">Admin Comment (Visible to User)</label>
                        <textarea id="editAdminComment" class="form-control" rows="3" placeholder="Add a comment for the user...">${report.adminComment || ''}</textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="button" class="btn btn-outline" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(editModal);
        
        // Close functionality
        editModal.querySelector('.close').addEventListener('click', () => {
            editModal.remove();
        });
        
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.remove();
            }
        });
        
        // Form submission
        editModal.querySelector('#editIssueForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveIssueChanges(reportId, editModal);
        });
    }

    saveIssueChanges(reportId, modal) {
        try {
            const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
            const reportIndex = reports.findIndex(r => r.id === reportId);
            
            if (reportIndex !== -1) {
                const form = modal.querySelector('#editIssueForm');
                reports[reportIndex].issueType = form.querySelector('#editIssueType').value;
                reports[reportIndex].description = form.querySelector('#editDescription').value;
                reports[reportIndex].status = form.querySelector('#editStatus').value;
                reports[reportIndex].address = form.querySelector('#editAddress').value;
                reports[reportIndex].adminComment = form.querySelector('#editAdminComment').value;
                reports[reportIndex].statusUpdated = new Date().toISOString();
                reports[reportIndex].updatedBy = localStorage.getItem('adminUser') || 'Administrator';
                
                if (form.querySelector('#editAdminComment').value.trim()) {
                    reports[reportIndex].adminCommentTimestamp = new Date().toISOString();
                }
                
                localStorage.setItem('CivicBridge_reports', JSON.stringify(reports));
                
                modal.remove();
                showAlert('Issue updated successfully', 'success');
                this.refreshAdminDashboard();
            }
        } catch (error) {
            console.error('Error saving issue changes:', error);
            showAlert('Error updating issue', 'error');
        }
    }

    deleteIssue(reportId) {
        if (confirm('Are you sure you want to delete this issue? This action cannot be undone.')) {
            try {
                const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
                const filteredReports = reports.filter(r => r.id !== reportId);
                
                localStorage.setItem('CivicBridge_reports', JSON.stringify(filteredReports));
                
                showAlert('Issue deleted successfully', 'success');
                this.refreshAdminDashboard();
            } catch (error) {
                console.error('Error deleting issue:', error);
                showAlert('Error deleting issue', 'error');
            }
        }
    }

    viewPhotos(reportId) {
        try {
            const reports = JSON.parse(localStorage.getItem('CivicBridge_reports') || '[]');
            const report = reports.find(r => r.id === reportId);
            
            if (report && report.photos && report.photos.length > 0) {
                const photoViewer = document.createElement('div');
                photoViewer.className = 'modal';
                photoViewer.style.display = 'block';
                photoViewer.innerHTML = `
                    <div class="modal-content large-modal">
                        <span class="close">&times;</span>
                        <div class="login-header">
                            <h2><i class="fas fa-images"></i> Issue Photos</h2>
                            <p>Reported by: ${report.userName || 'Unknown User'}</p>
                        </div>
                        <div class="photo-gallery">
                            ${report.photos.map((photo, index) => `
                                <div class="photo-item">
                                    <img src="${photo}" alt="Issue Photo ${index + 1}" style="width: 100%; border-radius: 8px;">
                                    <div class="photo-info">Photo ${index + 1}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                
                document.body.appendChild(photoViewer);
                
                // Close functionality
                photoViewer.querySelector('.close').addEventListener('click', () => {
                    photoViewer.remove();
                });
                
                photoViewer.addEventListener('click', (e) => {
                    if (e.target === photoViewer) {
                        photoViewer.remove();
                    }
                });
            } else {
                showAlert('No photos available for this issue', 'info');
            }
        } catch (error) {
            console.error('Error viewing photos:', error);
            showAlert('Error loading photos', 'error');
        }
    }

    refreshAdminDashboard() {
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection && isAdmin()) {
            dashboardSection.innerHTML = this.getAdminDashboardHTML();
            this.initializeAdminDashboard();
        }
    }

    initializeAdminDashboard() {
        // Refresh button
        const refreshBtn = document.getElementById('refreshAdminDashboardBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshAdminDashboard();
                showAlert('Admin dashboard refreshed', 'success');
            });
        }

        // Search functionality
        const searchInput = document.getElementById('adminSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterAdminIssues(e.target.value, document.getElementById('statusFilter').value, document.getElementById('userFilter').value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterAdminIssues(document.getElementById('adminSearch').value, e.target.value, document.getElementById('userFilter').value);
            });
        }

        // User filter
        const userFilter = document.getElementById('userFilter');
        if (userFilter) {
            userFilter.addEventListener('change', (e) => {
                this.filterAdminIssues(document.getElementById('adminSearch').value, document.getElementById('statusFilter').value, e.target.value);
            });
        }
    }

    filterAdminIssues(searchTerm, statusFilter, userFilter) {
        let filteredReports = this.loadAllReports();
        
        // Apply search filter
        if (searchTerm) {
            filteredReports = filteredReports.filter(report => 
                (report.description && report.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.issueType && report.issueType.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.userName && report.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.userId && report.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (report.address && report.address.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
            filteredReports = filteredReports.filter(report => (report.status || 'pending') === statusFilter);
        }
        
        // Apply user filter
        if (userFilter !== 'all') {
            filteredReports = filteredReports.filter(report => 
                (report.userName === userFilter) || (report.userId === userFilter)
            );
        }
        
        const issuesList = document.getElementById('adminIssuesList');
        if (issuesList) {
            issuesList.innerHTML = this.renderAdminIssuesList(filteredReports);
        }
    }
}



// Initialize admin manager
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

// Load admin dashboard
function loadAdminDashboard() {
    const dashboardSection = document.getElementById('dashboard');
    if (!dashboardSection) return;

    if (!isAdmin()) {
        showAlert('Access denied. Admin privileges required.', 'error');
        loadDashboard();
        return;
    }

    dashboardSection.innerHTML = window.adminManager.getAdminDashboardHTML();
    window.adminManager.initializeAdminDashboard();
    
    // Scroll to dashboard section
    dashboardSection.scrollIntoView({ behavior: 'smooth' });
}