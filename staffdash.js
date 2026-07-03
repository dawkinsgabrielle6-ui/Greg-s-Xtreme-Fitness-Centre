// ==========================================================================
// 1. SUPABASE CONFIGURATION (Unified)
// ==========================================================================
const SUPABASE_URL = "https://weufptqkdejhxhganvux.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWZwdHFrZGVqaHhoZ2FudnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzEyNzIsImV4cCI6MjA4NDQwNzI3Mn0.q7i9h5BEEsVUPzElBnEHV-78_esEkfUMQrGOJkEuGYk";

// Initialize Supabase Client
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Active navigation section state
let currentSection = 'home';

// ==========================================================================
// 2. DOM CONTENT INITIALIZATION & WORKFLOW
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    // Sync current live date
    updateLiveDate();
    
    // Load local storage items (To-Do Lists and Notice Boards)
    loadLocalTodos();
    loadLocalNotices();

    // Initial Database Sync Calls
    syncDashboardMetrics();
    fetchMembers();
    fetchShortTermMembers();
    fetchInquiries();
    fetchReviews();

    // Setup Event Listeners for Theme switching
    const themeToggleBtn = document.getElementById("theme-toggle");
    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem("theme") || "dark";
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeToggleIcon(savedTheme);
    }
});

// Update the real-time calendar and clock indicator
function updateLiveDate() {
    const liveDateEl = document.getElementById("live-date");
    if (liveDateEl) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        liveDateEl.textContent = new Date().toLocaleDateString('en-US', options);
    }
}

// ==========================================================================
// 3. SIDEBAR NAVIGATION & THEME ENGINE
// ==========================================================================
function showSection(sectionId) {
    currentSection = sectionId;

    // 1. Hide all main workspace sections
    const sections = document.querySelectorAll(".admin-section");
    sections.forEach(sec => sec.classList.add("hidden"));

    // 2. Show selected target section
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.remove("hidden");
    }

    // 3. Update active states on sidebar navigation items
    const navLinks = document.querySelectorAll(".nav-links li");
    navLinks.forEach(link => link.classList.remove("active"));
    
    const activeNav = document.getElementById(`nav-${sectionId}`);
    if (activeNav) {
        activeNav.classList.add("active");
    }

    // 4. Set Section Title in Header
    const titleMap = {
        'home': 'Home Overview',
        'members': 'Standard Members Registry',
        'shortterm': 'Short-Term Guest Passes',
        'testimonials': 'Customer Reviews Management',
        'inquiries': 'Inquiries Portal',
        'management': 'System Content Management',
        'settings': 'System Credentials & Configurations'
    };
    
    const titleEl = document.getElementById("section-title");
    if (titleEl && titleMap[sectionId]) {
        titleEl.textContent = titleMap[sectionId];
    }

    // 5. Toggle visibility of search utility bar
    const searchWrapper = document.getElementById("search-wrapper");
    if (searchWrapper) {
        if (['members', 'shortterm', 'testimonials', 'inquiries'].includes(sectionId)) {
            searchWrapper.classList.remove("hidden");
        } else {
            searchWrapper.classList.add("hidden");
        }
    }
}

// Mobile sidebar responsiveness toggle
function toggleMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    if (sidebar) {
        sidebar.classList.toggle("mobile-open");
    }
}

// Toggle appearance dark / light layouts
function toggleTheme() {
    const htmlEl = document.documentElement;
    let currentTheme = htmlEl.getAttribute("data-theme") || "dark";
    let nextTheme = currentTheme === "dark" ? "light" : "dark";
    
    htmlEl.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
    updateThemeToggleIcon(nextTheme);
}

function updateThemeToggleIcon(theme) {
    const toggleBtn = document.getElementById("theme-toggle");
    if (toggleBtn) {
        toggleBtn.innerHTML = theme === "dark" 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }
}

