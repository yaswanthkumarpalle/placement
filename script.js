const companies = [
    {
        id: 'c1',
        name: 'Google',
        logo: 'fa-brands fa-google',
        role: 'Software Development Engineer',
        ctc: '₹32.5 LPA',
        minCgpa: 8.5,
        maxBacklogs: 0,
        branches: ['CSE', 'IT'],
        appliedCount: 42
    },
    {
        id: 'c2',
        name: 'Microsoft',
        logo: 'fa-brands fa-microsoft',
        role: 'Full Stack Engineer',
        ctc: '₹28.0 LPA',
        minCgpa: 8.0,
        maxBacklogs: 0,
        branches: ['CSE', 'IT', 'ECE'],
        appliedCount: 58
    },
    {
        id: 'c3',
        name: 'Amazon',
        logo: 'fa-brands fa-amazon',
        role: 'Systems Architect / SDE-1',
        ctc: '₹26.0 LPA',
        minCgpa: 7.5,
        maxBacklogs: 0,
        branches: ['CSE', 'IT', 'ECE', 'EEE'],
        appliedCount: 64
    },
    {
        id: 'c4',
        name: 'TCS Digital',
        logo: 'fa-solid fa-code',
        role: 'Digital Software Developer',
        ctc: '₹7.5 LPA',
        minCgpa: 6.5,
        maxBacklogs: 1,
        branches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'],
        appliedCount: 95
    },
    {
        id: 'c5',
        name: 'Infosys Power Programmer',
        logo: 'fa-solid fa-laptop-code',
        role: 'Specialist Programmer',
        ctc: '₹9.5 LPA',
        minCgpa: 7.0,
        maxBacklogs: 0,
        branches: ['CSE', 'IT', 'ECE'],
        appliedCount: 78
    }
];

const firstNames = ['Palle', 'Aarav', 'Ananya', 'Rohan', 'Sanya', 'Vikram', 'Neha', 'Karan', 'Priya', 'Aditya', 'Meera', 'Rahul', 'Divya', 'Siddharth', 'Kavya'];
const lastNames = ['Kumar', 'Sharma', 'Verma', 'Patel', 'Reddy', 'Singh', 'Rao', 'Nair', 'Joshi', 'Gupta', 'Chowdury', 'Das'];
const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH'];

let studentDataset = [];
let selectedCompany = companies[0];
let currentRankingMode = 'OVERALL';
let branchChartObj = null;
let statusChartObj = null;

const STORAGE_KEY_USERS = 'placementAuthUsers';
const STORAGE_KEY_SESSION = 'placementAuthSession';
const STORAGE_KEY_POSTS = 'placementAuthorPosts';

const defaultUsers = [
    { name: 'Demo User', email: 'user@test.com', password: '123456', role: 'user' }
];

function saveDefaultAccounts() {
    const existingUsers = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
    const userAccounts = existingUsers.filter(user => user.role === 'user');
    const mergedUsers = [...defaultUsers, ...userAccounts.filter(user => !defaultUsers.some(def => def.email.toLowerCase() === user.email.toLowerCase() && def.role === user.role))];
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(mergedUsers));
}

let currentUser = null;
let authorPosts = [
    {
        id: 'p1',
        title: 'Google SDE Drive Open',
        category: 'Placement Update',
        content: 'The Google SDE recruitment drive is now live. Interested students should prepare for coding and system design rounds.',
        author: 'Demo Author'
    },
    {
        id: 'p2',
        title: 'Resume Review Session',
        category: 'Career Guidance',
        content: 'An expert-led resume review session will be held this Friday to improve profile visibility and ATS match quality.',
        author: 'Demo Author'
    }
];

async function ensureAuthStorage() {
    try {
        const response = await fetch('/api/users');
        const serverUsers = response.ok ? await response.json() : [];
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(serverUsers));
    } catch (error) {
        console.warn('Could not fetch user accounts from backend.', error);
    }

    const savedUsers = JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || 'null');
    if (!savedUsers || savedUsers.length === 0) {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(defaultUsers));
    } else {
        saveDefaultAccounts();
    }

    const savedPosts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || 'null');
    if (!savedPosts || savedPosts.length === 0) {
        localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(authorPosts));
    } else {
        authorPosts = savedPosts;
    }

    try {
        const response = await fetch('/api/auth/session', { cache: 'no-store' });
        if (response.ok) {
            const result = await response.json();
            currentUser = result.user;
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
        } else {
            currentUser = null;
            localStorage.removeItem(STORAGE_KEY_SESSION);
        }
    } catch (error) {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEY_SESSION);
        console.warn('Could not restore the server login session.', error);
    }
}

