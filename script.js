// Data Storage
let ideas = JSON.parse(localStorage.getItem('ideas')) || [];
let currentIdeaId = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeTabs();
    initializeSearch();
    initializeThumbnailUpload();
    initializeTheme();
    updateDashboard();
    renderIdeas();
    renderCalendar();
    
    // Auto-save on input changes
    setupAutoSave();
});

// Navigation
function initializeNavigation() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.dataset.view;
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding view
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(`${view}-view`).classList.add('active');
            
            // Refresh content
            if (view === 'ideas') renderIdeas();
            if (view === 'calendar') renderCalendar();
            if (view === 'dashboard') updateDashboard();
        });
    });
}

// Tabs
function initializeTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            
            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(`${tab}-tab`).classList.add('active');
        });
    });
}

// Create New Idea
function createNewIdea() {
    const newIdea = {
        id: Date.now(),
        title: 'New Video Idea',
        description: '',
        status: 'idea',
        priority: 'medium',
        recordingDate: '',
        uploadDate: '',
        platforms: [],
        thumbnails: [],
        checklist: [],
        script: '',
        createdAt: new Date().toISOString()
    };
    
    ideas.push(newIdea);
    saveIdeas();
    openIdeaDetail(newIdea.id);
    updateDashboard();
    renderIdeas();
}

// Open Idea Detail
function openIdeaDetail(ideaId) {
    currentIdeaId = ideaId;
    const idea = ideas.find(i => i.id === ideaId);
    
    if (!idea) return;
    
    // Switch to detail view
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('idea-detail-view').classList.add('active');
    
    // Load idea data
    document.getElementById('detail-title').textContent = idea.title || 'New Idea';
    document.getElementById('idea-title').value = idea.title || '';
    document.getElementById('idea-description').value = idea.description || '';
    document.getElementById('idea-status').value = idea.status || 'idea';
    document.getElementById('idea-priority').value = idea.priority || 'medium';
    document.getElementById('idea-recording-date').value = idea.recordingDate || '';
    document.getElementById('idea-upload-date').value = idea.uploadDate || '';
    
    // Load platforms
    document.querySelectorAll('.platform-chips input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = idea.platforms.includes(checkbox.value);
    });
    
    // Load thumbnails
    renderThumbnails();
    
    // Load checklist
    renderChecklist();
    
    // Load script
    document.getElementById('script-content').innerHTML = idea.script || '';
    
    // Reset to overview tab
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-btn[data-tab="overview"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById('overview-tab').classList.add('active');
}

// Close Idea Detail
function closeIdeaDetail() {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('dashboard-view').classList.add('active');
    
    // Update nav
    document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
    document.querySelector('.nav-item[data-view="dashboard"]').classList.add('active');
    
    updateDashboard();
    renderIdeas();
    renderCalendar();
}

// Save Overview
function saveOverview() {
    if (!currentIdeaId) return;
    
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    idea.title = document.getElementById('idea-title').value;
    idea.description = document.getElementById('idea-description').value;
    idea.status = document.getElementById('idea-status').value;
    idea.priority = document.getElementById('idea-priority').value;
    idea.recordingDate = document.getElementById('idea-recording-date').value;
    idea.uploadDate = document.getElementById('idea-upload-date').value;
    
    // Save platforms
    idea.platforms = Array.from(document.querySelectorAll('.platform-chips input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    saveIdeas();
    document.getElementById('detail-title').textContent = idea.title;
    
    // Show success message
    showNotification('Changes saved successfully!');
}

// Auto-save setup
function setupAutoSave() {
    const autoSaveFields = [
        'idea-title', 'idea-description', 'idea-status', 'idea-priority',
        'idea-recording-date', 'idea-upload-date'
    ];
    
    autoSaveFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('change', saveOverview);
        }
    });
    
    document.querySelectorAll('.platform-chips input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', saveOverview);
    });
}

// Thumbnails
function initializeThumbnailUpload() {
    document.getElementById('thumbnail-upload').addEventListener('change', function(e) {
        const files = Array.from(e.target.files);
        const idea = ideas.find(i => i.id === currentIdeaId);
        
        if (!idea) return;
        
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = function(event) {
                idea.thumbnails.push({
                    id: Date.now() + Math.random(),
                    data: event.target.result,
                    name: file.name
                });
                saveIdeas();
                renderThumbnails();
            };
            reader.readAsDataURL(file);
        });
        
        e.target.value = '';
    });
}