// ==========================================================================
// 4. SUPABASE DATA ACCESS & SYNC UTILITIES
// ==========================================================================
async function syncDashboardMetrics() {
    try {
        // Standard Members Count - Corrected target to 'GregXFDatabase'
        const { count: membersCount, error: mErr } = await _supabase
            .from('GregXFDatabase')
            .select('*', { count: 'exact', head: true });
        
        const memberStatEl = document.getElementById("member-stat");
        if (memberStatEl) {
            memberStatEl.textContent = mErr ? "Error" : `${membersCount || 0} Registered`;
        }

        // Short-Term Guest Count - Corrected target to 'ShortTermMemberships'
        const { count: stCount, error: stErr } = await _supabase
            .from('ShortTermMemberships')
            .select('*', { count: 'exact', head: true });

        const shorttermStatEl = document.getElementById("shortterm-stat");
        if (shorttermStatEl) {
            shorttermStatEl.textContent = stErr ? "Error" : `${stCount || 0} Active Passes`;
        }

        // Contact Inquiries Count
        const { data: inqData, error: inqErr } = await _supabase
            .from('inquiries')
            .select('status');

        if (!inqErr && inqData) {
            const pendingCount = inqData.filter(i => i.status?.toLowerCase() === 'pending').length;
            const inquiryStatEl = document.getElementById("inquiry-stat");
            const badgeEl = document.getElementById("msg-count-badge");
            
            if (inquiryStatEl) {
                inquiryStatEl.textContent = `${pendingCount} Unresolved`;
            }
            if (badgeEl) {
                if (pendingCount > 0) {
                    badgeEl.textContent = pendingCount;
                    badgeEl.classList.remove("hidden");
                } else {
                    badgeEl.classList.add("hidden");
                }
            }
        }

        // Reviews approval alerts
        const { data: revData, error: revErr } = await _supabase
            .from('reviews')
            .select('is_approved');

        if (!revErr && revData) {
            const unapproved = revData.filter(r => !r.is_approved).length;
            const reviewStatEl = document.getElementById("review-stat");
            const dotBadge = document.getElementById("review-alert-badge");
            
            if (reviewStatEl) {
                reviewStatEl.textContent = `${unapproved} Awaiting Audit`;
            }
            if (dotBadge) {
                if (unapproved > 0) {
                    dotBadge.classList.remove("hidden");
                } else {
                    dotBadge.classList.add("hidden");
                }
            }
        }

    } catch (e) {
        console.error("Dashboard metric sync failure: ", e);
    }
}

// Helper to partition full identities into first and last names for DB compatibility
function parseFullName(fullNameStr) {
    const parts = fullNameStr.trim().split(/\s+/);
    const first_name = parts[0] || "Guest";
    const last_name = parts.slice(1).join(" ") || "";
    return { first_name, last_name };
}

// ==========================================================================
// 5. STANDARD SUBSCRIPTION MEMBERS REGISTRY (WITH RECEIPT_REF)
// ==========================================================================
async function fetchMembers() {
    const tableBody = document.getElementById("member-data");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Fetching database rows...</td></tr>`;

    const { data: members, error } = await _supabase
        .from('GregXFDatabase')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--accent-red);">Database Error: ${error.message}</td></tr>`;
        return;
    }

    // CLEAR THE TABLE
    tableBody.innerHTML = "";
    
    // CORRECTED: Single loop to render rows
    members.forEach(member => {
        const tr = document.createElement("tr");
        tr.innerHTML = renderRow(member);
        tableBody.appendChild(tr);
    });
}

