// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', async () => {
    const response = await fetch('/auth/me');

    if (response.status === 200) {
        const user = await response.json();
        showManagementSection(user.username);
        await loadCategories();
        await loadContacts();
    } else {
        showLoginSection();
    }
});

function showLoginSection() {
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('managementSection').style.display = 'none';
}

function showManagementSection(username) {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('managementSection').style.display = 'block';
    document.getElementById('username').textContent = username + ' 님';
}

// 회원가입
async function handleSignup() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');

    if (!username || !password) {
        messageEl.textContent = '아이디와 비밀번호를 입력하세요';
        return;
    }

    const response = await fetch('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.status === 201) {
        messageEl.textContent = '가입 완료! 로그인해 주세요';
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        const error = await response.json();
        messageEl.textContent = error.detail || '가입 실패';
    }
}

// 로그인
async function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageEl = document.getElementById('loginMessage');

    if (!username || !password) {
        messageEl.textContent = '아이디와 비밀번호를 입력하세요';
        return;
    }

    const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (response.status === 200) {
        const user = await fetch('/auth/me').then(r => r.json());
        showManagementSection(user.username);
        await loadCategories();
        await loadContacts();
    } else {
        messageEl.textContent = '아이디 또는 비밀번호가 올바르지 않습니다';
    }
}

// 로그아웃
async function handleLogout() {
    const response = await fetch('/auth/logout', { method: 'POST' });
    if (response.status === 200) {
        showLoginSection();
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginMessage').textContent = '';
    }
}

// 카테고리 로드
async function loadCategories() {
    const response = await fetch('/categories');
    if (response.status === 200) {
        const categories = await response.json();
        updateCategorySelects(categories);
        renderCategoryList(categories);
    }
}

function updateCategorySelects(categories) {
    const selects = ['contactCategory', 'searchCategory'];

    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        const defaultOption = selectId === 'contactCategory' ? '종류' : '모든 종류';

        select.innerHTML = `<option value="">${defaultOption}</option>`;

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });

        if (currentValue) {
            select.value = currentValue;
        }
    });
}

function renderCategoryList(categories) {
    const list = document.getElementById('categoriesList');
    list.innerHTML = '';

    categories.forEach(cat => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${cat.name}</span>
            <div class="category-actions">
                <button class="category-edit" onclick="handleEditCategory(${cat.id}, '${cat.name}')">수정</button>
                <button class="category-delete" onclick="handleDeleteCategory(${cat.id})">삭제</button>
            </div>
        `;
        list.appendChild(li);
    });
}

async function handleAddCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();

    if (!name) {
        showError('카테고리 이름을 입력하세요');
        return;
    }

    const response = await fetch('/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    if (response.status === 201) {
        nameInput.value = '';
        showInfo('카테고리가 추가되었습니다');
        await loadCategories();
    } else {
        const error = await response.json();
        showError(error.detail || '카테고리 추가 실패');
    }
}

async function handleEditCategory(categoryId, oldName) {
    const newName = prompt(`카테고리 이름 변경 (현재: ${oldName}):`, oldName);
    if (!newName || newName === oldName) return;

    const response = await fetch(`/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
    });

    if (response.status === 200) {
        showInfo('카테고리가 수정되었습니다');
        await loadCategories();
        await loadContacts();
    } else {
        const error = await response.json();
        showError(error.detail || '카테고리 수정 실패');
    }
}

async function handleDeleteCategory(categoryId) {
    if (!confirm('정말 삭제할까요?')) return;

    const response = await fetch(`/categories/${categoryId}`, {
        method: 'DELETE'
    });

    if (response.status === 204) {
        showInfo('카테고리가 삭제되었습니다');
        await loadCategories();
    } else {
        const error = await response.json();
        showError(error.detail || '카테고리 삭제 실패');
    }
}

// 연락처 로드
async function loadContacts(searchName = '', categoryId = '') {
    let url = '/contacts';
    const params = new URLSearchParams();
    if (searchName) params.append('name', searchName);
    if (categoryId) params.append('category_id', categoryId);
    if (params.toString()) url += '?' + params.toString();

    const response = await fetch(url);
    if (response.status === 200) {
        const data = await response.json();
        renderContactsList(data.items);
        document.getElementById('totalCount').textContent = data.total;
    }
}

