// Data Management
let students = [];
let count = 0;
let global_id = null;
let currentPage = 1;
let itemsPerPage = 10;
let filteredStudents = [];
let currentView = 'table';
let sortBy = 'id';
let deptCounters = {}; // Track registration counters per department

// Department codes for registration numbers
const DEPT_CODES = {
    'Computer Science': 'CS',
    'Engineering': 'EN',
    'Business': 'BZ',
    'Science': 'SC',
    'Arts': 'AR',
    'Medicine': 'MD'
};

// ========== AGE CALCULATION ==========
function calculateAge() {
    const dob = document.getElementById('dob').value;
    if (!dob) {
        document.getElementById('age').value = '';
        return;
    }

    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    document.getElementById('age').value = age >= 0 ? age : '';
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadStudentsFromStorage();
    loadDeptCounters();
    showTable();
    updateStats();
    const dobInput = document.getElementById('dob');
    if (dobInput) {
        dobInput.addEventListener('change', calculateAge);
    }
});

// ========== LOCAL STORAGE ==========
function saveDeptCounters() {
    localStorage.setItem('deptCounters', JSON.stringify(deptCounters));
}

function loadDeptCounters() {
    const stored = localStorage.getItem('deptCounters');
    if (stored) {
        deptCounters = JSON.parse(stored);
    } else {
        // Initialize counters from existing students
        deptCounters = {};
        Object.values(DEPT_CODES).forEach(code => {
            deptCounters[code] = 0;
        });
        // Count existing students per department
        students.forEach(student => {
            const deptCode = DEPT_CODES[student.department] || 'UN';
            deptCounters[deptCode] = (deptCounters[deptCode] || 0) + 1;
        });
        saveDeptCounters();
    }
}

function saveStudentsToStorage() {
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('count', count);
}

function loadStudentsFromStorage() {
    const stored = localStorage.getItem('students');
    const storedCount = localStorage.getItem('count');
    if (stored) {
        students = JSON.parse(stored);
        count = parseInt(storedCount) || students.length;
        updateStats();
    }
}

// ========== FORM MANAGEMENT ==========
function generateRegistrationNumber(department) {
    const deptCode = DEPT_CODES[department] || 'UN';

    // Increment the counter for this department
    if (!deptCounters[deptCode]) {
        deptCounters[deptCode] = 0;
    }
    deptCounters[deptCode]++;

    // Generate registration number in format: DEPTCODE-001, DEPTCODE-002, etc.
    const sequenceNum = String(deptCounters[deptCode]).padStart(3, '0');
    const regNumber = `${deptCode}-${sequenceNum}`;

    return regNumber;
}

function getNextRegistrationNumber(department) {
    const deptCode = DEPT_CODES[department] || 'UN';
    const nextNum = (deptCounters[deptCode] || 0) + 1;
    const sequenceNum = String(nextNum).padStart(3, '0');
    return `${deptCode}-${sequenceNum}`;
}

