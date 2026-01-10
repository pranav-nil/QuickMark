
const API_BASE = "/api"; // when served from the same host (backend should serve static files)

/* ---------- Utilities ---------- */
function el(tag, cls, inner) { 
    const e = document.createElement(tag); 
    if (cls) e.className = cls; if (inner !== undefined) e.innerHTML = inner;
     return e; 
    }

function sanitize(s) {
     try { return String(s).replace(/</g, '&lt;').replace(/>/g, '&gt;');

      } catch (e) { return ''; } }


function showMessage(selector, msg, isError = false) { 
    const elMsg = document.querySelector(selector);
     if (!elMsg) return; 
     elMsg.textContent = msg;
      elMsg.style.color = isError ? 'var(--danger)' : 'inherit'; }

/* ---------- Fetch & Render ---------- */
async function fetchBooks() {
    const grid = document.getElementById('booksGrid');
    const message = document.getElementById('message');
    grid.innerHTML = '';
    showMessage('#message', 'Loading books...');
    try {
        const res = await fetch(API_BASE + '/books', { credentials: 'include' });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || (res.status + ' ' + res.statusText));
        }
        const books = await res.json();
        if (!Array.isArray(books)) throw new Error('Invalid response from server');
        if (books.length === 0) {
            showMessage('#message', 'No books found. Add your first book!');
            return;
        }
        showMessage('#message', '');
        books.forEach(b => grid.appendChild(renderBookCard(b)));
    } catch (err) {
        console.error(err);
        showMessage('#message', 'Failed to load books — ' + err.message, true);
    }
}

function renderBookCard(book) {
    const card = el('article', 'card book-card');
    const title = el('h3', '', sanitize(book.title || book.bookname || 'Untitled'));
    const author = el('p', '', 'by ' + sanitize(book.author || 'Unknown'));
    const link = sanitize(book.link || '#');
    const meta = el('div', 'meta', 'ID: ' + (book.id || '-'));

    const actions = el('div', 'actions');
    const openBtn = el('a', 'open-btn', '📖 Open');
    openBtn.href = link;
    openBtn.target = '_blank';
    openBtn.rel = 'noopener noreferrer';
    actions.appendChild(openBtn);

    // Optionally show delete if backend supports it
    if (book.canDelete !== false) {
        const del = el('button', 'btn btn-ghost', 'Delete');
        del.onclick = async () => {
            if (!confirm('Delete this book?')) return;
            try {
                const res = await fetch(API_BASE + '/books/' + encodeURIComponent(book.id), { method: 'DELETE', credentials: 'include' });
                if (!res.ok) throw new Error('Delete failed');
                // remove card from UI
                card.remove();
            } catch (err) {
                alert('Failed to delete: ' + err.message);
            }
        };
        actions.appendChild(del);
    }

    card.appendChild(title);
    card.appendChild(author);
    card.appendChild(meta);
    card.appendChild(actions);
    return card;
}

/* ---------- Add Book Form (on add.html) ---------- */
async function handleAddForm(e) {
    if (e) e.preventDefault();
    const formMsg = '#formMessage';
    showMessage(formMsg, '');
    const title = document.getElementById('title')?.value?.trim();
    const author = document.getElementById('author')?.value?.trim();
    const link = document.getElementById('link')?.value?.trim();
    // Basic validation
    if (!title) return showMessage(formMsg, 'Title is required', true);
    if (!author) return showMessage(formMsg, 'Author is required', true);
    if (!link) return showMessage(formMsg, 'Link or path is required', true);
    // Optional: validate link pattern (http or file path)
    if (link.length > 1000) return showMessage(formMsg, 'Link is too long', true);

    const payload = { title, author, link };

    try {
        const res = await fetch(API_BASE + '/books', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || res.statusText);
        }
        const created = await res.json();
        showMessage(formMsg, 'Book added successfully ✨');
        // reset form
        document.getElementById('addBookForm')?.reset();
        // redirect to home after short delay so user sees message
        setTimeout(() => window.location.href = '/home.html', 900);
    } catch (err) {
        console.error(err);
        showMessage(formMsg, 'Failed to add book: ' + err.message, true);
    }
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
    // home page logic
    if (document.getElementById('booksGrid')) {
        fetchBooks();
        document.getElementById('refreshBtn').addEventListener('click', fetchBooks);
        const search = document.getElementById('search');
        search.addEventListener('input', () => {
            // simple client-side filter
            const q = search.value.trim().toLowerCase();
            document.querySelectorAll('#booksGrid .book-card').forEach(card => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(q) ? '' : 'none';
            });
        });
    }

    // add page logic
    if (document.getElementById('addBookForm')) {
        document.getElementById('addBookForm').addEventListener('submit', handleAddForm);
    }
});