function toggleAuthView(view) {
    if (document.getElementById('signin-role').value === 'author') view = 'signin';
    const signinPanel = document.getElementById('signin-panel');
    const signupPanel = document.getElementById('signup-panel');
    const authButtons = document.querySelectorAll('.auth-view-btn');
    const isSignin = view === 'signin';

    signinPanel.classList.toggle('hidden', !isSignin);
    signupPanel.classList.toggle('hidden', isSignin);
    authButtons.forEach(btn => {
        const isActive = btn.dataset.authView === view;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('bg-blue-600', isActive);
        btn.classList.toggle('text-white', isActive);
        btn.classList.toggle('text-slate-300', !isActive);
    });
}

function selectAuthRole(role) {
    const roleButtons = document.querySelectorAll('.auth-role-btn');
    const signinRole = document.getElementById('signin-role');
    const signupRole = document.getElementById('signup-role');
    const viewSwitcher = document.getElementById('auth-view-switcher');

    roleButtons.forEach(btn => {
        const isActive = btn.dataset.authRole === role;
        btn.classList.toggle('active', isActive);
        btn.classList.toggle('border-blue-500/40', isActive);
        btn.classList.toggle('bg-blue-500/10', isActive);
        btn.classList.toggle('text-blue-300', isActive);
        btn.classList.toggle('border-slate-700', !isActive);
        btn.classList.toggle('bg-slate-800', !isActive);
        btn.classList.toggle('text-slate-300', !isActive);
    });

    if (signinRole) signinRole.value = role;
    if (signupRole) signupRole.value = 'user';
    if (viewSwitcher) viewSwitcher.classList.toggle('hidden', role === 'author');
    if (role === 'author') {
        toggleAuthView('signin');
        document.getElementById('signin-email').value = '';
        document.getElementById('signin-password').value = '';
    }
}

function showAppShell() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    if (authScreen) authScreen.classList.add('hidden');
    if (appShell) appShell.classList.remove('hidden');
    updateUserHeader();
    updateAuthorVisibility();
}

function showAuthScreen() {
    const authScreen = document.getElementById('auth-screen');
    const appShell = document.getElementById('app-shell');
    if (authScreen) authScreen.classList.remove('hidden');
    if (appShell) appShell.classList.add('hidden');
    updateUserHeader();
}

