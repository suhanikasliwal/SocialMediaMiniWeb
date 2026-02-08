let page = 1;
let pageSize = 10;
let totalPages = 1;
let currentSearch = "";

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
});

async function loadUsers() {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

    const url =
        `/admin/users?search=${encodeURIComponent(currentSearch)}&page=${page}&pageSize=${pageSize}`;

    const res = await fetch(url);
    const data = await res.json();

    const users = data.items;
    totalPages = data.totalPages;

    renderTable(users);
    updatePagination();
}

function renderTable(users) {
    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";

    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6">No users found</td></tr>`;
        return;
    }

    users.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.name ?? "-"}</td>
            <td>${u.email ?? "-"}</td>
            <td>
                <select onchange="updateRole('${u.id}', this.value)">
                    <option value="User" ${u.role === "User" ? "selected" : ""}>User</option>
                    <option value="Admin" ${u.role === "Admin" ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td>${u.isBlocked ? "Blocked" : "Active"}</td>
            <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}</td>
            <td>
                <button onclick="blockUser('${u.id}')">Block</button>
                <button onclick="deleteUser('${u.id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

/* ================= SEARCH ================= */

function searchUsers() {
    currentSearch = document.getElementById("searchInput").value;
    page = 1;
    loadUsers();
}

function resetUsers() {
    currentSearch = "";
    document.getElementById("searchInput").value = "";
    page = 1;
    loadUsers();
}

/* ================= PAGINATION ================= */

function updatePagination() {
    document.getElementById("pageInfo").innerText =
        `Page ${page} of ${totalPages}`;
}

function nextPage() {
    if (page < totalPages) {
        page++;
        loadUsers();
    }
}

function prevPage() {
    if (page > 1) {
        page--;
        loadUsers();
    }
}

/* ================= ACTIONS ================= */

async function blockUser(id) {
    await fetch(`/admin/users/${id}/block`, { method: "PUT" });
    loadUsers();
}

async function deleteUser(id) {
    if (!confirm("Are you sure?")) return;

    await fetch(`/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
}

async function updateRole(id, role) {
    await fetch(`/admin/users/${id}/role?role=${role}`, {
        method: "PUT"
    });
}