function renderThumbnails() {
    const idea = ideas.find(i => i.id === currentIdeaId);
    const gallery = document.getElementById('thumbnail-gallery');
    
    if (!idea || !idea.thumbnails.length) {
        gallery.innerHTML = '';
        return;
    }
    
    gallery.innerHTML = idea.thumbnails.map(thumb => `
        <div class="thumbnail-item">
            <img src="${thumb.data}" alt="${thumb.name}">
            <button class="thumbnail-delete" onclick="deleteThumbnail(${thumb.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function deleteThumbnail(thumbnailId) {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    idea.thumbnails = idea.thumbnails.filter(t => t.id !== thumbnailId);
    saveIdeas();
    renderThumbnails();
}

// Checklist
function renderChecklist() {
    const idea = ideas.find(i => i.id === currentIdeaId);
    const container = document.getElementById('checklist-items');
    
    if (!idea || !idea.checklist.length) {
        container.innerHTML = '<div class="empty-state"><p>No checklist items yet. Click "Add Item" to get started.</p></div>';
        return;
    }
    
    container.innerHTML = idea.checklist.map(item => `
        <div class="checklist-item ${item.completed ? 'completed' : ''}">
            <input type="checkbox" ${item.completed ? 'checked' : ''} 
                   onchange="toggleChecklistItem(${item.id})">
            <input type="text" value="${item.text}" 
                   onchange="updateChecklistItem(${item.id}, this.value)">
            <button class="checklist-delete" onclick="deleteChecklistItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function addChecklistItem() {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    idea.checklist.push({
        id: Date.now(),
        text: 'New task',
        completed: false
    });
    
    saveIdeas();
    renderChecklist();
}

function toggleChecklistItem(itemId) {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    const item = idea.checklist.find(i => i.id === itemId);
    if (item) {
        item.completed = !item.completed;
        saveIdeas();
        renderChecklist();
    }
}

function updateChecklistItem(itemId, text) {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    const item = idea.checklist.find(i => i.id === itemId);
    if (item) {
        item.text = text;
        saveIdeas();
    }
}

function deleteChecklistItem(itemId) {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    idea.checklist = idea.checklist.filter(i => i.id !== itemId);
    saveIdeas();
    renderChecklist();
}

// Script Editor
function formatText(command) {
    document.execCommand(command, false, null);
    document.getElementById('script-content').focus();
}

function formatHeading(tag) {
    if (tag) {
        document.execCommand('formatBlock', false, tag);
    } else {
        document.execCommand('formatBlock', false, 'p');
    }
    document.getElementById('script-content').focus();
}

function saveScript() {
    const idea = ideas.find(i => i.id === currentIdeaId);
    if (!idea) return;
    
    idea.script = document.getElementById('script-content').innerHTML;
    saveIdeas();
    showNotification('Script saved successfully!');
}