function updateUserHeader() {
    const badge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (!badge || !logoutBtn) return;

    if (currentUser) {
        badge.textContent = `${currentUser.name} • ${currentUser.role}`;
        badge.className = 'rounded-full border px-3 py-1.5 text-xs ' + (currentUser.role === 'author' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-blue-500/30 bg-blue-500/10 text-blue-300');
        logoutBtn.classList.remove('hidden');
    } else {
        badge.textContent = 'Guest';
        badge.className = 'rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300';
        logoutBtn.classList.add('hidden');
    }
}

function updateAuthorVisibility() {
    const panel = document.getElementById('author-crud-panel');
    const authorName = document.getElementById('author-name');
    if (!panel || !authorName) return;

    const isAuthor = currentUser && currentUser.role === 'author';
    panel.classList.toggle('hidden', !isAuthor);
    authorName.value = isAuthor ? currentUser.name : '';
}

function getUsers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function registerAuthEvents() {
    document.querySelectorAll('.auth-role-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            selectAuthRole(btn.dataset.authRole);
            const role = btn.dataset.authRole;
            const selectedView = document.querySelector('.auth-view-btn.active')?.dataset.authView || 'signin';
            if (selectedView === 'signin') {
                const emailField = document.getElementById('signin-email');
                const passwordField = document.getElementById('signin-password');
                const roleMatch = defaultUsers.find(user => user.role === role);
                if (roleMatch) {
                    emailField.value = roleMatch.email;
                    passwordField.value = roleMatch.password;
                }
            } else {
                const emailField = document.getElementById('signup-email');
                const passwordField = document.getElementById('signup-password');
                const nameField = document.getElementById('signup-name');
                const roleMatch = defaultUsers.find(user => user.role === role);
                if (roleMatch) {
                    nameField.value = roleMatch.name;
                    emailField.value = roleMatch.email;
                    passwordField.value = roleMatch.password;
                }
            }
        });
    });

    document.querySelectorAll('.auth-view-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleAuthView(btn.dataset.authView));
    });

    document.getElementById('signin-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('signin-email').value.trim();
        const password = document.getElementById('signin-password').value;
        const role = document.getElementById('signin-role').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Invalid role, email, or password.');
            currentUser = result.user;
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
            showAppShell();
        } catch (error) {
            alert(error.message || 'Could not sign in. Check the server and try again.');
        }
    });

    document.getElementById('signup-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value.trim();
        const role = document.getElementById('signup-role').value;

        if (role !== 'user') {
            alert('Author accounts are created by the developer and cannot sign up here.');
            return;
        }

        if (!name || !email || !password) {
            alert('Please complete all fields before creating an account.');
            return;
        }

        const users = getUsers();
        const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase() && u.role === role);
        if (emailExists) {
            alert('This email already exists for the selected role. Please sign in instead.');
            return;
        }

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Could not create the user account.');
            currentUser = result.user;
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(result.users || users));
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(currentUser));
            showAppShell();
        } catch (error) {
            alert(error.message || 'Could not create the user account. Check the server and try again.');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        currentUser = null;
        localStorage.removeItem(STORAGE_KEY_SESSION);
        fetch('/api/auth/logout', { method: 'POST' }).catch(error => console.warn('Could not close server login session.', error));
        showAuthScreen();
    });

    document.getElementById('author-post-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const id = document.getElementById('author-post-id').value;
        const title = document.getElementById('author-title').value.trim();
        const category = document.getElementById('author-category').value;
        const content = document.getElementById('author-content').value.trim();

        const posts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');

        if (id) {
            const index = posts.findIndex(post => post.id === id);
            if (index !== -1) {
                posts[index] = { ...posts[index], title, category, content };
            }
        } else {
            posts.unshift({
                id: `p${Date.now()}`,
                title,
                category,
                content,
                author: currentUser ? currentUser.name : 'Author'
            });
        }

        localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(posts));
        authorPosts = posts;
        renderAuthorPosts();
        document.getElementById('author-post-form').reset();
        document.getElementById('author-post-id').value = '';
        document.getElementById('cancel-author-edit').classList.add('hidden');
    });

    document.getElementById('cancel-author-edit').addEventListener('click', () => {
        document.getElementById('author-post-form').reset();
        document.getElementById('author-post-id').value = '';
        document.getElementById('cancel-author-edit').classList.add('hidden');
    });

    document.getElementById('author-student-form').addEventListener('submit', async event => {
        event.preventDefault();
        if (!currentUser || currentUser.role !== 'author') {
            alert('Only authors can add student records.');
            return;
        }

        const student = {
            id: document.getElementById('new-student-id').value.trim(),
            fullName: document.getElementById('new-student-name').value.trim(),
            branch: document.getElementById('new-student-branch').value.trim().toUpperCase(),
            academicYear: document.getElementById('new-student-year').value,
            cgpa: Number(document.getElementById('new-student-cgpa').value),
            backlogs: Number(document.getElementById('new-student-backlogs').value),
            codingScore: Number(document.getElementById('new-student-score').value),
            status: document.getElementById('new-student-status').value,
            pipelineStage: document.getElementById('new-student-stage').value,
            company: document.getElementById('new-student-company').value.trim() || '-'
        };

        try {
            const response = await fetch('/api/students', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Role': currentUser.role },
                body: JSON.stringify(student)
            });
            const responseText = await response.text();
            let result;
            try {
                result = JSON.parse(responseText);
            } catch {
                const responseHint = responseText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
                throw new Error(`The server returned ${response.status} instead of JSON. ${responseHint || 'Restart server.py and check its terminal log.'}`);
            }
            if (!response.ok) throw new Error([result.message, result.detail].filter(Boolean).join(' ' ) || 'Could not add the student record.');
            studentDataset = Array.isArray(result.data) ? result.data : [...studentDataset, student];
            document.getElementById('author-student-form').reset();
            updateAcademicYearFilter();
            renderStudentsTable();
            renderPipeline();
            renderCharts();
            alert('Student record added.');
        } catch (error) {
            alert(error.message);
        }
    });
}

