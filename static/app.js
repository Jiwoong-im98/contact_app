const API_BASE = "http://localhost:8000";

let currentUser = null;
let editingContactId = null;

document.addEventListener("DOMContentLoaded", () => {
    checkAuth();

    document.getElementById("loginBtn").addEventListener("click", login);
    document.getElementById("signupBtn").addEventListener("click", signup);
    document.getElementById("logoutBtn").addEventListener("click", logout);

    document.getElementById("addContactBtn").addEventListener("click", addContact);
    document.getElementById("searchBtn").addEventListener("click", searchContacts);
    document.getElementById("allBtn").addEventListener("click", loadContacts);

    document.getElementById("addCategoryBtn").addEventListener("click", addCategory);
});

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`);

        if (response.status === 401) {
            showLoginSection();
            return;
        }

        const data = await response.json();
        currentUser = data;

        showAdminSection();
        document.getElementById("username").textContent = data.username;

        await loadCategories();
        await loadContacts();
    } catch (error) {
        console.error("Auth check failed:", error);
        showLoginSection();
    }
}

function showLoginSection() {
    document.getElementById("loginSection").classList.add("show");
    document.getElementById("adminSection").classList.remove("show");
}

function showAdminSection() {
    document.getElementById("loginSection").classList.remove("show");
    document.getElementById("adminSection").classList.add("show");
}

async function signup() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        showMessage("아이디와 비밀번호를 입력하세요", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });

        console.log("Signup response status:", response.status);

        if (response.status === 201) {
            console.log("Signup success");
            showMessage("가입 완료! 로그인해 주세요", "success");
            document.getElementById("loginUsername").value = "";
            document.getElementById("loginPassword").value = "";
        } else {
            const errorData = await response.json();
            console.log("Signup error data:", errorData);
            let errorMsg = "가입에 실패했습니다";
            if (errorData.detail) {
                if (Array.isArray(errorData.detail)) {
                    errorMsg = errorData.detail[0].msg || errorMsg;
                } else {
                    errorMsg = errorData.detail;
                }
            }
            console.log("Signup error message:", errorMsg);
            showMessage(errorMsg, "error");
        }
    } catch (error) {
        console.error("Signup error:", error);
        showMessage("가입에 실패했습니다", "error");
    }
}

async function login() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;

    if (!username || !password) {
        showMessage("아이디와 비밀번호를 입력하세요", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ username, password })
        });

        if (response.status === 200) {
            document.getElementById("loginUsername").value = "";
            document.getElementById("loginPassword").value = "";
            checkAuth();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "로그인에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Login error:", error);
        showMessage("로그인에 실패했습니다", "error");
    }
}

async function logout() {
    try {
        const response = await fetch(`${API_BASE}/auth/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {
            showLoginSection();
            currentUser = null;
        }
    } catch (error) {
        console.error("Logout error:", error);
    }
}