function addStudent() {
    const nameValue = document.getElementById('name').value.trim();
    const emailValue = document.getElementById('email').value.trim();
    const phoneValue = document.getElementById('phone').value.trim();
    const dobValue = document.getElementById('dob').value;
    const ageValue = document.getElementById('age').value;
    const gradeValue = document.getElementById('grade').value;
    const degreeValue = document.getElementById('degree').value;
    const departmentValue = document.getElementById('department').value;

    // Validation
    if (!nameValue || !emailValue || !phoneValue || !dobValue || !gradeValue || !degreeValue || !departmentValue) {
        showAlert('All fields are required!', 'error');
        return;
    }

    if (!isValidEmail(emailValue)) {
        showAlert('Please enter a valid email address!', 'error');
        return;
    }

    if (!isValidPhone(phoneValue)) {
        showAlert('Please enter a valid phone number!', 'error');
        return;
    }

    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
        showAlert('GPA must be between 0 and 100%!', 'error');
        return;
    }

    const submitBtn = document.querySelector("#submit");

    if (submitBtn.innerText.includes("Edit")) {
        // Edit mode (preserve existing registration number)
        const index = students.findIndex(s => s.ID == global_id);
        if (index !== -1) {
            students[index] = {
                ID: students[index].ID,
                name: nameValue,
                email: emailValue,
                phone: phoneValue,
                regNumber: students[index].regNumber, // Keep original reg number
                dob: dobValue,
                age: ageValue,
                grade: gradeValue,
                degree: degreeValue,
                department: departmentValue
            };
            showAlert('Student updated successfully!', 'success');
            global_id = null;
        }
    } else {
        // Add mode - auto-generate registration number
        const autoRegNumber = generateRegistrationNumber(departmentValue);
        count++;
        students.push({
            ID: count,
            name: nameValue,
            email: emailValue,
            phone: phoneValue,
            regNumber: autoRegNumber,
            dob: dobValue,
            age: ageValue,
            grade: gradeValue,
            degree: degreeValue,
            department: departmentValue
        });
        showAlert(`Student added successfully! Registration #: ${autoRegNumber}`, 'success');
    }

    saveStudentsToStorage();
    saveDeptCounters(); // Save updated counters
    resetForm();
    showTable();
    updateStats();
}

function resetForm() {
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('regNumber').value = ''; // Will be auto-generated on next add
    document.getElementById('dob').value = '';
    document.getElementById('age').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('degree').value = '';
    document.getElementById('department').value = '';
    document.querySelector("#submit").innerHTML = '<i class="fas fa-save"></i> Save Student';
    global_id = null;
}

// Auto-update registration number preview when department changes
document.addEventListener('DOMContentLoaded', () => {
    const deptSelect = document.getElementById('department');
    if (deptSelect) {
        deptSelect.addEventListener('change', updateRegNumberPreview);
    }
});

function updateRegNumberPreview() {
    const department = document.getElementById('department').value;
    const submitBtn = document.querySelector("#submit");

    // Only update preview if adding new student (not editing)
    if (department && !submitBtn.innerText.includes("Edit")) {
        const previewRegNumber = getNextRegistrationNumber(department);
        document.getElementById('regNumber').value = previewRegNumber;
    } else if (submitBtn.innerText.includes("Edit")) {
        // Show current registration number when editing
        // Keep the existing value
    }
}

// ========== TABLE MANAGEMENT ==========
function showTable() {
    if (currentView === 'table') {
        showTableView();
    } else {
        showCardView();
    }
}

function showTableView() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    filteredStudents = students.filter(student => applyCurrentFilters(student));

    if (filteredStudents.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-state">
                <td colspan="10">
                    <i class="fas fa-inbox"></i>
                    <p>No students found. Add one to get started!</p>
                </td>
            </tr>
        `;
        document.getElementById('paginationContainer').innerHTML = '';
        return;
    }

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedStudents = filteredStudents.slice(start, end);

    paginatedStudents.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" value="${student.ID}"></td>
            <td>${student.ID}</td>
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.phone}</td>
            <td>${student.regNumber}</td>
            <td><strong>${student.grade}%</strong></td>
            <td>${student.degree}</td>
            <td>${student.department}</td>
            <td>
                <button class="btn btn-edit" onclick="edit(${student.ID})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-delete" onclick="deleteStudent(${student.ID})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Pagination buttons
    renderPagination(totalPages);
}

function showCardView() {
    const cardView = document.getElementById('studentCards');
    cardView.innerHTML = '';

    filteredStudents = students.filter(student => applyCurrentFilters(student));

    if (filteredStudents.length === 0) {
        cardView.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-inbox" style="font-size: 48px; color: #ddd; margin-bottom: 15px; display: block;"></i><p style="color: #999;">No students found.</p></div>';
        return;
    }

    filteredStudents.forEach((student) => {
        const card = document.createElement('div');
        card.className = 'student-card';
        card.innerHTML = `
            <div class="student-card-header">
                <div>
                    <h4>${student.name}</h4>
                    <small style="color: #999;">${student.regNumber}</small>
                </div>
                <span class="gpa-badge">${student.grade}% GPA</span>
            </div>
            <div class="student-card-body">
                <p><strong>Email:</strong> ${student.email}</p>
                <p><strong>Phone:</strong> ${student.phone}</p>
                <p><strong>Age:</strong> ${student.age}</p>
                <p><strong>Degree:</strong> ${student.degree}</p>
                <p><strong>Department:</strong> ${student.department}</p>
            </div>
            <div class="student-card-actions">
                <button class="btn btn-edit" onclick="edit(${student.ID})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-delete" onclick="deleteStudent(${student.ID})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
        cardView.appendChild(card);
    });
}

