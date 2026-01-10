// auth.js — handles login & signup with live error feedback

function showMessage(selector, msg, isError = false) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? 'var(--danger)' : 'inherit';
}

async function handleAuthForm(event, endpoint) {
    event.preventDefault();
    const form = event.target;
    const msgSel = '#formMessage';
    showMessage(msgSel, '');

    const username = form.username.value.trim();
    const password = form.password.value.trim();

    if (!username || !password)
        return showMessage(msgSel, 'Both fields are required.', true);

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
        });

        const text = await res.text();

        if (!res.ok) throw new Error(text || res.statusText);

        // success: redirect accordingly
        if (endpoint === '/signup') {
            showMessage(msgSel, '✅ Signup successful! Redirecting to login...');
            setTimeout(() => (window.location.href = '/login.html'), 1200);
        } else {
            showMessage(msgSel, '✅ Login successful! Redirecting...');
            setTimeout(() => (window.location.href = '/home.html'), 800);
        }
    } catch (err) {
        console.error(err);
        showMessage(msgSel, err.message || 'Request failed', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('#loginForm');
    const signupForm = document.querySelector('#signupForm');

    if (loginForm)
        loginForm.addEventListener('submit', (e) => handleAuthForm(e, '/login'));
    if (signupForm)
        signupForm.addEventListener('submit', (e) => handleAuthForm(e, '/signup'));
});
