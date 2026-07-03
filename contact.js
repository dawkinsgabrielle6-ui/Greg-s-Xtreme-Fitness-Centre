// --- CONFIGURATION ---
const supabaseUrl = 'https://weufptqkdejhxhganvux.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWZwdHFrZGVqaHhoZ2FudnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzEyNzIsImV4cCI6MjA4NDQwNzI3Mn0.q7i9h5BEEsVUPzElBnEHV-78_esEkfUMQrGOJkEuGYk';

let _supabase = null;

// Safe client creation wrapper to protect execution stack if script loads before CDN library
try {
    if (typeof supabase !== 'undefined') {
        _supabase = supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase library not immediately available. Attempting fallback on DOM Load...");
    }
} catch (err) {
    console.error("Supabase Client Boot Error:", err);
}

document.addEventListener('DOMContentLoaded', () => {
    // Retry initializing if the library arrived late
    if (!_supabase && typeof supabase !== 'undefined') {
        try {
            _supabase = supabase.createClient(supabaseUrl, supabaseKey);
        } catch (err) {
            console.error("Supabase Secondary Client Boot Error:", err);
        }
    }

    // --- STATUS AND PHONE LISTENERS ---
    updateGymStatus();
    setInterval(updateGymStatus, 30000); // Check status every 30 seconds

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
            let x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
    }

    // Initialize inquiry board only if dashboard elements exist in parent window
    if (document.querySelector('.inquiry-table')) {
        fetchInquiries();
    }
});

// --- DYNAMIC GYM STATUS (Time Zone Controlled) ---
function updateGymStatus() {
    const statusEl = document.getElementById('gymStatus');
    if (!statusEl) return;

    try {
        // Enforce parsing current local time dynamically inside Jamaica's regional Zone (America/Jamaica)
        const options = {
            timeZone: 'America/Jamaica',
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('en-US', options);
        const dateParts = formatter.formatToParts(new Date());
        
        let year = 2026, month = 0, date = 1, hour = 0, minute = 0;
        
        for (const part of dateParts) {
            if (part.type === 'year') year = parseInt(part.value, 10);
            if (part.type === 'month') month = parseInt(part.value, 10) - 1; // Translate 1-12 range to 0-11 index
            if (part.type === 'day') date = parseInt(part.value, 10);
            if (part.type === 'hour') hour = parseInt(part.value, 10);
            if (part.type === 'minute') minute = parseInt(part.value, 10);
        }

        // Construct a safe isolated Date instance matching local Jamaican hours
        const jamaicaDate = new Date(year, month, date, hour, minute);
        const day = jamaicaDate.getDay(); 
        const currentTime = hour + (minute / 60); 

        // Calculation sequence for Easter-based floating Holidays
        function getEaster(y) {
            const f = Math.floor,
                G = y % 19,
                C = f(y / 100),
                H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30,
                I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11)),
                J = (y + f(y / 4) + I + 2 - C + f(C / 4)) % 7,
                L = I - J,
                calcMonth = 3 + f((L + 40) / 44),
                calcDay = L + 28 - 31 * f(calcMonth / 4);
            return new Date(y, calcMonth - 1, calcDay);
        }

        const easterSunday = getEaster(year);
        const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

        const goodFriday = new Date(easterSunday);
        goodFriday.setDate(easterSunday.getDate() - 2);

        const easterMonday = new Date(easterSunday);
        easterMonday.setDate(easterSunday.getDate() + 1);

        const ashWednesday = new Date(easterSunday);
        ashWednesday.setDate(easterSunday.getDate() - 46);

        // Define Holiday schedules
        const isClosedAllDay = (
            (month === 11 && date === 25) || // Christmas Day
            (month === 11 && date === 24) || // Christmas Eve
            isSameDay(jamaicaDate, goodFriday) // Good Friday
        );

        const isHalfDayHoliday = (
            (month === 0 && date === 1) ||   // New Year's Day
            (month === 7 && date === 1) ||   // Emancipation Day
            (month === 7 && date === 6) ||   // Independence Day
            (month === 4 && date === 23) || // Labor Day (Added)
            isSameDay(jamaicaDate, ashWednesday) ||  // Ash Wednesday
            isSameDay(jamaicaDate, easterMonday)     // Easter Monday
        );

        let isOpen = false;

        if (isClosedAllDay) {
            isOpen = false;
        } 
        else if (isHalfDayHoliday) {
            // Public Holiday Hours: 5AM - 12PM
            if (currentTime >= 5 && currentTime < 12) isOpen = true;
        } 
        else {
            // Standard Gym Hours schedule check
            if (day >= 1 && day <= 4) { // Mon-Thurs: 5AM - 10PM
                if (currentTime >= 5 && currentTime < 22) isOpen = true;
            } else if (day === 5) { // Fri: 5AM - 5:30PM
                if (currentTime >= 5 && currentTime < 17.5) isOpen = true;
            } else if (day === 6) { // Sat: 7PM - 10PM
                if (currentTime >= 19 && currentTime < 22) isOpen = true;
            } else if (day === 0) { // Sun: 11AM - 3PM
                if (currentTime >= 11 && currentTime < 15) isOpen = true;
            }
        }

        // Apply visual and semantic styles depending on calculations
        if (isOpen) {
            statusEl.innerText = "WE'RE OPEN NOW!";
            statusEl.style.color = "#00ff00";
        } else {
            statusEl.innerText = "CLOSED NOW";
            statusEl.style.color = "#ff4444";
        }
    } catch (e) {
        console.error("Time zone calculations failed gracefully: ", e);
        statusEl.innerText = "CLOSED NOW";
        statusEl.style.color = "#ff4444";
    }
}