function renderPagination(totalPages) {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';

    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i> Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            showTable();
        }
    };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.add(i === currentPage ? 'active' : '');
        btn.onclick = () => {
            currentPage = i;
            showTable();
        };
        container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            showTable();
        }
    };
    container.appendChild(nextBtn);
}

// ========== SEARCH & FILTER ==========
function search() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.regNumber.toLowerCase().includes(searchTerm) ||
        student.phone.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    showTable();
}

function applyCurrentFilters(student) {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const deptFilter = document.getElementById('departmentFilter').value;

    const matchesSearch = !searchTerm ||
        student.name.toLowerCase().includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm) ||
        student.regNumber.toLowerCase().includes(searchTerm) ||
        student.phone.toLowerCase().includes(searchTerm);

    const matchesDept = !deptFilter || student.department === deptFilter;

    return matchesSearch && matchesDept;
}

function applyFilters() {
    currentPage = 1;
    showTable();
}

function applySort() {
    const sortValue = document.getElementById('sortBy').value;

    switch (sortValue) {
        case 'name':
            students.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'gpa':
            students.sort((a, b) => b.grade - a.grade);
            break;
        case 'age':
            students.sort((a, b) => a.age - b.age);
            break;
        default:
            students.sort((a, b) => a.ID - b.ID);
    }

    saveStudentsToStorage();
    currentPage = 1;
    showTable();
}

// ========== EDIT & DELETE ==========
function edit(id) {
    let student = students.find(s => s.ID === id);

    if (student) {
        document.getElementById("name").value = student.name;
        document.getElementById("email").value = student.email;
        document.getElementById("phone").value = student.phone;
        document.getElementById("regNumber").value = student.regNumber; // Display existing reg number
        document.getElementById("dob").value = student.dob;
        document.getElementById("age").value = student.age;
        document.getElementById("grade").value = student.grade;
        document.getElementById("degree").value = student.degree;
        document.getElementById("department").value = student.department;

        document.getElementById("submit").innerHTML = '<i class="fas fa-edit"></i> Edit Student';
        global_id = id;

        document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
        document.getElementById("name").focus();
    }
}

function deleteStudent(id) {
    showConfirmModal(
        'Confirm Delete',
        'Are you sure you want to delete this student?',
        () => {
            const index = students.findIndex(s => s.ID === id);
            if (index > -1) {
                students.splice(index, 1);
                saveStudentsToStorage();
                showAlert('Student deleted successfully!', 'success');
                showTable();
                updateStats();
            }
            closeModal();
        }
    );
}

// ========== STATISTICS ==========
function updateStats() {
    const total = students.length;
    const avgGPA = total > 0 ? (students.reduce((sum, s) => sum + parseFloat(s.grade), 0) / total).toFixed(2) + '%' : '0.00%';
    const avgAge = total > 0 ? Math.round(students.reduce((sum, s) => sum + parseInt(s.age), 0) / total) : '0';
    const topGPA = total > 0 ? Math.max(...students.map(s => parseFloat(s.grade))).toFixed(2) + '%' : '0.00%';

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statAvgGPA').textContent = avgGPA;
    document.getElementById('statAvgAge').textContent = avgAge;
    document.getElementById('statTopGPA').textContent = topGPA;
    document.getElementById('totalBadge').textContent = total;
}

