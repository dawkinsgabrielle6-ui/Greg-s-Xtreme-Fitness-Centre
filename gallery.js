// 1. SELECT ELEMENTS
const slides = document.querySelectorAll('.slide');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const albumOverlay = document.getElementById('photo-grid-overlay');
const closeBtn = document.getElementById('close-album');
const gridContent = document.getElementById('grid-content');

let currentSlide = 0;

// 2. ALBUM DATA
const albumPhotos = {
    "gym-life": ["pic14.jpeg","pic2.jpeg", "pic3.jpeg", "pic4.jpeg", "pic5.jpeg", "pic6.jpeg", "pic7.jpeg", "pic9.jpeg", "pic10.jpeg", "pic11.jpg", "pic12.jpeg", "pic15.jpg", "pic16.jpg", "pic17.jpg", "pic18.jpg", "pic19.jpg", "pic20.jpg", "pic22.jpg", "pic23.jpg", "pic24.jpg", "pic25.jpg", "pic26.jpg", "pic27.jpg", "pic28.jpg", "pic29.jpg", "pic30.jpg", "pic32.jpg", "pic33.jpg", "pic34.jpg", "pic35.jpg", "pic45.jpeg", "pic46.jpeg", "pic47.jpeg", "pic48.jpeg", "pic49.jpeg"],
    "current-gym": ["gym02.jpeg", "gym03.jpeg", "gym04.jpeg", "gym05.jpeg", "gym06.jpeg", "gym07.jpeg", "gym08.jpeg", "gym09.jpeg", "gym10.jpeg", "gym11.jpeg", "gym12.jpeg", "gym13.jpeg", "gym14.jpeg", "gym15.jpeg", "gym16.jpeg", "gym17.jpeg", "gym18.jpeg", "gym19.jpeg", "gym20.jpeg", "gym21.jpeg", "gym22.jpeg", "pic36.jpeg", "pic37.jpeg", "pic38.jpeg", "pic39.jpeg", "pic40.jpeg", "pic41.jpeg"],
    "pink-day": ["pinkday2.jpeg", "pinkday3.jpeg", "pinkday4.jpeg", "pinkday5.jpeg", "pinkday6.jpeg", "pinkday7.jpeg", "pinkday8.jpeg", "pinkday9.jpeg", "pinkday10.jpeg", "pinkday11.jpeg", "pinkday12.jpeg", "pinkday13.jpeg", "pinkday14.jpeg", "pinkday15.jpeg", "pinkday16.jpeg", "pinkday17.jpeg", "pinkday18.jpeg", "pinkday19.jpeg", "pinkday20.jpeg", "pinkday30.jpeg", "pinkday21.jpeg", "pinkday22.jpeg", "pinkday23.jpeg", "pinkday25.jpeg", "pinkday26.jpeg", "pinkday27.jpeg", "pinkday28.jpeg"], 
    "bodybuilding": ["Kelli01.jpeg", "Kelli03.jpeg", "Kelli04.jpeg", "Romain01.JPG", "Romain02.JPG", "Romain03.JPG", "Jordan.JPG", "Asani.JPG", "Mikey.jpeg","Donn02.jpeg","Donn03.jpeg","Donn04.jpeg"],
    "jersey-day": ["jersey01.jpeg", "jersey02.jpeg", "jersey03.jpeg", "jersey04.jpeg", "jersey05.jpeg", "jersey06.jpeg", "jersey07.jpeg", "jersey08.jpeg", "jersey09.jpeg", "jersey10.jpeg", "jersey11.jpeg", "jersey12.jpeg", "jersey13.jpeg", "jersey14.jpeg"]
};

// 3. SLIDER LOGIC
function showSlide(index) {
    if (!slides.length) return;
    
    slides.forEach(slide => slide.classList.remove('active'));
    
    if (index >= slides.length) currentSlide = 0;
    else if (index < 0) currentSlide = slides.length - 1;
    else currentSlide = index;
    
    slides[currentSlide].classList.add('active');
    
    const color = slides[currentSlide].getAttribute('data-color');
    if (color) {
        document.documentElement.style.setProperty('--accent-color', color);
    }
}

if (nextBtn) nextBtn.addEventListener('click', () => showSlide(currentSlide + 1));
if (prevBtn) prevBtn.addEventListener('click', () => showSlide(currentSlide - 1));