function renderRow(member) {
    // Construct emergency contact info string
    const ecName = (member.EC_first_name || member.EC_last_name) 
        ? `${member.EC_first_name || ""} ${member.EC_last_name || ""}` 
        : "N/A";
    const ecDetails = (member.EC_first_name) 
        ? `<br><small>${member.emergency_phone || "No Phone"}<br>(${member.EC_relationship || "Relationship"})</small>` 
        : "";

    const dobDisplay = member.date_of_birth ? `<br><small>DOB: ${member.date_of_birth}</small>` : "";
    const phoneDisplay = member.phone ? `<br><small>Tel: ${member.phone}</small>` : "";

    // Styles for the pill-shaped registration badge
    const badgeStyle = `
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px;
        border-radius: 16px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        cursor: pointer;
        border: 1px solid ${member.is_registered ? '#55eae0' : '#7ce5e79f'};
        background-color: ${member.is_registered ? 'rgba(88, 234, 222, 0.15)' : 'transparent'};
        color: ${member.is_registered ? '#0d9488' : '#9ca3af'};
    `;

    return `
        <tr>
            <td>
                <label class="reg-toggle-wrapper" style="${badgeStyle}">
                    <input type="checkbox" class="reg-checkbox" ${member.is_registered ? "checked" : ""} 
                           onchange="updateMemberField(${member.id}, 'is_registered', this.checked)">
                    <span class="reg-text">${member.is_registered ? "REGISTERED" : "NOT REGISTERED"}</span>
                </label>
            </td>
            <td>
                <strong>${member.first_name || ""} ${member.last_name || ""}</strong>
                ${dobDisplay}
                ${phoneDisplay}
                <br><small>${member.email || ""}</small>
            </td>
            <td>${member.membership_plan || 'N/A'}</td>
            <td class="receipt-ref-cell" style="color: var(--accent-orange, #ff9800); font-weight: bold;">${member.receipt_ref || 'N/A'}</td>
            <td>${member.street_address || "N/A"}<br><small>${member.parish || ""}</small></td>
            <td><strong>${ecName}</strong>${ecDetails}</td>
            <td>
                <input type="text" class="staff-note-inline" 
                       value="${member.staff_notes || ''}" 
                       placeholder="Add note..." 
                       onblur="updateMemberField(${member.id}, 'staff_notes', this.value)">
            </td>
            <td class="action-cell">
                <button class="table-action-btn" onclick="deleteMember(${member.id})">Delete</button>
            </td>
        </tr>
    `;
}


async function updateMemberField(id, field, value) {
    const { error } = await _supabase
        .from('GregXFDatabase')
        .update({ [field]: value })
        .eq('id', id);

    if (error) {
        alert("Failed to update: " + error.message);
    }
}

async function saveNewMember() {
    const payload = {
        first_name: document.getElementById("member-first-name").value,
        last_name: document.getElementById("member-last-name").value,
        date_of_birth: document.getElementById("member-dob").value,
        street_address: document.getElementById("member-address").value,
        parish: document.getElementById("member-parish").value,
        membership_plan: document.getElementById("member-plan").value,
        payment_method: document.getElementById("member-payment").value,
        receipt_ref: document.getElementById("member-receipt").value,
        EC_first_name: document.getElementById("member-ec-first").value,
        EC_last_name: document.getElementById("member-ec-last").value,
        EC_relationship: document.getElementById("member-ec-rel").value,
        emergency_phone: document.getElementById("member-ec-phone").value,
        is_registered: true
    };

    if (!payload.first_name || !payload.last_name || !payload.receipt_ref || !payload.membership_plan) {
        alert("Please fill in required fields.");
        return;
    }

    const { error } = await _supabase.from('GregXFDatabase').insert([payload]);

    if (error) {
        alert("Insert Failed: " + error.message);
    } else {
        hideAddMemberForm();
        fetchMembers();
    }
}

async function deleteMember(id) {
    if (!confirm("Are you sure?")) return;
    const { error } = await _supabase.from('GregXFDatabase').delete().eq('id', id);
    if (!error) fetchMembers();
}


