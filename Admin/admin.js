const K = {
    users: 'users', reports: 'reports', settings: 'gradingSettings', maps: 'teacherAssignments', current: 'currentUser', theme: 'theme'
};
const read = (k, f = []) => {
    try {
        return JSON.parse(localStorage.getItem(k)) ?? f
    } catch {
        return f
    }
};
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}
[c]));
const currentUser = read(K.current, null);
if (!currentUser || currentUser.role !== 'admin') location.href = '../login.html';
function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(K.theme, t);
    document.getElementById('themeToggle').textContent = t === 'dark' ? '☀️': '🌙'
}
applyTheme(localStorage.getItem(K.theme) || 'light');
adminName.textContent = currentUser.name;
dashName.textContent = currentUser.name;
document.getElementById('themeToggle').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light': 'dark');
document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => showSection(b.dataset.section));
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    ({
        dashboard: loadDashboard, users: loadUsers, mapping: loadMappings, reports: loadReports, settings: loadSettings
    }
    [id] || (() => {
    }))()
}
function loadDashboard() {
    const u = read(K.users), r = read(K.reports);
    const students = u.filter(x => x.role === 'student'), teachers = u.filter(x => x.role === 'teacher');
    const avg = r.length ? r.reduce((a, x) => a + Number(x.marks || 0), 0) / r.length: 0;
    totalUsers.textContent = u.length;
    totalStudents.textContent = students.length;
    totalTeachers.textContent = teachers.length;
    classAverage.textContent = avg.toFixed(1) + '%';
    recentReports.innerHTML = r.slice(-5).reverse().map(x => `<tr><td>${esc(x.studentName)}</td><td>${esc(x.subject)}</td><td><strong>${x.marks}</strong></td><td><span class="badge grade">${esc(x.grade)}</span></td></tr>`).join('') || emptyRow(4, 'No reports submitted yet.');
    snapshot.innerHTML = `<div><span>Students</span><strong>${students.length}</strong></div><div><span>Teachers</span><strong>${teachers.length}</strong></div><div><span>Reports</span><strong>${r.length}</strong></div><div><span>Assignments</span><strong>${read(K.maps).length}</strong></div>`
}
function emptyRow(n, t) {
    return `<tr><td colspan="${n}" class="empty">${t}</td></tr>`
}
function loadUsers() {
    const q = (userSearch.value || '').toLowerCase(), role = userRoleFilter.value;
    const rows = read(K.users).filter(u => u.role !== 'admin').filter(u => (role === 'all' || u.role === role) && (`${u.name} ${u.email}`.toLowerCase().includes(q)));
    usersTable.innerHTML = rows.map(u => `<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td><td><span class="badge ${u.role}">${u.role}</span></td><td>${esc(u.className||u.studentId||'—')}</td><td class="actions"><button class="small-btn" onclick="viewUser('${u.id}')">View</button><button class="small-btn" onclick="editUser('${u.id}')">Edit</button><button class="small-btn danger" onclick="deleteUser('${u.id}')">Delete</button></td></tr>`).join('') || emptyRow(5, 'No matching users.')
}
function openUserModal(u) {
    document.getElementById('userModal').classList.remove('hidden');
    modalTitle.textContent = u ? 'Edit User': 'Add User';
    editId.value = u?.id || '';
    userName.value = u?.name || '';
    userEmail.value = u?.email || '';
    userPassword.value = '';
    userPassword.placeholder = u ? 'Leave blank to keep current password': 'Required for new users';
    userRole.value = u?.role || 'student';
    userClass.value = u?.className || '';
    userStudentId.value = u?.studentId || ''
}
function closeUserModal() {
    userModal.classList.add('hidden');
    userMessage.textContent = ''
}
function editUser(id) {
    const u = read(K.users).find(x => x.id === id);
    if (u) openUserModal(u)
}
function viewUser(id) {
    const u = read(K.users).find(x => x.id === id);
    if (u) alert(`Name: ${u.name}\nEmail: ${u.email}\nRole: ${u.role}\nClass: ${u.className||'—'}\nStudent ID: ${u.studentId||'—'}`)
}
userForm.onsubmit = e => {
    e.preventDefault();
    let users = read(K.users), id = editId.value, u = users.find(x => x.id === id);
    if (users.some(x => x.email.toLowerCase() === userEmail.value.trim().toLowerCase() && x.id !== id)) return userMessage.textContent = 'Email already exists.';
    if (u) {
        Object.assign(u, {
            name: userName.value.trim(), email: userEmail.value.trim().toLowerCase(), role: userRole.value, className: userClass.value.trim(), studentId: userStudentId.value.trim()
        });
        if (userPassword.value) u.password = userPassword.value
    } else {
        if (!userPassword.value || userPassword.value.length < 6) return userMessage.textContent = 'New users need a password of at least 6 characters.';
        users.push({
            id: `${userRole.value}-${Date.now()}`, name: userName.value.trim(), email: userEmail.value.trim().toLowerCase(), password: userPassword.value, role: userRole.value, className: userClass.value.trim(), studentId: userStudentId.value.trim()
        })
    }
    write(K.users, users);
    closeUserModal();
    loadUsers();
    loadDashboard();
    loadMappings()
};
function deleteUser(id) {
    const u = read(K.users).find(x => x.id === id);
    if (!u) return;
    if (!confirm(`Delete ${u.name}? Their account will be removed.`)) return;
    write(K.users, read(K.users).filter(x => x.id !== id));
    write(K.maps, read(K.maps).filter(x => x.teacherEmail !== u.email));
    loadUsers();
    loadDashboard();
    loadMappings()
}
function loadMappings() {
    const teachers = read(K.users).filter(u => u.role === 'teacher');
    mapTeacher.innerHTML = '<option value="">Select teacher</option>' + teachers.map(t => `<option value="${esc(t.email)}">${esc(t.name)}</option>`).join('');
    const maps = read(K.maps);
    mappingTable.innerHTML = maps.map((m, i) => `<tr><td>${esc(m.teacherName)}</td><td>${esc(m.className)}</td><td>${esc(m.subject)}</td><td><button class="small-btn danger" onclick="deleteMapping(${i})">Remove</button></td></tr>`).join('') || emptyRow(4, 'No teacher assignments yet.')
}
mappingForm.onsubmit = e => {
    e.preventDefault();
    const t = read(K.users).find(u => u.email === mapTeacher.value);
    let maps = read(K.maps);
    maps.push({
        id: Date.now(), teacherEmail: t.email, teacherName: t.name, className: mapClass.value.trim(), subject: mapSubject.value.trim()
    });
    write(K.maps, maps);
    e.target.reset();
    loadMappings()
};
function deleteMapping(i) {
    let m = read(K.maps);
    m.splice(i, 1);
    write(K.maps, m);
    loadMappings()
}
function loadReports() {
    const q = (reportSearch.value || '').toLowerCase(), rf = reportResultFilter.value;
    const users = read(K.users);
    const rows = read(K.reports).filter(r => (`${r.studentName} ${r.subject}`.toLowerCase().includes(q)) && (rf === 'all' || r.result === rf));
    reportsTable.innerHTML = rows.slice().reverse().map(r => `<tr><td>${esc(r.studentName)}</td><td>${esc(r.subject)}</td><td><strong>${r.marks}%</strong></td><td>${r.attendance}%</td><td><span class="badge grade">${esc(r.grade)}</span></td><td><span class="badge ${r.result.toLowerCase()}">${r.result}</span></td><td>${esc(users.find(u=>u.email===r.teacherEmail)?.name||r.teacherEmail||'—')}</td></tr>`).join('') || emptyRow(7, 'No reports found.')
}
function loadSettings() {
    const s = read(K.settings, {
        grades: [{
            label: 'A+', min: 90
        }, {
            label: 'A', min: 80
        }, {
            label: 'B', min: 70
        }, {
            label: 'C', min: 60
        }, {
            label: 'D', min: 50
        }, {
            label: 'F', min: 0
        }], passMark: 40
    });
    passMark.value = s.passMark;
    gradeInputs.innerHTML = s.grades.map((g, i) => `<label>${esc(g.label)} minimum %<input type="number" min="0" max="100" data-grade="${i}" value="${g.min}" required></label>`).join('')
}
settingsForm.onsubmit = e => {
    e.preventDefault();
    const grades = [...document.querySelectorAll('[data-grade]')].map((x, i) => ({
        label: read(K.settings).grades[i]?.label || ['A+', 'A', 'B', 'C', 'D', 'F'][i], min: Number(x.value)
    })).sort((a, b) => b.min - a.min);
    if (grades.some((g, i) => i && g.min >= grades[i - 1].min)) return settingsMessage.textContent = 'Each grade threshold must be lower than the one above it.';
    write(K.settings, {
        passMark: Number(passMark.value), grades
    });
    settingsMessage.textContent = 'Grading policy saved successfully.'
};
[userSearch, userRoleFilter].forEach(x => x.addEventListener('input', loadUsers));
[reportSearch, reportResultFilter].forEach(x => x.addEventListener('input', loadReports));
function logout() {
    localStorage.removeItem(K.current);
    location.href = '../login.html'
}
loadDashboard();
