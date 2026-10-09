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
if (!currentUser || currentUser.role !== 'teacher') location.href = '../login.html';
function applyTheme(t) {
    document.documentElement.dataset.theme = t;
    localStorage.setItem(K.theme, t);
    themeToggle.textContent = t === 'dark' ? '☀️' : '🌙'
}
applyTheme(localStorage.getItem(K.theme) || 'light');
teacherName.textContent = currentUser.name;
dashName.textContent = currentUser.name;
themeToggle.onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
document.querySelectorAll('.nav-btn').forEach(b => b.onclick = () => showSection(b.dataset.section));
const getUsers = () => read(K.users), getReports = () => read(K.reports), getMaps = () => read(K.maps);
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
};
function grade(m) {
    return settings().grades.slice().sort((a, b) => b.min - a.min).find(g => m >= g.min)?.label || 'F'
}
function showSection(id) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.section === id));
    if (id === 'dashboard') loadDashboard();
    if (id === 'roster') loadRoster();
    if (id === 'addReport') loadStudents();
    if (id === 'reports') loadReports()
}
function assigned() {
    return getMaps().filter(m => m.teacherEmail === currentUser.email)
}
function loadDashboard() {
    const maps = assigned(), classes = [...new Set(maps.map(m => m.className))], students = getUsers().filter(u => u.role === 'student' && (!u.className || classes.includes(u.className))), reports = getReports().filter(r => r.teacherEmail === currentUser.email), avg = reports.length ? reports.reduce((a, r) => a + Number(r.marks || 0), 0) / reports.length : 0;
    classCount.textContent = classes.length;
    studentCount.textContent = students.length;
    reportCount.textContent = reports.length;
    avgMarks.textContent = avg.toFixed(1) + '%';
    assignmentCards.innerHTML = maps.map(m => `<div class="assignment"><span>SUBJECT</span><strong>${esc(m.subject)}</strong><small>${esc(m.className)} · ${esc(m.teacherName)}</small></div>`).join('') || '<div class="empty">No class assignments yet. Ask the administrator to map your classes.</div>'
}
function loadStudents() {
    const maps = assigned(), classes = [...new Set(maps.map(m => m.className))], students = getUsers().filter(u => u.role === 'student' && (!u.className || classes.includes(u.className)));
    student.innerHTML = '<option value="">Select student</option>' + students.map(s => `<option value="${esc(s.email)}">${esc(s.name)} · ${esc(s.className || 'Unassigned')}</option>`).join('');
    if (student.value) updateStudentClass()
}
student.onchange = updateStudentClass;
function updateStudentClass() {
    const s = getUsers().find(u => u.email === student.value);
    reportClass.value = s?.className || ''
}
function recalc() {
    const total = Number(testMarks.value || 0) + Number(examMarks.value || 0);
    totalMarks.value = total;
    liveGrade.textContent = grade(total);
    liveResult.textContent = total >= settings().passMark ? 'Pass' : 'Fail'
}
[testMarks, examMarks].forEach(x => x.addEventListener('input', recalc));
reportForm.onsubmit = e => {
    e.preventDefault();
    const s = getUsers().find(u => u.email === student.value);
    if (!s) return;
    const test = Number(testMarks.value), exam = Number(examMarks.value), marks = test + exam, attendanceValue = Number(attendance.value);
    if (test > 40 || exam > 60 || marks > 100 || attendanceValue > 100) return formMessage.textContent = 'Please enter valid marks and attendance.';
    const reports = getReports();
    const report = {
        id: Date.now(), studentEmail: s.email, studentName: s.name, studentId: s.studentId || '', className: s.className || '', subject: subject.value.trim(), testMarks: test, examMarks: exam, marks, percentage: marks, grade: grade(marks), result: marks >= settings().passMark ? 'Pass' : 'Fail', attendance: attendanceValue, attendanceStatus: attendanceStatus.value, remarks: remarks.value.trim(), teacherEmail: currentUser.email, date: new Date().toLocaleDateString()
    };
    reports.push(report);
    write(K.reports, reports);
    formMessage.textContent = 'Report saved successfully. The student portal will reflect it immediately.';
    e.target.reset();
    totalMarks.value = '0';
    liveGrade.textContent = 'F';
    liveResult.textContent = 'Fail';
    loadDashboard()
};
function loadRoster() {
    const maps = assigned(), classes = [...new Set(maps.map(m => m.className))];
    rosterClass.innerHTML = '<option value="all">All assigned classes</option>' + classes.map(c => `<option>${esc(c)}</option>`).join('');
    renderRoster()
}
rosterClass.onchange = renderRoster;
function renderRoster() {
    const cls = rosterClass.value, classes = assigned().map(m => m.className), students = getUsers().filter(u => u.role === 'student' && classes.includes(u.className) && (cls === 'all' || u.className === cls)), reports = getReports();
    rosterTable.innerHTML = students.map(s => {
        const r = reports.filter(x => x.studentEmail === s.email && x.teacherEmail === currentUser.email).slice(-1)[0];
        return `<tr><td><strong>${esc(s.name)}</strong></td><td>${esc(s.email)}</td><td>${esc(s.studentId || '—')}</td><td>${esc(s.className || '—')}</td><td><span class="badge grade">${esc(r?.grade || '—')}</span></td>
        <td>${r ? r.attendance + '% · ' + esc(r.attendanceStatus || '') : '—'}</td></tr>`
    }).join('') || emptyRow(6, 'No students found in this class.')
}
function loadReports() {
    const q = (reportSearch.value || '').toLowerCase(), f = reportFilter.value, rows = getReports().filter(r => r.teacherEmail === currentUser.email).filter(r => (`${r.studentName} ${r.subject}`.toLowerCase().includes(q)) && (f === 'all' || r.result === f));
    reportsTable.innerHTML = rows.slice().reverse().map(r => `<tr><td>${esc(r.studentName)}</td><td>${esc(r.subject)}</td><td>${r.testMarks ?? '—'}</td><td>${r.examMarks ?? '—'}</td><td><strong>${r.marks}%</strong></td><td>${r.attendance}%</td><td><span class="badge grade">${esc(r.grade)}</span></td><td><span class="badge ${r.result.toLowerCase()}">${r.result}</span></td><td><button class="small-btn" onclick="editReport(${r.id})">Edit</button></td></tr>`).join('') || emptyRow(9, 'No reports submitted yet.')
}
function editReport(id) {
    const r = getReports().find(x => x.id === id);
    if (!r) return;
    showSection('addReport');
    student.value = r.studentEmail;
    updateStudentClass();
    subject.value = r.subject;
    testMarks.value = r.testMarks ?? r.marks;
    examMarks.value = r.examMarks ?? 0;
    attendance.value = r.attendance;
    attendanceStatus.value = r.attendanceStatus || 'Present';
    remarks.value = r.remarks || '';
    recalc();
    formMessage.textContent = 'Editing a report: saving will create an updated version.';
    reportForm.onsubmit = ev => {
        ev.preventDefault();
        const reports = getReports(), i = reports.findIndex(x => x.id === id);
        reports[i] = {
            ...reports[i], subject: subject.value.trim(), testMarks: Number(testMarks.value), examMarks: Number(examMarks.value), marks: Number(totalMarks.value), percentage: Number(totalMarks.value), grade: grade(Number(totalMarks.value)), result: Number(totalMarks.value) >= settings().passMark ? 'Pass' : 'Fail', attendance: Number(attendance.value), attendanceStatus: attendanceStatus.value, remarks: remarks.value.trim(), date: new Date().toLocaleDateString()
        };
        write(K.reports, reports);
        formMessage.textContent = 'Report updated successfully.';
        showSection('reports');
        resetReportHandler()
    }
}
function resetReportHandler() {
    reportForm.onsubmit = defaultSubmit
}
const defaultSubmit = reportForm.onsubmit;
function emptyRow(n, t) {
    return `<tr><td colspan="${n}" class="empty">${t}</td></tr>`
}
[reportSearch, reportFilter].forEach(x => x.addEventListener('input', loadReports));
function logout() {
    localStorage.removeItem(K.current);
    location.href = '../login.html'
}
loadDashboard();