// ==========================================================================
// 6. SHORT-TERM MEMBERSHIPS & VISITORS PORTAL
// ==========================================================================
async function fetchShortTermMembers() {
    const tableBody = document.getElementById("shortterm-data");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">Syncing pass database...</td></tr>`;

    // Ensure we are fetching from the correct table
    const { data: passes, error } = await _supabase
        .from('ShortTermMemberships')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--accent-red);">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!passes || passes.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No guest or short-term visitor records registered.</td></tr>`;
        return;
    }

    tableBody.innerHTML = "";
    passes.forEach(pass => {
        const tr = document.createElement("tr");
        const fullName = `${pass.first_name || ""} ${pass.last_name || ""}`.trim();
        const isPaid = pass.status === 'Paid';

        // Helper to format payment method
        const formatPayment = (val) => {
            if (!val) return 'N/A';
            if (val.toLowerCase().includes('cash')) return 'Cash (Front Desk)';
            if (val.toLowerCase().includes('card')) return 'Card (Front Desk)';
            return val;
        };

        tr.innerHTML = `
            <td>
                <label class="reg-toggle-wrapper" style="
                    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; 
                    border-radius: 16px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
                    border: 1px solid ${isPaid ? '#0d9488' : '#4b5563'};
                    background-color: ${isPaid ? 'rgba(13, 148, 136, 0.15)' : 'transparent'};
                    color: ${isPaid ? '#0d9488' : '#9ca3af'};
                ">
                    <input type="checkbox" style="display:none;" ${isPaid ? "checked" : ""} 
                           onchange="
                               const newStatus = this.checked ? 'Paid' : 'Not Paid';
                               const parent = this.parentElement;
                               parent.style.borderColor = this.checked ? '#0d9488' : '#4b5563';
                               parent.style.backgroundColor = this.checked ? 'rgba(13, 148, 136, 0.15)' : 'transparent';
                               parent.style.color = this.checked ? '#0d9488' : '#9ca3af';
                               parent.lastElementChild.textContent = this.checked ? 'PAID' : 'NOT PAID';
                               updateShortTermField(${pass.id}, 'status', newStatus);
                           ">
                    <i class="fas ${isPaid ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${isPaid ? 'PAID' : 'NOT PAID'}</span>
                </label>
            </td>
            <td><strong>${fullName}</strong></td>
            <td><span class="status-indicator" style="background-color: rgba(245, 35, 35, 0.1); color: var(--accent-red);">${pass.access_type || 'Pass'}</span></td>
            <td class="receipt-ref-cell">${pass.receipt_ref || 'N/A'}</td>
            <td>
                ${pass.phone_number || 'No contact'}<br>
                <small style="color: var(--text-muted);">${pass.email || ""}</small>
            </td>
            <td>${formatPayment(pass.payment_method)}</td>
            <td>
                <textarea class="staff-note-inline" 
                          style="min-height: 40px; resize: vertical; width: 100%;"
                          placeholder="Add note..." 
                          onblur="updateShortTermField(${pass.id}, 'staff_notes', this.value)">${pass.staff_notes || ''}</textarea>
            </td>
            <td class="action-cell">
                <button class="table-action-btn" onclick="deleteShortTermPass(${pass.id})"><i class="fas fa-trash-alt"></i> Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function showAddShortTermForm() {
    document.getElementById("add-shortterm-form-container").classList.remove("hidden");
}

function hideAddShortTermForm() {
    document.getElementById("add-shortterm-form-container").classList.add("hidden");
    clearShortTermForm();
}

function clearShortTermForm() {
    document.getElementById("short-name").value = "";
    document.getElementById("short-receipt").value = "";
    document.getElementById("short-expiry").value = "";
    document.getElementById("short-contact").value = "";
    document.getElementById("short-notes").value = "";
}

async function saveShortTermMember() {
    const guestName = document.getElementById("short-name").value;
    const accessType = document.getElementById("short-type").value;
    const receiptRef = document.getElementById("short-receipt").value;
    const contact = document.getElementById("short-contact").value;
    const notes = document.getElementById("short-notes").value;

    if (!guestName || !receiptRef || !contact) {
        alert("Please provide the Guest Identity, Contact Details, and Receipt Ref!");
        return;
    }

    const { first_name, last_name } = parseFullName(guestName);

    const guestPayload = {
        first_name,
        last_name,
        access_type: accessType,
        receipt_ref: receiptRef,
        phone_number: contact,
        payment_method: notes,
        status: 'Active'
    };

    // Corrected table reference to 'ShortTermMemberships'
    const { error } = await _supabase
        .from('ShortTermMemberships')
        .insert([guestPayload]);

    if (error) {
        alert("Pass registration failed: " + error.message);
    } else {
        hideAddShortTermForm();
        fetchShortTermMembers();
        syncDashboardMetrics();
    }
}

async function deleteShortTermPass(id) {
    if (!confirm("Are you sure you want to expire this Guest Pass?")) return;

    // Corrected table reference to 'ShortTermMemberships'
    const { error } = await _supabase
        .from('ShortTermMemberships')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Operation Failed: " + error.message);
    } else {
        fetchShortTermMembers();
        syncDashboardMetrics();
    }
}

async function updateShortTermField(id, field, value) {
    const { error } = await _supabase
        .from('ShortTermMemberships')
        .update({ [field]: value })
        .eq('id', id);
        
    if (error) {
        console.error("Update failed:", error.message);
        alert("Failed to update: " + error.message);
    }
}

// ==========================================================================
// 7. PUBLIC CUSTOMER REVIEWS & TESTIMONIALS
// ==========================================================================
async function fetchReviews() {
    const tableBody = document.getElementById("testimonial-data");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">Syncing reviews database...</td></tr>`;

    const { data: reviews, error } = await _supabase
        .from('reviews')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--accent-red);">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!reviews || reviews.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No testimonials found in database.</td></tr>`;
        return;
    }

    tableBody.innerHTML = "";
    reviews.forEach(review => {
        const tr = document.createElement("tr");
        const isApproved = review.is_approved;
        
        let starRatingHtml = "";
        const maxStars = review.rating || 5;
        for (let i = 0; i < 5; i++) {
            starRatingHtml += i < maxStars 
                ? `<i class="fas fa-star" style="color: var(--accent-gold); margin-right: 2px;"></i>` 
                : `<i class="far fa-star" style="color: var(--text-muted); margin-right: 2px;"></i>`;
        }

        tr.innerHTML = `
            <td>
                <label class="reg-toggle-wrapper" style="
                    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; 
                    border-radius: 16px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
                    border: 1px solid ${isApproved ? '#0d9488' : '#4b5563'};
                    background-color: ${isApproved ? 'rgba(13, 148, 136, 0.15)' : 'transparent'};
                    color: ${isApproved ? '#0d9488' : '#9ca3af'};
                ">
                    <input type="checkbox" style="display:none;" ${isApproved ? "checked" : ""} 
                           onchange="updateReviewStatus(${review.id}, this.checked)">
                    <i class="fas ${isApproved ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${isApproved ? 'PUBLIC' : 'IN AUDIT'}</span>
                </label>
            </td>
            <td><strong>${review.name || "Anonymous User"}</strong></td>
            <td>${starRatingHtml}</td>
            <td><em style="color: var(--text-secondary);">"${review.text || ""}"</em></td>
            <td class="action-cell" style="display: flex; gap: 8px; justify-content: flex-end;">
                <button class="table-action-btn" onclick="deleteReview(${review.id})"><i class="fas fa-trash-alt"></i> Remove</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function updateReviewStatus(id, isChecked) {
    const { error } = await _supabase
        .from('reviews')
        .update({ is_approved: isChecked })
        .eq('id', id);

    if (error) {
        alert("Audit update failure: " + error.message);
    } else {
        fetchReviews();
        if(typeof syncDashboardMetrics === 'function') syncDashboardMetrics();
    }
}

async function deleteReview(id) {
    if (!confirm("Are you sure you want to permanently remove this review?")) return;

    const { error } = await _supabase
        .from('reviews')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Audit deletion failure: " + error.message);
    } else {
        fetchReviews();
        if(typeof syncDashboardMetrics === 'function') syncDashboardMetrics();
    }
}

// ==========================================================================
// 8. PUBLIC CONTACT INQUIRIES PORTAL
// ==========================================================================
async function fetchInquiries() {
    const tableBody = document.getElementById("inquiry-data-body");
    if (!tableBody) return;

    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">Syncing contacts portal...</td></tr>`;

    const { data: inquiries, error } = await _supabase
        .from('inquiries')
        .select('*')
        .order('id', { ascending: false });

    if (error) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--accent-red);">Database Error: ${error.message}</td></tr>`;
        return;
    }

    if (!inquiries || inquiries.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center;">No submissions received yet.</td></tr>`;
        return;
    }

    tableBody.innerHTML = "";
    inquiries.forEach(inq => {
        const tr = document.createElement("tr");
        const isResolved = inq.status?.toLowerCase() === 'resolved';

        tr.innerHTML = `
            <td>
                <label class="reg-toggle-wrapper" style="
                    display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; 
                    border-radius: 16px; font-size: 0.75rem; font-weight: 700; cursor: pointer;
                    border: 1px solid ${isResolved ? '#0d9488' : '#4b5563'};
                    background-color: ${isResolved ? 'rgba(13, 148, 136, 0.15)' : 'transparent'};
                    color: ${isResolved ? '#0d9488' : '#9ca3af'};
                ">
                    <input type="checkbox" style="display:none;" ${isResolved ? "checked" : ""} 
                           onchange="updateInquiryStatus(${inq.id}, this.checked)">
                    <i class="fas ${isResolved ? 'fa-check-circle' : 'fa-circle'}"></i>
                    <span>${isResolved ? 'RESOLVED' : 'PENDING'}</span>
                </label>
            </td>
            <td>
                <strong>${inq.name || "Anonymous"}</strong><br>
                <small style="color: var(--text-muted);">${inq.email || ""}</small>
            </td>
            <td>
                ${inq.phone || "No Phone"}
            </td>
            <td><strong>Sub: ${inq.subject || "No Subject"}</strong><br><span style="color: var(--text-secondary); font-size: 0.8rem;">"${inq.message || ""}"</span></td>
            <td>
                <textarea class="staff-note-inline" 
                          style="min-height: 40px; resize: vertical; width: 100%;"
                          placeholder="Add note..." 
                          onblur="updateInquiryNote(${inq.id}, this.value)">${inq.staff_notes || ''}</textarea>
            </td>
            <td class="action-cell">
                <button class="table-action-btn" onclick="deleteInquiry(${inq.id})"><i class="fas fa-trash-alt"></i> Delete</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

async function updateInquiryStatus(id, isChecked) {
    const newStatus = isChecked ? 'Resolved' : 'Pending';
    const { error } = await _supabase
        .from('inquiries')
        .update({ status: newStatus })
        .eq('id', id);

    if (error) {
        alert("Failed to update status: " + error.message);
    } else {
        fetchInquiries();
        if(typeof syncDashboardMetrics === 'function') syncDashboardMetrics();
    }
}

async function updateInquiryNote(id, note) {
    const { error } = await _supabase
        .from('inquiries')
        .update({ staff_notes: note })
        .eq('id', id);

    if (error) {
        alert("Failed to save note: " + error.message);
    }
}

async function deleteInquiry(id) {
    if (!confirm("Are you sure you want to permanently discard this user inquiry?")) return;

    const { error } = await _supabase
        .from('inquiries')
        .delete()
        .eq('id', id);

    if (error) {
        alert("Operation failure: " + error.message);
    } else {
        fetchInquiries();
        if(typeof syncDashboardMetrics === 'function') syncDashboardMetrics();
    }
}

// ==========================================================================
// 9. LOCAL TO-DO LIST EDITOR (STAFF SIDE)
// ==========================================================================
function loadLocalTodos() {
    const listDisplay = document.getElementById("todo-list-display");
    const editorList = document.getElementById("manage-todo-list");
    if (!listDisplay || !editorList) return;

    let todos = JSON.parse(localStorage.getItem("todos")) || [
        { text: "Verify visitor daily logs", completed: false },
        { text: "Update Step and Aerobics timetable schedules", completed: false },
        { text: "Audit new membership transaction receipts", completed: true }
    ];

    listDisplay.innerHTML = "";
    editorList.innerHTML = "";

    todos.forEach((todo, idx) => {
        // Display inside Dashboard home card
        const li = document.createElement("li");
        li.className = `task-item ${todo.completed ? 'completed' : ''}`;
        li.innerHTML = `
            <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodoComplete(${idx})">
            <span>${todo.text}</span>
        `;
        listDisplay.appendChild(li);

        // Display inside Management settings panel for modification
        const mLi = document.createElement("div");
        mLi.className = "managed-item";
        mLi.innerHTML = `
            <span>${todo.text}</span>
            <button class="table-action-btn" onclick="deleteLocalTodo(${idx})"><i class="fas fa-trash-alt"></i></button>
        `;
        editorList.appendChild(mLi);
    });

    localStorage.setItem("todos", JSON.stringify(todos));
}

function addNewTodo() {
    const input = document.getElementById("todo-input");
    if (!input || !input.value.trim()) return;

    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos.push({ text: input.value.trim(), completed: false });
    localStorage.setItem("todos", JSON.stringify(todos));
    
    input.value = "";
    loadLocalTodos();
}

function toggleTodoComplete(idx) {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    if (todos[idx]) {
        todos[idx].completed = !todos[idx].completed;
        localStorage.setItem("todos", JSON.stringify(todos));
        loadLocalTodos();
    }
}

function deleteLocalTodo(idx) {
    let todos = JSON.parse(localStorage.getItem("todos")) || [];
    todos.splice(idx, 1);
    localStorage.setItem("todos", JSON.stringify(todos));
    loadLocalTodos();
}

// ==========================================================================
// 10. LOCAL NOTICES & ANNOUNCEMENT MANAGER
// ==========================================================================
function loadLocalNotices() {
    const noticeDisplay = document.getElementById("notice-list");
    const noticeEditor = document.getElementById("manage-notices-list");
    if (!noticeDisplay || !noticeEditor) return;

    let notices = JSON.parse(localStorage.getItem("notices")) || [
        { text: "Step & Aerobics: Special workout routines starting Monday with personal trainer references." },
        { text: "System Audit scheduled for database schemas tomorrow morning at 08:00." }
    ];

    noticeDisplay.innerHTML = "";
    noticeEditor.innerHTML = "";

    notices.forEach((notice, idx) => {
        // Render to home viewport notice card
        const item = document.createElement("div");
        item.className = "notice-item";
        item.innerHTML = `
            <div class="notice-item-content">
                <h4>Announcement #${idx + 1}</h4>
                <p>${notice.text}</p>
            </div>
        `;
        noticeDisplay.appendChild(item);

        // Render to control manager list
        const mItem = document.createElement("div");
        mItem.className = "managed-item";
        mItem.innerHTML = `
            <span style="font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">${notice.text}</span>
            <button class="table-action-btn" onclick="deleteLocalNotice(${idx})"><i class="fas fa-trash-alt"></i></button>
        `;
        noticeEditor.appendChild(mItem);
    });

    localStorage.setItem("notices", JSON.stringify(notices));
}

function addNewNotice() {
    const input = document.getElementById("notice-input");
    if (!input || !input.value.trim()) return;

    let notices = JSON.parse(localStorage.getItem("notices")) || [];
    notices.push({ text: input.value.trim() });
    localStorage.setItem("notices", JSON.stringify(notices));

    input.value = "";
    loadLocalNotices();
}

function deleteLocalNotice(idx) {
    let notices = JSON.parse(localStorage.getItem("notices")) || [];
    notices.splice(idx, 1);
    localStorage.setItem("notices", JSON.stringify(notices));
    loadLocalNotices();
}

// ==========================================================================
// 11. LIVE FRONTEND TABLE FILTER / SEARCH ENGINE
// ==========================================================================
function filterTable() {
    const input = document.getElementById("adminSearch");
    const filter = input.value.toUpperCase();
    
    // Find active section's database viewport table
    let activeTableBody = null;
    if (currentSection === 'members') activeTableBody = document.getElementById("member-data");
    if (currentSection === 'shortterm') activeTableBody = document.getElementById("shortterm-data");
    if (currentSection === 'testimonials') activeTableBody = document.getElementById("testimonial-data");
    if (currentSection === 'inquiries') activeTableBody = document.getElementById("inquiry-data-body");

    if (!activeTableBody) return;

    const rows = activeTableBody.getElementsByTagName("tr");
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName("td");
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
            if (cells[j]) {
                const textValue = cells[j].textContent || cells[j].innerText;
                if (textValue.toUpperCase().indexOf(filter) > -1) {
                    found = true;
                    break;
                }
            }
        }
        
        if (found) {
            rows[i].style.display = "";
        } else {
            rows[i].style.display = "none";
        }
    }
}

// ==========================================================================
// 12. PROMOTIONAL FLYER BANNER PUSH CONTROLLER (SUPABASE LIVE CAMPAIGN INTEGRATION)
// ==========================================================================

// Fetches the active flyer from the 'banner_campaigns' table on startup
async function fetchActiveBanner() {
    const previewImg = document.getElementById("current-banner-preview");
    if (!previewImg) return;

    try {
        const { data, error } = await _supabase
            .from('banner_campaigns')
            .select('*')
            .eq('is_active', true)
            .order('id', { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching active banner campaign:", error);
            return;
        }

        if (data && data.length > 0) {
            // Display database-pushed live image
            previewImg.src = data[0].image_url;
        } else {
            // Default placeholder image
            previewImg.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop";
        }
    } catch (err) {
        console.error("Exception in fetchActiveBanner execution:", err);
    }
}

// Converts uploaded image to Base64, disables prior active campaigns, and saves new banner to Supabase
async function uploadBanner() {
    const fileInput = document.getElementById("banner-upload");
    const previewImg = document.getElementById("current-banner-preview");
    
    if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        alert("Please select a valid local image file first!");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function(e) {
        const base64Data = e.target.result;

        try {
            // 1. Deactivate any currently active campaigns in the database
            const { error: updateError } = await _supabase
                .from('banner_campaigns')
                .update({ is_active: false })
                .eq('is_active', true);

            if (updateError) {
                console.error("Deactivation of preceding banners encountered an issue:", updateError);
            }

            // 2. Insert new banner campaign row
            const { error: insertError } = await _supabase
                .from('banner_campaigns')
                .insert([
                    {
                        image_url: base64Data,
                        is_active: true
                    }
                ]);

            if (insertError) {
                alert("Database insert failed: " + insertError.message);
            } else {
                previewImg.src = base64Data;
                alert("New advertising flyer has been pushed live into 'banner_campaigns'!");
            }
        } catch (err) {
            console.error("Exception during banner database upload:", err);
            alert("Banner upload failed. Check web console log.");
        }
    };

    reader.readAsDataURL(file);
}

// Disables active banner inside Supabase database
async function toggleBanner(status) {
    const previewImg = document.getElementById("current-banner-preview");
    
    try {
        if (status === false) {
            const { error } = await _supabase
                .from('banner_campaigns')
                .update({ is_active: false })
                .eq('is_active', true);

            if (error) {
                alert("Failed to disable flyer in the database: " + error.message);
            } else {
                if (previewImg) {
                    previewImg.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop";
                }
                alert("The promotional flyer has been successfully deactivated in the database.");
            }
        }
    } catch (err) {
        console.error("Exception deactivating banner campaign:", err);
    }
}

function toggleGymStatus() {
            const btn = document.getElementById('gym-status-btn');
            if (btn.innerHTML.includes('Open')) {
                btn.innerHTML = '<i class="fas fa-door-closed"></i> Gym Closed';
                btn.style.backgroundColor = '#d32f2f';
            } else {
                btn.innerHTML = '<i class="fas fa-door-open"></i> Gym Open';
                btn.style.backgroundColor = '';
            }
        }
        function showSection(id) {
            document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
            document.getElementById(id + '-section').classList.remove('hidden');
            document.getElementById('section-title').innerText = id.charAt(0).toUpperCase() + id.slice(1) + " Overview";
        }


document.addEventListener('DOMContentLoaded', () => {
    const menuBtn = document.getElementById('menuToggle');
    const menuDrawer = document.getElementById('mobileMenu');

    if (menuBtn && menuDrawer) {
        menuBtn.addEventListener('click', () => {
            // Check current display state and toggle
            if (menuDrawer.style.display === 'none' || menuDrawer.style.display === '') {
                menuDrawer.style.display = 'block';
                menuBtn.setAttribute('aria-expanded', 'true');
            } else {
                menuDrawer.style.display = 'none';
                menuBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }
});






























