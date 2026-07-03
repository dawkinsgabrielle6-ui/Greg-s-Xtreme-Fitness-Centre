const SUPABASE_URL = "https://weufptqkdejhxhganvux.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldWZwdHFrZGVqaHhoZ2FudnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MzEyNzIsImV4cCI6MjA4NDQwNzI3Mn0.q7i9h5BEEsVUPzElBnEHV-78_esEkfUMQrGOJkEuGYk";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function toggleModal(show) {
    document.getElementById('reviewModal').style.display = show ? 'flex' : 'none';
}

async function loadReviews() {
    // Note: Standardized table name to 'reviews'
    const { data, error } = await _supabase
        .from('reviews') 
        .select('*')
        .eq('is_approved', true)
        .order('created_at', {ascending: false});
    
    const grid = document.getElementById('reviews-grid');

    if (data && data.length > 0) {
        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        document.getElementById('avg-display').innerText = `AVG RATING: ${avg.toFixed(1)} / 5.0`;

        grid.innerHTML = data.map(r => `
            <div class="review-card">
                <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div>
                <div class="quote">"${r.text}"</div>
                <div class="author">— ${r.name}</div>
            </div>
        `).join('');
    } else {
        grid.innerHTML = `<p style="text-align:center; grid-column: 1/-1;">No reviews yet. Be the first to leave one!</p>`;
    }
}

document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const { error } = await _supabase.from('reviews').insert([{
        name: document.getElementById('name').value,
        rating: parseInt(document.getElementById('rating').value),
        text: document.getElementById('text').value,
        is_approved: false
    }]);
    
    if (!error) {
        alert("Thank you!");
        toggleModal(false);
        document.getElementById('reviewForm').reset();
    } else {
        console.error("Error submitting review:", error);
        alert("Something went wrong. Please try again.");
    }
});

// Initial load
loadReviews();


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