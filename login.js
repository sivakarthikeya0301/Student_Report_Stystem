const KEYS = {
    users: 'users', reports: 'reports', settings: 'gradingSettings', current: 'currentUser', remember: 'rememberedUser', theme: 'theme'
};
const defaults = {
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
};
function read(k, f = []) {
    try {
        return JSON.parse(localStorage.getItem(k)) ?? f
    } catch {
        return f
    }
}
function write(k, v) {
    localStorage.setItem(k, JSON.stringify(v))
}
function init() {
    let users = read(KEYS.users);
    if (!users.some(u => u.email === 'admin@school.com')) users.unshift({
        id: 'admin-1', name: 'System Administrator', email: 'admin@school.com', password: 'admin123', role: 'admin'
    });
    write(KEYS.users, users);
    if (!localStorage.getItem(KEYS.reports)) write(KEYS.reports, []);
    if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, defaults);
    applyTheme(localStorage.getItem(KEYS.theme) || 'light');
    const remembered = read(KEYS.remember, null);
    if (remembered && remembered.email) {
        document.getElementById('loginEmail').value = remembered.email;
        document.getElementById('rememberMe').checked = true
    }
}
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEYS.theme, theme);
    const b = document.getElementById('themeToggle');
    if (b) b.textContent = theme === 'dark' ? '☀️': '🌙'
}
function init() {
    let users = read(KEYS.users);
    if (!users.some(u => u.email === 'admin@school.com')) users.unshift({
        id: 'admin-1', name: 'System Administrator', email: 'admin@school.com', password: 'admin123', role: 'admin'
    });
    write(KEYS.users, users);
    if (!localStorage.getItem(KEYS.reports)) write(KEYS.reports, []);
    if (!localStorage.getItem(KEYS.settings)) write(KEYS.settings, defaults);
    applyTheme(localStorage.getItem(KEYS.theme) || 'light');
    const remembered = read(KEYS.remember, null);
    if (remembered && remembered.email) {
        document.getElementById('loginEmail').value = remembered.email;
        document.getElementById('rememberMe').checked = true
    }
}
function msg(id, text, type = 'error') {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = `message ${type}`
}
document.getElementById('themeToggle').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light': 'dark');
const passwordToggle = document.getElementById('passwordToggle');
passwordToggle.onclick = () => {
    const input = document.getElementById('loginPassword');
    const visible = input.type === 'text';
    input.type = visible ? 'password': 'text';
    passwordToggle.textContent = visible ? '👁️': '🙈';
    passwordToggle.setAttribute('aria-label', visible ? 'Show password': 'Hide password');
    passwordToggle.title = visible ? 'Show password': 'Hide password'
};
document.getElementById('loginForm').onsubmit = e => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase(), password = document.getElementById('loginPassword').value, user = read(KEYS.users).find(u => u.email === email && u.password === password);
    if (!user) return msg('loginMessage', 'Invalid email or password. Please use the credentials provided by Admin.', 'error');
    write(KEYS.current, user);
    if (document.getElementById('rememberMe').checked) write(KEYS.remember, {
        email
    });
    else localStorage.removeItem(KEYS.remember);
    location.href = user.role === 'admin' ? 'Admin/admin.html': user.role === 'teacher' ? 'Teacher/teacher.html': 'Student/student.html'
};
init();