function renderAuthorPosts() {
    const list = document.getElementById('author-post-list');
    const count = document.getElementById('post-count');
    const posts = JSON.parse(localStorage.getItem(STORAGE_KEY_POSTS) || '[]');

    if (!list || !count) return;

    if (!posts.length) {
        list.innerHTML = '<div class="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-500">No posts yet. Create the first placement update.</div>';
        count.textContent = '0 items';
        return;
    }

    list.innerHTML = posts.map(post => `
        <div class="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <div class="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300">
                        <span class="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5">${post.category}</span>
                    </div>
                    <h4 class="mt-3 text-base font-bold text-slate-100">${post.title}</h4>
                </div>
                <div class="flex gap-2">
                    <button type="button" data-edit-post="${post.id}" class="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-[11px] font-medium text-slate-200">Edit</button>
                    <button type="button" data-delete-post="${post.id}" class="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-medium text-rose-300">Delete</button>
                </div>
            </div>
            <p class="mt-3 text-sm text-slate-300 leading-relaxed">${post.content}</p>
            <div class="mt-4 text-[11px] text-slate-400">Posted by <span class="font-medium text-slate-200">${post.author}</span></div>
        </div>
    `).join('');

    list.querySelectorAll('[data-edit-post]').forEach(button => {
        button.addEventListener('click', () => {
            const post = posts.find(item => item.id === button.dataset.editPost);
            if (!post) return;
            document.getElementById('author-post-id').value = post.id;
            document.getElementById('author-title').value = post.title;
            document.getElementById('author-category').value = post.category;
            document.getElementById('author-content').value = post.content;
            document.getElementById('cancel-author-edit').classList.remove('hidden');
            document.getElementById('author-title').focus();
        });
    });

    list.querySelectorAll('[data-delete-post]').forEach(button => {
        button.addEventListener('click', () => {
            const filtered = posts.filter(post => post.id !== button.dataset.deletePost);
            localStorage.setItem(STORAGE_KEY_POSTS, JSON.stringify(filtered));
            authorPosts = filtered;
            renderAuthorPosts();
        });
    });

    count.textContent = `${posts.length} item${posts.length === 1 ? '' : 's'}`;
}

async function generateStudents() {
    try {
        const response = await fetch('/api/students', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Student data request failed');
        }

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch {
            throw new Error(`Student API returned ${response.status} as HTML or invalid JSON. Restart server.py and inspect its terminal log.`);
        }
        studentDataset = Array.isArray(data) ? data.map(item => ({
            ...item,
            academicYear: String(item.academicYear || String(item.id).match(/20\d{2}/)?.[0] || ''),
            cgpa: Number(item.cgpa || 0),
            backlogs: Number(item.backlogs || 0),
            codingScore: Number(item.codingScore || 0)
        })) : [];
        updateAcademicYearFilter();

        // Keep the pipeline useful with older API responses that only mark
        // in-progress students as "Technical Round".
        const inProcess = studentDataset.filter(student => String(student.status).toLowerCase() === 'in process');
        const currentStages = new Set(inProcess.map(student => student.pipelineStage));
        const interviewStages = ['Written Test', 'Technical Round', 'HR Round'];
        if (inProcess.length > 2 && currentStages.size === 1 && interviewStages.includes(inProcess[0].pipelineStage)) {
            inProcess.forEach((student, index) => {
                student.pipelineStage = interviewStages[index % interviewStages.length];
            });
        }

        renderCharts();
        renderStudentsTable();
        renderMatcherSection();
        renderRankingsTable();
        renderPipeline();
    } catch (error) {
        console.error('Unable to load student data from CSV-backed API:', error);
        studentDataset = [];
    }
}

function updateAcademicYearFilter() {
    const filter = document.getElementById('filter-year');
    if (!filter) return;
    const selectedYear = filter.value || 'ALL';
    const years = [...new Set(studentDataset.map(student => student.academicYear).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    filter.innerHTML = '<option value="ALL">All Years</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
    filter.value = years.includes(selectedYear) ? selectedYear : 'ALL';
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
        btn.classList.add('text-slate-400');
    });

    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    const activeBtn = document.getElementById(`tab-btn-${tabId}`);
    activeBtn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
    activeBtn.classList.remove('text-slate-400');

    if (tabId === 'students') renderStudentsTable();
    if (tabId === 'matcher') renderMatcherSection();
    if (tabId === 'rankings') renderRankingsTable();
    if (tabId === 'pipeline') renderPipeline();
}

