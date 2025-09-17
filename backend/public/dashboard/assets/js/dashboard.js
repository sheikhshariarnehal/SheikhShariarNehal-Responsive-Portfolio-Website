// Dashboard functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize dashboard
    await initializeDashboard();
    
    // Set up event listeners
    setupEventListeners();
});

async function initializeDashboard() {
    try {
        // Load user info
        loadUserInfo();
        
        // Load dashboard stats
        await loadDashboardStats();
        
        // Load recent projects
        await loadRecentProjects();
        
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        showAlert('Failed to load dashboard data', 'danger');
    }
}

function loadUserInfo() {
    const user = authManager.getCurrentUser();
    if (user) {
        document.getElementById('username').textContent = user.username;
    }
}

async function loadDashboardStats() {
    try {
        const response = await apiRequest('/api/projects');
        
        if (response && response.success) {
            const projects = response.data;
            
            // Update total projects
            document.getElementById('totalProjects').textContent = projects.length;
            
            // Count projects by category
            const categoryCounts = projects.reduce((acc, project) => {
                acc[project.category] = (acc[project.category] || 0) + 1;
                return acc;
            }, {});
            
            // Update category stats
            document.getElementById('mernProjects').textContent = categoryCounts.mern || 0;
            document.getElementById('androidProjects').textContent = categoryCounts.android || 0;
            document.getElementById('webProjects').textContent = (categoryCounts.basicweb || 0) + (categoryCounts.lamp || 0);
            
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        // Set default values on error
        document.getElementById('totalProjects').textContent = '0';
        document.getElementById('mernProjects').textContent = '0';
        document.getElementById('androidProjects').textContent = '0';
        document.getElementById('webProjects').textContent = '0';
    }
}

async function loadRecentProjects() {
    const container = document.getElementById('recentProjects');
    
    try {
        const response = await apiRequest('/api/projects?limit=5');
        
        if (response && response.success) {
            const projects = response.data;
            
            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                        <p class="text-muted">No projects found</p>
                        <a href="/dashboard/add-project" class="btn btn-primary">
                            <i class="fas fa-plus me-1"></i>Add Your First Project
                        </a>
                    </div>
                `;
                return;
            }
            
            const projectsHTML = projects.map(project => `
                <div class="row align-items-center py-3 border-bottom">
                    <div class="col-md-8">
                        <h6 class="mb-1">${escapeHtml(project.name)}</h6>
                        <p class="text-muted mb-1 small">${truncateText(project.desc, 80)}</p>
                        <div class="d-flex align-items-center">
                            ${getCategoryBadge(project.category)}
                            <small class="text-muted ms-2">
                                <i class="fas fa-image me-1"></i>${escapeHtml(project.image)}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <div class="btn-group btn-group-sm">
                            <a href="/dashboard/edit-project/${project.id}" class="btn btn-outline-primary">
                                <i class="fas fa-edit"></i>
                            </a>
                            <button class="btn btn-outline-danger" onclick="deleteProject('${project.id}', '${escapeHtml(project.name)}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            container.innerHTML = projectsHTML;
            
        } else {
            throw new Error('Failed to load projects');
        }
        
    } catch (error) {
        console.error('Error loading recent projects:', error);
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                <p class="text-muted">Failed to load projects</p>
                <button class="btn btn-outline-primary" onclick="loadRecentProjects()">
                    <i class="fas fa-refresh me-1"></i>Try Again
                </button>
            </div>
        `;
    }
}

function setupEventListeners() {
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        
        if (confirm('Are you sure you want to logout?')) {
            authManager.logout();
        }
    });
    
    // Backup button
    document.getElementById('backupBtn').addEventListener('click', async () => {
        try {
            const response = await apiRequest('/api/projects');
            
            if (response && response.success) {
                const dataStr = JSON.stringify(response.data, null, 2);
                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                
                const link = document.createElement('a');
                link.href = URL.createObjectURL(dataBlob);
                link.download = `portfolio-projects-backup-${new Date().toISOString().split('T')[0]}.json`;
                link.click();
                
                showAlert('Backup downloaded successfully!', 'success');
            }
        } catch (error) {
            console.error('Backup error:', error);
            showAlert('Failed to create backup', 'danger');
        }
    });
}

// Delete project function
async function deleteProject(projectId, projectName) {
    if (!confirm(`Are you sure you want to delete "${projectName}"? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await apiRequest(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        
        if (response && response.success) {
            showAlert('Project deleted successfully!', 'success');
            
            // Reload dashboard data
            await loadDashboardStats();
            await loadRecentProjects();
        } else {
            throw new Error('Delete failed');
        }
        
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('Failed to delete project', 'danger');
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