async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`, {
            credentials: "include"
        });

        if (response.status === 401) {
            checkAuth();
            return;
        }

        const categories = await response.json();

        const select = document.getElementById("contactCategory");
        select.innerHTML = "";

        categories.forEach(category => {
            const option = document.createElement("option");
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });

        const categoryList = document.getElementById("categoryList");
        categoryList.innerHTML = "";

        categories.forEach(category => {
            const item = document.createElement("div");
            item.className = "listItem";
            item.innerHTML = `
                <div class="listItemContent">
                    <div><strong>${category.name}</strong></div>
                </div>
                <div class="listItemActions">
                    <button class="editBtn" onclick="editCategory(${category.id}, '${category.name}')">수정</button>
                    <button class="deleteBtn" onclick="deleteCategory(${category.id})">삭제</button>
                </div>
            `;
            categoryList.appendChild(item);
        });
    } catch (error) {
        console.error("Load categories error:", error);
    }
}

async function loadContacts(name = null) {
    try {
        let url = `${API_BASE}/contacts`;

        if (name) {
            url += `?name=${encodeURIComponent(name)}`;
        }

        const response = await fetch(url, {
            credentials: "include"
        });

        if (response.status === 401) {
            checkAuth();
            return;
        }

        const data = await response.json();

        document.getElementById("contactTotal").textContent = `총 ${data.total}명`;

        const contactList = document.getElementById("contactList");
        contactList.innerHTML = "";

        data.items.forEach(contact => {
            const item = document.createElement("div");
            item.className = "listItem";
            item.innerHTML = `
                <div class="listItemContent">
                    <div><strong>${contact.name}</strong> - ${contact.phone}</div>
                    <small>${contact.addr || ""} · ${contact.category_name}</small>
                </div>
                <div class="listItemActions">
                    <button class="editBtn" onclick="startEditContact(${contact.id}, '${contact.name}', '${contact.phone}', '${contact.addr || ""}', ${contact.category_id})">수정</button>
                    <button class="deleteBtn" onclick="deleteContact(${contact.id})">삭제</button>
                </div>
            `;
            contactList.appendChild(item);
        });

        resetContactForm();
    } catch (error) {
        console.error("Load contacts error:", error);
    }
}

async function searchContacts() {
    const name = document.getElementById("searchInput").value;
    if (name) {
        await loadContacts(name);
    }
}

async function addContact() {
    const name = document.getElementById("contactName").value;
    const phone = document.getElementById("contactPhone").value;
    const addr = document.getElementById("contactAddr").value;
    const categoryId = parseInt(document.getElementById("contactCategory").value);

    if (!name || !phone || !categoryId) {
        showMessage("필수 항목을 입력하세요", "error");
        return;
    }

    try {
        let url = `${API_BASE}/contacts`;
        let method = "POST";

        const body = {
            name,
            phone,
            addr,
            category_id: categoryId
        };

        if (editingContactId) {
            url += `/${editingContactId}`;
            method = "PATCH";
        }

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body)
        });

        if (response.ok) {
            showMessage(editingContactId ? "수정되었습니다" : "추가되었습니다", "success");
            resetContactForm();
            await loadContacts();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "작업에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Add contact error:", error);
        showMessage("작업에 실패했습니다", "error");
    }
}

function startEditContact(id, name, phone, addr, categoryId) {
    editingContactId = id;

    document.getElementById("contactName").value = name;
    document.getElementById("contactPhone").value = phone;
    document.getElementById("contactAddr").value = addr;
    document.getElementById("contactCategory").value = categoryId;

    document.getElementById("addContactBtn").textContent = "저장";
}

function resetContactForm() {
    editingContactId = null;
    document.getElementById("contactName").value = "";
    document.getElementById("contactPhone").value = "";
    document.getElementById("contactAddr").value = "";
    document.getElementById("searchInput").value = "";
    document.getElementById("addContactBtn").textContent = "추가";

    if (document.getElementById("contactCategory").options.length > 0) {
        document.getElementById("contactCategory").selectedIndex = 0;
    }
}

async function deleteContact(id) {
    if (!confirm("정말 삭제하시겠습니까?")) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/contacts/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (response.ok) {
            showMessage("삭제되었습니다", "success");
            await loadContacts();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "삭제에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Delete contact error:", error);
        showMessage("삭제에 실패했습니다", "error");
    }
}

async function addCategory() {
    const name = document.getElementById("categoryName").value;

    if (!name) {
        showMessage("카테고리명을 입력하세요", "error");
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            showMessage("추가되었습니다", "success");
            document.getElementById("categoryName").value = "";
            await loadCategories();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "추가에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Add category error:", error);
        showMessage("추가에 실패했습니다", "error");
    }
}

async function editCategory(id, currentName) {
    const newName = prompt("새 카테고리명을 입력하세요", currentName);

    if (!newName || newName === currentName) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name: newName })
        });

        if (response.ok) {
            showMessage("수정되었습니다", "success");
            await loadCategories();
            await loadContacts();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "수정에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Edit category error:", error);
        showMessage("수정에 실패했습니다", "error");
    }
}

async function deleteCategory(id) {
    if (!confirm("정말 삭제하시겠습니까?")) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/categories/${id}`, {
            method: "DELETE",
            credentials: "include"
        });

        if (response.ok) {
            showMessage("삭제되었습니다", "success");
            await loadCategories();
            await loadContacts();
        } else {
            const errorData = await response.json();
            showMessage(errorData.detail || "삭제에 실패했습니다", "error");
        }
    } catch (error) {
        console.error("Delete category error:", error);
        showMessage("삭제에 실패했습니다", "error");
    }
}

function showMessage(text, type) {
    const messageEl = document.getElementById("loginMessage");
    messageEl.textContent = text;
    messageEl.className = `message show ${type}`;

    setTimeout(() => {
        messageEl.classList.remove("show");
    }, 2000);
}
