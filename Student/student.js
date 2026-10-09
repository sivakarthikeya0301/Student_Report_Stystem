const K = {
    users: 'users', reports: 'reports', settings: 'gradingSettings', current: 'currentUser', theme: 'theme'
};
const read = (k, f = []) => {
    try {
        return JSON.parse(localStorage.getItem(k)) ?? f
    } catch {
        return f
    }
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}
[c]));
const currentUser = read(K.current, null);
if (!currentUser || currentUser.role !== 'student') location.href = '../login.html';
function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(K.theme, t);
    themeToggle.textContent = t === 'dark' ? '☀️': '🌙'
}
applyTheme(localStorage.getItem(K.theme) || 'light');
themeToggle.onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light': 'dark');
studentName.textContent = currentUser.name;
welcomeName.textContent = currentUser.name;
welcomeMeta.textContent = `${currentUser.className||'Class not assigned'} · ${currentUser.studentId||'Student account'}`;
function settings() {
    return read(K.settings, {
        passMark: 40, grades: [{
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
        }]
    })
}
function grade(m) {
    return settings().grades.slice().sort((a, b) => b.min - a.min).find(g => m >= g.min)?.label || 'F'
}
function reports() {
    return read(K.reports).filter(r => r.studentEmail === currentUser.email)
}
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    if (id === 'dashboard') loadDashboard();
    if (id === 'reports') loadReports();
    if (id === 'profile') loadProfile()
}
document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => showSection(b.dataset.section));
function loadDashboard() {
    const rs = reports();
    const avg = rs.length ? rs.reduce((a, r) => a + Number(r.marks || 0), 0) / rs.length: 0;
    const att = rs.length ? rs.reduce((a, r) => a + Number(r.attendance || 0), 0) / rs.length: 0;
    const passes = rs.filter(r => r.result === 'Pass').length;
    subjectCount.textContent = rs.length;
    averageMarks.textContent = avg.toFixed(1) + '%';
    averageAttendance.textContent = att.toFixed(1) + '%';
    passRate.textContent = (rs.length ? passes / rs.length * 100: 0).toFixed(0) + '%';
    overallGrade.textContent = rs.length ? grade(avg): '—';
    overallGpa.textContent = `GPA ${rs.length?(avg/10).toFixed(2):'—'}`;
    progressList.innerHTML = rs.map(r => `<div class="progress-item"><div class="progress-head"><strong>${esc(r.subject)}</strong><span>${r.marks}% · ${esc(r.grade)}</span></div><div class="bar"><i style="width:${Math.max(0,Math.min(100,Number(r.marks)||0))}%"></i></div><small>Attendance ${r.attendance}% · ${esc(r.result)}</small></div>`).join('') || '<div class="empty">Your reports will appear here after a teacher submits them.</div>'
}
function loadReports() {
    const rs = reports();
    const avg = rs.length ? rs.reduce((a, r) => a + Number(r.marks || 0), 0) / rs.length: 0;
    reportStudent.textContent = currentUser.name;
    reportClass.textContent = currentUser.className || '—';
    reportGpa.textContent = rs.length ? (avg / 10).toFixed(2): '—';
    reportsTable.innerHTML = rs.map(r => `<tr><td><strong>${esc(r.subject)}</strong></td><td>${r.testMarks??'—'}</td><td>${r.examMarks??'—'}</td><td><strong>${r.marks}%</strong></td><td><span class="badge grade">${esc(r.grade)}</span></td><td>${r.attendance}%<small class="attendance-status">${esc(r.attendanceStatus||'')}</small></td><td><span class="badge ${r.result.toLowerCase()}">${r.result}</span></td><td>${esc(r.remarks||'—')}</td></tr>`).join('') || '<tr><td colspan="8" class="empty">No academic reports available yet.</td></tr>'
}
function loadProfile() {
    profileName.textContent = currentUser.name;
    profileEmail.textContent = currentUser.email;
    profileId.textContent = currentUser.studentId || '—';
    profileClass.textContent = currentUser.className || '—';
    avatar.textContent = currentUser.name.split(' ').map(x => x[0]).slice(0, 2).join('').toUpperCase()
}
function printReport() {
    showSection('reports');
    setTimeout(() => window.print(), 100)
}
function logout() {
    localStorage.removeItem(K.current);
    location.href = '../login.html'
}
loadDashboard();
loadProfile();
