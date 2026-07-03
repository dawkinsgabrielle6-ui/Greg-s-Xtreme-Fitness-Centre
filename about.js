document.addEventListener('DOMContentLoaded', () => {
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

const stack = document.getElementById('xtremeStack');
const viewBtn = document.getElementById('viewAllBtn');

// Rotation Listener
stack.addEventListener('click', (e) => {
    // Stop if user clicks the button
    if (e.target.id === 'viewAllBtn') return;

    const rect = stack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const isRightSide = clickX > rect.width / 2;

    const cards = stack.querySelectorAll('.history-card');
    const newPositions = [];

    cards.forEach(c => {
        let nextPos = '';
        if (isRightSide) {
            if (c.classList.contains('pos-1')) nextPos = 'pos-3';
            else if (c.classList.contains('pos-2')) nextPos = 'pos-1';
            else if (c.classList.contains('pos-3')) nextPos = 'pos-2';
        } else {
            if (c.classList.contains('pos-1')) nextPos = 'pos-2';
            else if (c.classList.contains('pos-2')) nextPos = 'pos-3';
            else if (c.classList.contains('pos-3')) nextPos = 'pos-1';
        }
        newPositions.push(nextPos);
    });

    cards.forEach((c, index) => {
        c.classList.remove('pos-1', 'pos-2', 'pos-3');
        c.classList.add(newPositions[index]);
    });
});

// Expansion Listener
if (viewBtn) {
    viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        stack.classList.toggle('is-expanded');
        viewBtn.textContent = stack.classList.contains('is-expanded') ? 'COLLAPSE' : 'VIEW ALL';
    });
}
});