function renderContactsList(contacts) {
    const tbody = document.getElementById('contactsList');
    tbody.innerHTML = '';

    contacts.forEach(contact => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${contact.name}</td>
            <td>${contact.phone}</td>
            <td>${contact.addr}</td>
            <td>${contact.category_name}</td>
            <td>
                <div class="action-btns">
                    <button class="edit-btn" onclick="handleEditContact(${contact.id})">수정</button>
                    <button class="delete-btn" onclick="handleDeleteContact(${contact.id})">삭제</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleAddContact() {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const addr = document.getElementById('contactAddr').value.trim();
    const categoryId = document.getElementById('contactCategory').value;

    if (!name || !phone || !categoryId) {
        showError('모든 항목을 입력하고 종류를 선택하세요');
        return;
    }

    const response = await fetch('/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, addr, category_id: parseInt(categoryId) })
    });

    if (response.status === 201) {
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        document.getElementById('contactAddr').value = '';
        document.getElementById('contactCategory').value = '';
        showInfo('연락처가 추가되었습니다');
        await loadContacts();
    } else {
        const error = await response.json();
        showError(error.detail || '연락처 추가 실패');
    }
}

async function handleSearch() {
    const name = document.getElementById('searchName').value.trim();
    const categoryId = document.getElementById('searchCategory').value;
    await loadContacts(name, categoryId);
}

async function handleSearchAll() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchCategory').value = '';
    await loadContacts();
}

let editingContactId = null;

async function handleEditContact(contactId) {
    // 현재 목록에서 연락처 찾기
    const tbody = document.getElementById('contactsList');
    let contact = null;

    for (let row of tbody.querySelectorAll('tr')) {
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn && editBtn.onclick.toString().includes(contactId)) {
            const cells = row.querySelectorAll('td');
            contact = {
                name: cells[0].textContent,
                phone: cells[1].textContent,
                addr: cells[2].textContent,
                categoryName: cells[3].textContent
            };
            break;
        }
    }

    if (!contact) return;

    editingContactId = contactId;

    // 폼에 값 채우기
    document.getElementById('contactName').value = contact.name;
    document.getElementById('contactPhone').value = contact.phone;
    document.getElementById('contactAddr').value = contact.addr;

    const categories = await fetch('/categories').then(r => r.json());
    const selectedCat = categories.find(c => c.name === contact.categoryName);
    document.getElementById('contactCategory').value = selectedCat ? selectedCat.id : '';

    // 추가 버튼을 저장으로 변경
    const addBtn = document.querySelector('.form-section button');
    const originalText = addBtn.textContent;
    addBtn.textContent = '저장';

    // 이전 onclick 저장
    const originalOnclick = addBtn.onclick;

    addBtn.onclick = function() { handleUpdateContact(originalOnclick); };
}

async function handleUpdateContact(originalOnclick) {
    const name = document.getElementById('contactName').value.trim();
    const phone = document.getElementById('contactPhone').value.trim();
    const addr = document.getElementById('contactAddr').value.trim();
    const categoryId = document.getElementById('contactCategory').value;

    if (!name || !phone || !categoryId) {
        showError('모든 항목을 입력하고 종류를 선택하세요');
        return;
    }

    const response = await fetch(`/contacts/${editingContactId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, addr, category_id: parseInt(categoryId) })
    });

    if (response.status === 200) {
        document.getElementById('contactName').value = '';
        document.getElementById('contactPhone').value = '';
        document.getElementById('contactAddr').value = '';
        document.getElementById('contactCategory').value = '';
        showInfo('연락처가 수정되었습니다');

        // 버튼 원래대로 돌리기
        const addBtn = document.querySelector('.form-section button');
        addBtn.textContent = '추가';
        addBtn.onclick = function() { handleAddContact(); };

        editingContactId = null;
        await loadContacts();
    } else {
        const error = await response.json();
        showError(error.detail || '연락처 수정 실패');
    }
}

async function handleDeleteContact(contactId) {
    if (!confirm('정말 삭제할까요?')) return;

    const response = await fetch(`/contacts/${contactId}`, {
        method: 'DELETE'
    });

    if (response.status === 204) {
        showInfo('연락처가 삭제되었습니다');
        await loadContacts();
    } else {
        const error = await response.json();
        showError(error.detail || '연락처 삭제 실패');
    }
}

// 메시지 표시
function showInfo(message) {
    const el = document.getElementById('infoMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 2000);
}

function showError(message) {
    const el = document.getElementById('errorMessage');
    el.textContent = message;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 3000);
}