// Dashboard
function updateDashboard() {
    document.getElementById('total-ideas').textContent = ideas.length;
    document.getElementById('in-progress').textContent = ideas.filter(i => 
        i.status === 'planning' || i.status === 'recording' || i.status === 'editing'
    ).length;
    document.getElementById('completed').textContent = ideas.filter(i => i.status === 'completed').length;
    document.getElementById('scheduled').textContent = ideas.filter(i => i.uploadDate).length;
    
    // Render recent ideas
    const recentIdeas = ideas.slice(-6).reverse();
    const container = document.getElementById('recent-ideas');
    
    if (!recentIdeas.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h3>No ideas yet</h3>
                <p>Click "New Idea" to create your first video idea</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentIdeas.map(idea => createIdeaCard(idea)).join('');
}

// Ideas List
function renderIdeas() {
    const container = document.getElementById('all-ideas');
    const searchTerm = document.getElementById('search-ideas').value.toLowerCase();
    const statusFilter = document.getElementById('filter-status').value;
    
    let filteredIdeas = ideas;
    
    if (searchTerm) {
        filteredIdeas = filteredIdeas.filter(idea => 
            idea.title.toLowerCase().includes(searchTerm) ||
            idea.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter !== 'all') {
        filteredIdeas = filteredIdeas.filter(idea => idea.status === statusFilter);
    }
    
    if (!filteredIdeas.length) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No ideas found</h3>
                <p>Try adjusting your search or filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredIdeas.map((idea, index) => {
        const card = createIdeaCard(idea);
        return card.replace('<div class="idea-card"', `<div class="idea-card" style="animation-delay: ${index * 0.05}s"`);
    }).join('');
}

function createIdeaCard(idea) {
    const platformIcons = {
        youtube: 'fab fa-youtube',
        instagram: 'fab fa-instagram',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter',
        facebook: 'fab fa-facebook'
    };
    
    return `
        <div class="idea-card" onclick="openIdeaDetail(${idea.id})">
            <div class="idea-card-header">
                <h3>${idea.title || 'Untitled'}</h3>
                <span class="idea-status status-${idea.status}">${idea.status}</span>
            </div>
            <p>${idea.description || 'No description'}</p>
            <div class="idea-card-footer">
                <div class="idea-platforms">
                    ${idea.platforms.map(p => `<i class="${platformIcons[p]}"></i>`).join('')}
                </div>
                <div class="idea-date">
                    ${idea.uploadDate ? new Date(idea.uploadDate).toLocaleDateString() : 'No date'}
                </div>
            </div>
        </div>
    `;
}

function initializeSearch() {
    document.getElementById('search-ideas').addEventListener('input', renderIdeas);
    document.getElementById('filter-status').addEventListener('change', renderIdeas);
}

// Calendar
function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendar-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    let html = '<div class="calendar-header">';
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        html += `<div class="calendar-day-name">${day}</div>`;
    });
    html += '</div><div class="calendar-grid">';
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        html += `<div class="calendar-day other-month"><div class="calendar-date">${day}</div></div>`;
    }
    
    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentMonth && 
                       today.getFullYear() === currentYear;
        
        const events = getEventsForDate(dateStr);
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''}" 
                 data-date="${dateStr}"
                 ondrop="handleDrop(event)"
                 ondragover="handleDragOver(event)"
                 ondragleave="handleDragLeave(event)">
                <div class="calendar-date">${day}</div>
                <div class="calendar-events">
                    ${events.map(event => `
                        <div class="calendar-event ${event.type}" 
                             draggable="true"
                             ondragstart="handleDragStart(event, ${event.ideaId}, '${event.type}')"
                             ondragend="handleDragEnd(event)"
                             onclick="openIdeaDetail(${event.ideaId})">
                            <span>${event.title}</span>
                            ${event.platforms ? `
                                <div class="calendar-event-platforms">
                                    ${event.platforms.map(p => `<i class="${getPlatformIcon(p)}"></i>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Next month days
    const totalCells = firstDay + daysInMonth;
    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let day = 1; day <= remainingCells; day++) {
        html += `<div class="calendar-day other-month"><div class="calendar-date">${day}</div></div>`;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

function getEventsForDate(dateStr) {
    const events = [];
    
    ideas.forEach(idea => {
        if (idea.recordingDate === dateStr) {
            events.push({
                type: 'recording',
                title: `📹 ${idea.title}`,
                ideaId: idea.id,
                platforms: idea.platforms
            });
        }
        if (idea.uploadDate === dateStr) {
            events.push({
                type: 'upload',
                title: `🚀 ${idea.title}`,
                ideaId: idea.id,
                platforms: idea.platforms
            });
        }
    });
    
    return events;
}

function getPlatformIcon(platform) {
    const icons = {
        youtube: 'fab fa-youtube',
        instagram: 'fab fa-instagram',
        tiktok: 'fab fa-tiktok',
        twitter: 'fab fa-twitter',
        facebook: 'fab fa-facebook'
    };
    return icons[platform] || '';
}

// Drag and Drop handlers
let draggedIdeaId = null;
let draggedEventType = null;

function handleDragStart(event, ideaId, eventType) {
    draggedIdeaId = ideaId;
    draggedEventType = eventType;
    event.target.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(event) {
    event.target.classList.remove('dragging');
    draggedIdeaId = null;
    draggedEventType = null;
}

function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    const dayElement = event.currentTarget;
    if (!dayElement.classList.contains('other-month')) {
        dayElement.classList.add('drag-over');
    }
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    if (!draggedIdeaId || !draggedEventType) return;
    
    const newDate = event.currentTarget.dataset.date;
    if (!newDate) return;
    
    const idea = ideas.find(i => i.id === draggedIdeaId);
    if (!idea) return;
    
    // Update the date based on event type
    if (draggedEventType === 'recording') {
        idea.recordingDate = newDate;
    } else if (draggedEventType === 'upload') {
        idea.uploadDate = newDate;
    }
    
    saveIdeas();
    renderCalendar();
    
    // Show notification
    const eventName = draggedEventType === 'recording' ? 'Recording' : 'Upload';
    showNotification(`${eventName} date updated for "${idea.title}"`);
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// Delete Idea
function deleteCurrentIdea() {
    if (!currentIdeaId) return;
    
    if (confirm('Are you sure you want to delete this idea? This action cannot be undone.')) {
        ideas = ideas.filter(i => i.id !== currentIdeaId);
        saveIdeas();
        closeIdeaDetail();
    }
}

// Storage
function saveIdeas() {
    localStorage.setItem('ideas', JSON.stringify(ideas));
}

// Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Theme Toggle
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
    
    // Add a subtle pulse animation to the toggle
    const toggle = document.querySelector('.theme-toggle');
    toggle.style.animation = 'pulse 0.3s ease';
    setTimeout(() => {
        toggle.style.animation = '';
    }, 300);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('.theme-toggle i');
    const text = document.getElementById('theme-text');
    
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        text.textContent = 'Light Mode';
    } else {
        icon.className = 'fas fa-moon';
        text.textContent = 'Dark Mode';
    }
}