function toggleSqlDrawer() {
    const drawer = document.getElementById('sql-drawer');
    drawer.classList.toggle('translate-x-full');
}

function copyToClipboard(btn) {
    const text = btn.previousElementSibling.innerText;
    navigator.clipboard.writeText(text);
    btn.innerText = 'Copied!';
    setTimeout(() => btn.innerText = 'Copy', 2000);
}

function renderCharts() {
    const branchCounts = {};
    const branchPlaced = {};
    branches.forEach(b => { branchCounts[b] = 0; branchPlaced[b] = 0; });

    studentDataset.forEach(s => {
        branchCounts[s.branch]++;
        if (s.status === 'Placed') branchPlaced[s.branch]++;
    });

    const ctx1 = document.getElementById('branchChart').getContext('2d');
    if (branchChartObj) branchChartObj.destroy();
    branchChartObj = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: branches,
            datasets: [
                {
                    label: 'Total Students',
                    data: branches.map(b => branchCounts[b]),
                    backgroundColor: 'rgba(59, 130, 246, 0.4)',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    borderRadius: 6
                },
                {
                    label: 'Placed Students',
                    data: branches.map(b => branchPlaced[b]),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: '#10b981',
                    borderWidth: 1,
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'Inter' } } } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } }
            }
        }
    });

    const statusCounts = { 'Placed': 0, 'In Process': 0, 'Unplaced': 0 };
    studentDataset.forEach(s => statusCounts[s.status]++);

    const ctx2 = document.getElementById('statusChart').getContext('2d');
    if (statusChartObj) statusChartObj.destroy();
    statusChartObj = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: ['Placed', 'In Recruitment', 'Unplaced'],
            datasets: [{
                data: [statusCounts['Placed'], statusCounts['In Process'], statusCounts['Unplaced']],
                backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Inter' } } } }
        }
    });

    const total = studentDataset.length;
    const placed = statusCounts['Placed'];
    const zeroBacklog = studentDataset.filter(s => s.backlogs === 0).length;

    document.getElementById('stat-total-students').innerText = total;
    document.getElementById('stat-placed-count').innerText = placed;
    document.getElementById('stat-placement-rate').innerText = `${((placed / total) * 100).toFixed(1)}%`;
    document.getElementById('stat-eligible-count').innerText = zeroBacklog;
    document.getElementById('stat-eligible-pct').innerText = `${((zeroBacklog / total) * 100).toFixed(1)}%`;

    const previewContainer = document.getElementById('company-cards-preview');
    previewContainer.innerHTML = companies.slice(0, 3).map(c => `
        <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition">
            <div class="flex items-center justify-between">
                <span class="font-bold text-slate-100 flex items-center gap-2 text-sm">
                    <i class="${c.logo} text-blue-400"></i> ${c.name}
                </span>
                <span class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${c.ctc}</span>
            </div>
            <p class="text-xs text-slate-400">${c.role}</p>
            <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                <span>Min CGPA: <strong class="text-slate-300">${c.minCgpa}</strong></span>
                <span>Max Backlog: <strong class="text-slate-300">${c.maxBacklogs}</strong></span>
            </div>
        </div>
    `).join('');
}