// 4. LIGHTBOX SETUP
const lightbox = document.createElement('div');
lightbox.id = 'lightbox-overlay';
lightbox.innerHTML = `
    <span id="close-lightbox">&times;</span>
    <button id="lb-prev" class="lb-nav">❮</button>
    <img id="lightbox-img" src="" alt="Full View">
    <button id="lb-next" class="lb-nav">❯</button>
`;
document.body.appendChild(lightbox);

const lbImg = document.getElementById('lightbox-img');
const lbClose = document.getElementById('close-lightbox');
const lbNext = document.getElementById('lb-next');
const lbPrev = document.getElementById('lb-prev');

let currentAlbumImages = []; 
let lbIndex = 0;

function openLightbox(index) {
    lbIndex = index;
    updateLightbox();
    lightbox.classList.add('active');
}

function updateLightbox() {
    if (lbImg && currentAlbumImages[lbIndex]) {
        lbImg.src = currentAlbumImages[lbIndex];
    }
}

// Lightbox Navigation
if (lbNext) {
    lbNext.onclick = (e) => {
        e.stopPropagation();
        if (currentAlbumImages.length) {
            lbIndex = (lbIndex + 1) % currentAlbumImages.length;
            updateLightbox();
        }
    };
}

if (lbPrev) {
    lbPrev.onclick = (e) => {
        e.stopPropagation();
        if (currentAlbumImages.length) {
            lbIndex = (lbIndex - 1 + currentAlbumImages.length) % currentAlbumImages.length;
            updateLightbox();
        }
    };
}

if (lbClose) {
    lbClose.onclick = () => lightbox.classList.remove('active');
}

// 5. OPEN ALBUM GRID LOGIC
document.querySelectorAll('.view-album-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const slide = btn.closest('.slide');
        if (!slide) return;

        const albumKey = slide.getAttribute('data-album');
        const h2Elem = slide.querySelector('h2');
        const albumName = h2Elem ? h2Elem.innerText : "Album";
        
        const titleElem = document.getElementById('album-title');
        if (titleElem) titleElem.innerText = albumName;
        
        if (gridContent) gridContent.innerHTML = "";
        
        if (albumPhotos[albumKey] && gridContent) {
            currentAlbumImages = albumPhotos[albumKey].map(name => `./Images/${name}`);
            
            currentAlbumImages.forEach((src, index) => {
                const img = document.createElement('img');
                img.src = src;
                img.loading = "lazy";
                
                img.onclick = () => openLightbox(index); 
                
                img.onerror = function() {
                    console.warn("Missing file: " + this.src);
                    this.style.display = "none"; 
                };

                gridContent.appendChild(img);
            });
        }
        if (albumOverlay) albumOverlay.classList.add('active');
    });
});

// 6. CLOSE LOGIC
if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (albumOverlay) albumOverlay.classList.remove('active');
    });
}

window.onclick = (event) => {
    if (event.target == albumOverlay) albumOverlay.classList.remove('active');
    if (event.target == lightbox) lightbox.classList.remove('active');
};

// SVG Icon Setup for Lightbox
function setupCuteLightbox() {
    const lbCloseIcon = document.getElementById('close-lightbox');
    const lbPrevIcon = document.getElementById('lb-prev');
    const lbNextIcon = document.getElementById('lb-next');

    if (lbCloseIcon) {
        lbCloseIcon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    }
    if (lbPrevIcon) {
        lbPrevIcon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
    }
    if (lbNextIcon) {
        lbNextIcon.innerHTML = `<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupCuteLightbox();
    showSlide(0); // Initialize first slide
});

// 7. MOBILE MENU TOGGLE
const mobileBtn = document.querySelector('.mobile-menu-btn');
const navContainer = document.querySelector('.nav-container');

if (mobileBtn) {
    mobileBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        if (navContainer) navContainer.classList.toggle('mobile-active');
    });
}

// Mobile Dropdown Toggle
document.querySelectorAll('.dropdown > a').forEach(trigger => {
    trigger.addEventListener('click', function(e) {
        if (window.innerWidth <= 992) {
            e.preventDefault();
            e.stopPropagation(); 
            const subMenu = this.nextElementSibling;
            if (subMenu) {
                const isVisible = subMenu.style.display === 'block';
                subMenu.style.display = isVisible ? 'none' : 'block';
            }
        }
    });
});

// Click anywhere else to close mobile menus
document.addEventListener('click', function(event) {
    if (!navContainer) return;
    
    const isMobileActive = navContainer.classList.contains('mobile-active');

    if (isMobileActive) {
        navContainer.classList.remove('mobile-active');
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.style.display = 'none';
        });
    }
});