function showStats() {
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.scrollIntoView({ behavior: 'smooth' });
}

// ========== EXPORT & IMPORT ==========
function exportToCSV() {
    if (students.length === 0) {
        showAlert('No data to export!', 'error');
        return;
    }

    let csv = 'ID,Name,Email,Phone,Registration Number,DOB,Age,GPA,Degree,Department\n';
    students.forEach(student => {
        csv += `${student.ID},"${student.name}","${student.email}","${student.phone}","${student.regNumber}","${student.dob}",${student.age},${student.grade},"${student.degree}","${student.department}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showAlert('Data exported successfully!', 'success');
}

function importStudents() {
    document.getElementById('fileInput').click();
}

function handleFileImport(event) {
    const file = event.target.files ? event.target.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            const headers = lines[0].split(',');
            let imported = 0;

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;

                const values = parseCSVLine(lines[i]);
                if (values.length >= 10) {
                    count++;
                    students.push({
                        ID: count,
                        name: values[1],
                        email: values[2],
                        phone: values[3],
                        regNumber: values[4],
                        dob: values[5],
                        age: values[6],
                        grade: values[7],
                        degree: values[8],
                        department: values[9]
                    });
                    imported++;
                }
            }

            if (imported > 0) {
                saveStudentsToStorage();
                showTable();
                updateStats();
                showAlert(`Imported ${imported} students successfully!`, 'success');
            } else {
                showAlert('No valid records found!', 'error');
            }
        } catch (error) {
            showAlert('Error importing file!', 'error');
        }
    };

    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
            result.push(current.trim().replace(/^"|"$/g, ''));
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
}

function clearAll() {
    showConfirmModal(
        'Clear All Data',
        'Are you sure you want to delete all students? This cannot be undone!',
        () => {
            students = [];
            count = 0;
            saveStudentsToStorage();
            showTable();
            updateStats();
            showAlert('All students cleared!', 'success');
            closeModal();
        }
    );
}

// ========== VIEW SWITCHING ==========
function switchView(view) {
    currentView = view;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.view-btn').classList.add('active');

    if (view === 'table') {
        document.getElementById('tableView').classList.remove('hidden');
        document.getElementById('cardView').classList.add('hidden');
    } else {
        document.getElementById('tableView').classList.add('hidden');
        document.getElementById('cardView').classList.remove('hidden');
    }

    showTable();
}

// ========== UI UTILITIES ==========
function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
}

function toggleFormCollapse() {
    const formContent = document.getElementById('formContent');
    const collapseBtn = document.getElementById('collapseBtn');
    formContent.classList.toggle('collapsed');
    collapseBtn.innerHTML = formContent.classList.contains('collapsed')
        ? '<i class="fas fa-chevron-down"></i>'
        : '<i class="fas fa-chevron-up"></i>';
}

function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('tbody input[type="checkbox"]');
    const isChecked = document.getElementById('selectAll').checked;
    checkboxes.forEach(checkbox => checkbox.checked = isChecked);
}

// ========== MODAL ==========
function showConfirmModal(title, message, onConfirm) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    document.getElementById('confirmBtn').onclick = onConfirm;
    document.getElementById('confirmModal').classList.add('active');
}

function closeModal() {
    document.getElementById('confirmModal').classList.remove('active');
}

function executeConfirm() {
    document.getElementById('confirmBtn').click();
}

// ========== VALIDATION ==========
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
    return /^[\d\s\-\+\(\)]{10,}$/.test(phone);
}

// ========== ALERTS ==========
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    alert.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        max-width: 350px;
    `;

    document.body.appendChild(alert);

    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 3000);
}

// Load theme preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}