function renderStudentsTable() {
    const search = document.getElementById('filter-search').value.toLowerCase();
    const branch = document.getElementById('filter-branch').value;
    const selectedYear = document.getElementById('filter-year').value;
    const minCgpa = parseFloat(document.getElementById('filter-cgpa').value);
    const backlogsFilter = document.getElementById('filter-backlogs').value;

    const filtered = studentDataset.filter(s => {
        const matchSearch = s.fullName.toLowerCase().includes(search) || s.id.toLowerCase().includes(search);
        const matchBranch = branch === 'ALL' || s.branch === branch;
        const matchYear = selectedYear === 'ALL' || s.academicYear === selectedYear;
        const matchCgpa = s.cgpa >= minCgpa;
        let matchBacklogs = true;
        if (backlogsFilter === 'ZERO') matchBacklogs = s.backlogs === 0;
        if (backlogsFilter === 'MAX_1') matchBacklogs = s.backlogs <= 1;

        return matchSearch && matchBranch && matchYear && matchCgpa && matchBacklogs;
    });

    const tbody = document.getElementById('student-table-body');
    tbody.innerHTML = filtered.map(s => `
        <tr class="hover:bg-slate-800/40 transition">
            <td class="py-3 px-4 font-medium text-slate-200">
                <div class="flex items-center space-x-2.5">
                    <div class="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 text-[11px]">
                        ${s.fullName.charAt(0)}
                    </div>
                    <span>${s.fullName}</span>
                </div>
            </td>
            <td class="py-3 px-4 text-slate-400 code-font">${s.id}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">${s.branch}</span>
            </td>
            <td class="py-3 px-4 text-slate-300">${s.academicYear || '—'}</td>
            <td class="py-3 px-4 font-bold ${s.cgpa >= 8.5 ? 'text-emerald-400' : 'text-slate-200'}">${s.cgpa.toFixed(2)}</td>
            <td class="py-3 px-4">
                ${s.backlogs === 0
                    ? '<span class="text-emerald-400 text-[11px] flex items-center gap-1"><i class="fa-solid fa-circle-check"></i> 0 Clear</span>'
                    : `<span class="text-rose-400 text-[11px] font-semibold flex items-center gap-1"><i class="fa-solid fa-triangle-exclamation"></i> ${s.backlogs} Active</span>`}
            </td>
            <td class="py-3 px-4 code-font text-blue-400">${s.codingScore} pts</td>
            <td class="py-3 px-4">
                ${s.status === 'Placed'
                    ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><i class="fa-solid fa-check mr-1"></i>${s.company}</span>`
                    : s.status === 'In Process'
                    ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">In Drive</span>'
                    : '<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">Available</span>'}
            </td>
        </tr>
    `).join('');

    document.getElementById('student-table-count').innerText = `Showing ${filtered.length} of ${studentDataset.length} registered candidates`;
}

function resetStudentFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-branch').value = 'ALL';
    document.getElementById('filter-year').value = 'ALL';
    document.getElementById('filter-cgpa').value = 6.0;
    document.getElementById('cgpa-val').innerText = '6.0';
    document.getElementById('filter-backlogs').value = 'ZERO';
    renderStudentsTable();
}

function renderMatcherSection() {
    const selectorList = document.getElementById('company-selector-list');
    selectorList.innerHTML = companies.map(c => `
        <div onclick="selectCompanyMatch('${c.id}')" class="p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${selectedCompany.id === c.id ? 'bg-blue-600/10 border-blue-500/50 shadow-md' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'}">
            <div class="flex items-center space-x-3">
                <div class="p-2 rounded-lg bg-slate-800 text-blue-400 text-sm">
                    <i class="${c.logo}"></i>
                </div>
                <div>
                    <h4 class="font-bold text-slate-100 text-xs">${c.name}</h4>
                    <p class="text-[11px] text-slate-400">Cutoff CGPA: ${c.minCgpa} | Max Backlogs: ${c.maxBacklogs}</p>
                </div>
            </div>
            <i class="fa-solid fa-chevron-right text-xs ${selectedCompany.id === c.id ? 'text-blue-400' : 'text-slate-600'}"></i>
        </div>
    `).join('');

    document.getElementById('selected-company-header').innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="p-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-lg">
                <i class="${selectedCompany.logo}"></i>
            </div>
            <div>
                <h2 class="text-base font-bold text-slate-100">${selectedCompany.name} Recruitment Drive</h2>
                <p class="text-xs text-slate-400">${selectedCompany.role} • <span class="text-emerald-400 font-semibold">${selectedCompany.ctc}</span></p>
            </div>
        </div>
        <div class="flex items-center gap-2">
            <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Min CGPA: <strong>${selectedCompany.minCgpa}</strong></span>
            <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">Max Backlogs: <strong>${selectedCompany.maxBacklogs}</strong></span>
        </div>
    `;

    const branchesSql = selectedCompany.branches.map(b => `'${b}'`).join(', ');
    document.getElementById('matcher-sql-preview').innerText = 
`SELECT s.full_name, s.branch, a.cgpa, a.active_backlogs 
FROM Students s
JOIN AcademicRecords a ON s.student_id = a.student_id
WHERE a.cgpa >= ${selectedCompany.minCgpa}
  AND a.active_backlogs <= ${selectedCompany.maxBacklogs}
  AND s.branch IN (${branchesSql})
ORDER BY a.cgpa DESC;`;

    const eligible = studentDataset.filter(s => 
        s.cgpa >= selectedCompany.minCgpa &&
        s.backlogs <= selectedCompany.maxBacklogs &&
        selectedCompany.branches.includes(s.branch)
    );

    document.getElementById('eligible-candidates-count').innerText = eligible.length;
    const tbody = document.getElementById('eligible-students-body');

    if (eligible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center py-6 text-slate-500">No candidates match this criteria. Try adjusting criteria.</td></tr>';
    } else {
        tbody.innerHTML = eligible.map(s => `
            <tr class="hover:bg-slate-800/40">
                <td class="py-2.5 px-4 font-medium text-slate-200">${s.fullName}</td>
                <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">${s.branch}</span></td>
                <td class="py-2.5 px-4 font-bold text-emerald-400">${s.cgpa.toFixed(2)}</td>
                <td class="py-2.5 px-4 text-slate-300">${s.backlogs}</td>
                <td class="py-2.5 px-4 code-font text-blue-400">${s.codingScore}</td>
                <td class="py-2.5 px-4">
                    <span class="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Matched</span>
                </td>
            </tr>
        `).join('');
    }
}