// --- FORM SUBMISSION (WITH SUPABASE INTEGRATION) ---
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'contactForm') {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('.glow-btn');
        const formNotification = document.getElementById('formNotification');
        const originalText = "SEND TO THE TEAM";
        
        // Setup Loading Animation State
        submitBtn.innerText = "SENDING TO THE TEAM...";
        submitBtn.disabled = true;

        if (formNotification) {
            formNotification.style.display = 'none';
        }

        // Safe client verification guard before executing queries
        if (!_supabase) {
            console.error("Database client offline or load race-condition occurred.");
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            
            if (formNotification) {
                formNotification.style.display = 'block';
                formNotification.className = 'notification-box error';
                formNotification.innerHTML = '<strong>TRANSMISSION CRITICAL:</strong> Supabase client was unable to load. Please verify your connection status.';
                formNotification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        // Capture validated clean form inputs
        const formData = {
            name: e.target.querySelector('input[placeholder="Full Name"]').value,
            phone: e.target.querySelector('input[type="tel"]').value,
            email: e.target.querySelector('input[type="email"]').value,
            subject: e.target.querySelector('select').value,
            message: e.target.querySelector('textarea').value,
            status: 'pending'
        };

        const { data, error } = await _supabase
            .from('inquiries')
            .insert([formData]);

        if (error) {
            console.error("Supabase Transaction Error:", error);
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;

            if (formNotification) {
                formNotification.style.display = 'block';
                formNotification.className = 'notification-box error';
                formNotification.innerHTML = `<strong>SUBMISSION ERROR:</strong> ${error.message}`;
                formNotification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        } else {
            // Trigger complete interface reset upon successful transaction
            submitBtn.innerText = "MESSAGE SECURED!";
            submitBtn.style.backgroundColor = "#28a745";
            e.target.reset();

            if (formNotification) {
                formNotification.style.display = 'block';
                formNotification.className = 'notification-box success';
                formNotification.innerHTML = '<strong>Message Sent!</strong> Your inquiry will soon be responded by our team.';
                formNotification.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            
            setTimeout(() => {
                submitBtn.innerText = originalText;
                submitBtn.style.backgroundColor = ""; // Fallback standard CSS styles override
                submitBtn.disabled = false;
                if (formNotification) {
                    formNotification.style.display = 'none';
                }
            }, 6000);
        }
    }
});

// --- STAFF DASHBOARD FETCHING ---
async function fetchInquiries() {
    const tableBody = document.querySelector('.inquiry-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:50px; color:#666;">LOADING INQUIRIES...</td></tr>';

    if (!_supabase) {
        tableBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center; padding:20px;">Database Client Offline.</td></tr>';
        return;
    }

    const { data, error } = await _supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        tableBody.innerHTML = '<tr><td colspan="5" style="color:red; text-align:center; padding:20px;">Error loading data. Check console.</td>';
        console.error("Dashboard Feed failure:", error);
        return;
    }

    tableBody.innerHTML = data.map(item => `
        <tr>
            <td class="client-name">${item.name}</td>
            <td>${item.phone || 'N/A'}</td>
            <td><span class="category-tag">${item.subject}</span></td>
            <td class="msg-text">${item.message}</td>
            <td style="text-align: right;">
                <button class="resolve-btn" onclick="markResolved(${item.id}, this)">
                    ${item.status === 'Resolved' ? 'RESOLVED' : 'REPLY'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Function to handle "Resolving" an inquiry
async function markResolved(id, btn) {
    if (!_supabase) return;

    const { error } = await _supabase
        .from('inquiries')
        .update({ status: 'Resolved' })
        .eq('id', id);

    if (!error) {
        btn.innerText = 'RESOLVED';
        btn.style.borderColor = '#444';
        btn.style.color = '#444';
    } else {
        console.error("Resolve failure:", error);
    }
}


  // Mobile Menu Toggle
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navContainer = document.querySelector('.nav-container');

mobileBtn.addEventListener('click', (e) => {
    // Stop the click from bubbling up to the document 
    // so the document listener doesn't immediately close the menu
    e.stopPropagation(); 
    navContainer.classList.toggle('mobile-active');
});

// Mobile Dropdown Toggle
document.querySelectorAll('.dropdown > a').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            e.preventDefault();
            e.stopPropagation(); // Prevents the dropdown click from closing the whole menu
            const subMenu = this.nextElementSibling;
            if (subMenu) {
                const isVisible = subMenu.style.display === 'block';
                subMenu.style.display = isVisible ? 'none' : 'block';
            }
        }
    });
});

// Click anywhere else to close
document.addEventListener('click', function(event) {
    const isMobileActive = navContainer.classList.contains('mobile-active');

    // Only run if the menu is actually open
    if (isMobileActive) {
        // Remove active class and reset dropdowns
        navContainer.classList.remove('mobile-active');
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});