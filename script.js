import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    deleteDoc, 
    doc        
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ඔයාගේ Firebase Config එක
const firebaseConfig = {
  apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
  authDomain: "trailersbliss.firebaseapp.com",
  projectId: "trailersbliss",
  storageBucket: "trailersbliss.firebasestorage.app",
  messagingSenderId: "363232415056",
  appId: "1:363232415056:web:c832a34c61619c4e7a3055",
  measurementId: "G-NSXBVWL28C"
};

// Firebase Initialize කිරීම
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {

    // Page එක load වෙද්දීම කලින් Admin ලොග් වෙලා හිටියා නම් කෙලින්ම admin-mode එක සක්‍රීය කරයි
    if (sessionStorage.getItem('isAdmin') === 'true') {
        document.body.classList.add('admin-mode');
    }
    
    // ==========================================
    // 1. Theme Toggle (Dark/Light Mode) Script
    // ==========================================
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                htmlElement.setAttribute('data-theme', 'light');
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
            }
        });
    }

    // ==========================================
    // 2. SCROLL BLUR EFFECT SCRIPT
    // ==========================================
    window.addEventListener('scroll', function() {
        const navbar = document.getElementById('mainNavbar');
        if (navbar) {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // ==========================================
    // 3. ADMIN SYSTEM SCRIPT
    // ==========================================
    const loginBtn = document.getElementById('loginBtn');
    const adminPasswordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');
    const addTrailerForm = document.getElementById('addTrailerForm');
    const dynamicTrailers = document.getElementById('dynamic-trailers');

    // Page එක ලෝඩ් වෙද්දි Firebase එකෙන් ට්‍රේලර්ස් අරන් පෙන්නන්න
    loadTrailersFromFirebase();

    // Admin Login එකේ Password එක Check කිරීම
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            
            const password = adminPasswordInput.value;
            
            if (password === 'adminyenuka') { 
                if(loginError) loginError.classList.add('d-none');
                
                // Admin සාර්ථකව ලොග් වුණාම Session එක සහ CSS Class එක එකතු කරනවා
                sessionStorage.setItem('isAdmin', 'true');
                document.body.classList.add('admin-mode');
                
                // Login Modal එක ආරක්ෂිතව වසා දැමීම
                const loginModalEl = document.getElementById('adminLoginModal');
                if (loginModalEl) {
                    const loginModal = bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
                    loginModal.hide();
                }
                
                if(adminPasswordInput) adminPasswordInput.value = '';

                // කුඩා ප්‍රමාදයක් ලබා දී Dashboard Modal (Add Form) එක විවෘත කිරීම
                setTimeout(() => {
                    const dashboardModalEl = document.getElementById('adminDashboardModal');
                    if (dashboardModalEl) {
                        const dashboardModal = bootstrap.Modal.getInstance(dashboardModalEl) || new bootstrap.Modal(dashboardModalEl);
                        dashboardModal.show();
                    }
                }, 400);
                
            } else {
                if(loginError) loginError.classList.remove('d-none');
            }
        });
    }

    // අලුත් ට්‍රේලර් එකක් Publish කිරීම
    if (addTrailerForm) {
        addTrailerForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 

            const title = document.getElementById('movieTitle').value;
            const year = document.getElementById('movieYear').value;
            const image = document.getElementById('movieImage').value;
            const trailer = document.getElementById('movieTrailer').value;

            const newTrailer = { title, year, image, trailer };

            // Firebase එකේ Save කරලා අලුත් ID එක ගන්නවා
            const docId = await saveTrailerToFirebase(newTrailer);

            if (docId) {
                addTrailerToUI(newTrailer, docId);
                alert('Trailer Added Successfully! 🎉');
            } else {
                alert('දෝෂයක්! දත්ත එකතු කිරීමට නොහැකි විය.');
            }

            addTrailerForm.reset();
            const dashboardModalEl = document.getElementById('adminDashboardModal');
            if (dashboardModalEl) {
                const dashboardModal = bootstrap.Modal.getInstance(dashboardModalEl);
                if(dashboardModal) dashboardModal.hide();
            }
        });
    }

    // ==========================================
    // 4. FIREBASE DATABASE FUNCTIONS
    // ==========================================

    async function saveTrailerToFirebase(trailer) {
        try {
            const docRef = await addDoc(collection(db, "trailers"), trailer);
            console.log("Trailer saved with ID: ", docRef.id);
            return docRef.id; 
        } catch (e) {
            console.error("Error adding document: ", e);
            return null;
        }
    }

    async function loadTrailersFromFirebase() {
        try {
            const querySnapshot = await getDocs(collection(db, "trailers"));
            querySnapshot.forEach((doc) => {
                addTrailerToUI(doc.data(), doc.id);
            });
        } catch (e) {
            console.error("Error loading trailers: ", e);
        }
    }

    async function deleteTrailerFromFirebase(docId, elementToRemove) {
        const checkAdmin = sessionStorage.getItem('isAdmin') === 'true';
        if (!checkAdmin) {
            alert("අවසර නැත! මෙම ක්‍රියාව සිදුකළ හැක්කේ ඇඩ්මින්වරයෙකුට පමණි.");
            return;
        }

        if (confirm("ඔබට විශ්වාසද මෙම ට්‍රේලර් එක මකා දැමිය යුතුයි කියා?")) {
            try {
                await deleteDoc(doc(db, "trailers", docId));
                elementToRemove.remove(); // පිටුවෙන් සම්පූර්ණයෙන්ම අයින් කිරීම
                alert("Trailer Deleted Successfully! 🗑️");
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("මකා දැමීමේදී දෝෂයක් ඇතිවිය.");
            }
        }
    }

    // YouTube Video Link එකෙන් Video ID එක ලබාගන්නා Function එක
    function getYouTubeVideoId(url) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    }

    // HTML එකට අලුත් Movie Card එකක් එකතු කරන Function එක
    function addTrailerToUI(trailer, docId) {
        if (!dynamicTrailers) return;

        // YouTube ලින්ක් එකෙන් ID එක අරගෙන දෙවෙනි පිටුවට යවන ලින්ක් එක හදනවා
        const videoId = getYouTubeVideoId(trailer.trailer);
        const targetLink = videoId ? `video.html?id=${videoId}` : trailer.trailer;

        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3 dynamic-movie-card';
        
        colDiv.innerHTML = `
            <div class="movie-card-wrapper" style="position:relative;">
                
                <button class="btn btn-danger btn-sm delete-btn" style="position:absolute; top:8px; right:8px; z-index:10; border-radius: 5px; padding: 4px 10px; font-size: 12px; font-weight: bold; box-shadow: 0px 2px 5px rgba(0,0,0,0.5);">
                    <i class="fas fa-trash"></i> Delete
                </button>

                <a href="${targetLink}" class="movie-card">
                    <div class="year-badge">${trailer.year}</div>
                    <div class="sub-badge">SINHALA SUB</div>
                    <img src="${trailer.image}" alt="Movie Poster">
                    <div class="movie-info">
                        <h5 class="movie-title">${trailer.title}</h5>
                    </div>
                </a>
            </div>
        `;
        
        dynamicTrailers.prepend(colDiv);

        // Delete බොත්තම ක්ලික් කළ විට ක්‍රියාත්මක වන කොටස
        const deleteBtn = colDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation(); // කාඩ් එක ක්ලික් වී යූටියුබ් යාම වළක්වයි
            deleteTrailerFromFirebase(docId, colDiv);
        });
    }

});