function selectCompanyMatch(id) {
    selectedCompany = companies.find(c => c.id === id);
    renderMatcherSection();
}

function runCustomMatcher() {
    const minCgpa = parseFloat(document.getElementById('custom-cgpa').value) || 0;
    const maxBacklogs = parseInt(document.getElementById('custom-backlogs').value) || 0;

    selectedCompany = {
        id: 'custom',
        name: 'Custom Evaluation Criteria',
        logo: 'fa-solid fa-sliders',
        role: 'Custom Assessment',
        ctc: 'N/A',
        minCgpa: minCgpa,
        maxBacklogs: maxBacklogs,
        branches: ['CSE', 'IT', 'ECE', 'EEE', 'MECH']
    };

    renderMatcherSection();
}

function exportEligibleCsv() {
    const eligible = studentDataset.filter(s => 
        s.cgpa >= selectedCompany.minCgpa &&
        s.backlogs <= selectedCompany.maxBacklogs &&
        selectedCompany.branches.includes(s.branch)
    );

    let csv = 'Student ID,Full Name,Branch,CGPA,Active Backlogs,Coding Score\n';
    eligible.forEach(s => {
        csv += `${s.id},"${s.fullName}",${s.branch},${s.cgpa},${s.backlogs},${s.codingScore}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `Eligible_Candidates_${selectedCompany.name}.csv`);
    a.click();
}

function setRankingMode(mode) {
    currentRankingMode = mode;
    document.getElementById('rank-mode-overall').className = mode === 'OVERALL' ? 'px-3 py-1.5 rounded-lg font-medium bg-blue-600 text-white transition' : 'px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition';
    document.getElementById('rank-mode-branch').className = mode === 'PARTITION_BRANCH' ? 'px-3 py-1.5 rounded-lg font-medium bg-blue-600 text-white transition' : 'px-3 py-1.5 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition';
    renderRankingsTable();
}

function renderRankingsTable() {
    const sqlQueryEl = document.getElementById('ranking-sql-query');

    if (currentRankingMode === 'OVERALL') {
        sqlQueryEl.innerText = `SELECT full_name, branch, coding_score, cgpa,
       DENSE_RANK() OVER (ORDER BY coding_score DESC, cgpa DESC) as dense_rank_val,
       ROW_NUMBER() OVER (ORDER BY coding_score DESC, cgpa DESC) as row_num_val,
       RANK()       OVER (ORDER BY coding_score DESC) as rank_val
FROM Students;`;
    } else {
        sqlQueryEl.innerText = `SELECT full_name, branch, coding_score, cgpa,
       DENSE_RANK() OVER (PARTITION BY branch ORDER BY coding_score DESC, cgpa DESC) as dense_rank_val,
       ROW_NUMBER() OVER (PARTITION BY branch ORDER BY coding_score DESC, cgpa DESC) as row_num_val,
       RANK()       OVER (PARTITION BY branch ORDER BY coding_score DESC) as rank_val
FROM Students;`;
    }

    let list = [...studentDataset];

    if (currentRankingMode === 'PARTITION_BRANCH') {
        list.sort((a, b) => a.branch.localeCompare(b.branch) || b.codingScore - a.codingScore || b.cgpa - a.cgpa);
    } else {
        list.sort((a, b) => b.codingScore - a.codingScore || b.cgpa - a.cgpa);
    }

    let currentBranch = '';
    let denseRank = 0;
    let rowNum = 0;
    let actualRank = 0;
    let prevScore = -1;
    let itemsInGroup = 0;

    const rankedData = list.map((item) => {
        if (currentRankingMode === 'PARTITION_BRANCH' && item.branch !== currentBranch) {
            currentBranch = item.branch;
            denseRank = 0;
            rowNum = 0;
            actualRank = 0;
            prevScore = -1;
            itemsInGroup = 0;
        }

        rowNum++;
        itemsInGroup++;

        if (item.codingScore !== prevScore) {
            denseRank++;
            actualRank = itemsInGroup;
            prevScore = item.codingScore;
        }

        return {
            ...item,
            denseRankVal: denseRank,
            rowNumVal: rowNum,
            rankVal: actualRank
        };
    });

    const tbody = document.getElementById('rankings-table-body');
    tbody.innerHTML = rankedData.slice(0, 30).map(s => `
        <tr class="hover:bg-slate-800/40 border-b border-slate-800/40">
            <td class="py-2.5 px-4 font-medium text-slate-200">${s.fullName}</td>
            <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">${s.branch}</span></td>
            <td class="py-2.5 px-4 text-center code-font text-slate-200 font-semibold">${s.codingScore}</td>
            <td class="py-2.5 px-4 text-center text-slate-300">${s.cgpa.toFixed(2)}</td>
            <td class="py-2.5 px-4 text-center font-bold text-purple-400 bg-purple-500/5 code-font">${s.denseRankVal}</td>
            <td class="py-2.5 px-4 text-center font-bold text-blue-400 bg-blue-500/5 code-font">${s.rowNumVal}</td>
            <td class="py-2.5 px-4 text-center font-bold text-emerald-400 bg-emerald-500/5 code-font">${s.rankVal}</td>
        </tr>
    `).join('');
}

function renderPipeline() {
    const compFilter = document.getElementById('pipeline-company-filter').value;
    const stages = ['Applied', 'Written Test', 'Technical Round', 'HR Round', 'Selected'];

    stages.forEach(st => {
        const col = document.getElementById(`col-${st}`);
        const filtered = studentDataset.filter(s => s.pipelineStage === st && (compFilter === 'ALL' || s.company === compFilter || s.company === '-' || st === 'Applied'));

        document.getElementById(`cnt-${st}`).innerText = filtered.length;

        col.innerHTML = filtered.slice(0, 8).map(s => `
            <div class="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shadow-sm space-y-1.5 hover:border-slate-500 transition">
                <div class="flex items-center justify-between">
                    <span class="font-bold text-slate-200 text-xs">${s.fullName}</span>
                    <span class="text-[10px] font-semibold text-slate-400">${s.branch}</span>
                </div>
                <div class="flex items-center justify-between text-[11px] text-slate-400">
                    <span>CGPA: <strong class="text-emerald-400">${s.cgpa.toFixed(2)}</strong></span>
                    <span class="code-font text-blue-400">${s.codingScore} pts</span>
                </div>
                ${st !== 'Applied' ? `<div class="text-[10px] text-purple-300 font-medium pt-1 border-t border-slate-700/50"><i class="fa-solid fa-building text-[9px] mr-1"></i>${s.company === '-' ? 'Company TBD' : s.company}</div>` : ''}
            </div>
        `).join('');
    });
}

window.onload = async function() {
    await ensureAuthStorage();
    registerAuthEvents();
    selectAuthRole('user');
    toggleAuthView('signin');
    document.getElementById('author-name').value = currentUser && currentUser.role === 'author' ? currentUser.name : '';

    if (currentUser) {
        showAppShell();
    } else {
        showAuthScreen();
    }

    renderAuthorPosts();
    await generateStudents();

    setInterval(() => {
        if (document.getElementById('app-shell') && !document.getElementById('app-shell').classList.contains('hidden')) {
            generateStudents();
        }
    }, 5000);
};
