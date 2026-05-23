import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    getDocs,
    deleteDoc, 
    doc        
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. ඔයාගේ Firebase Config එක
const firebaseConfig = {
  apiKey: "AIzaSyDRPro7oeI4z3faIUGoqW_xLZGF2dH-PwA",
  authDomain: "trailersbliss.firebaseapp.com",
  projectId: "trailersbliss",
  storageBucket: "trailersbliss.firebasestorage.app",
  messagingSenderId: "363232415056",
  appId: "1:363232415056:web:c832a34c61619c4e7a3055",
  measurementId: "G-NSXBVWL28C"
};

// 2. Firebase Initialize කිරීම
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener("DOMContentLoaded", function() {

    // Admin ලොග් වෙලාද ඉන්නේ කියලා බ්‍රවුසර් එකෙන් පරීක්ෂා කිරීම
    let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    
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

    // Admin Login එකේ Password එක Check කිරීම (ගැටළුව නිරාකරණය කළ කොටස)
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Page එක රීලෝඩ් වෙන එක වළක්වයි
            
            const password = adminPasswordInput.value;
            
            if (password === 'adminyenuka') { 
                if(loginError) loginError.classList.add('d-none');
                
                // Admin සාර්ථකව ලොග් වුණාම Session එක හදනවා
                sessionStorage.setItem('isAdmin', 'true');
                isAdmin = true;

                // දැනට පේජ් එකේ තියෙන ඔක්කොම Delete බොත්තම් පෙන්නන්න අණ දෙනවා
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.style.display = 'block';
                });
                
                // Login Modal එක ආරක්ෂිතව වසා දැමීම
                const loginModalEl = document.getElementById('adminLoginModal');
                if (loginModalEl) {
                    const loginModal = bootstrap.Modal.getInstance(loginModalEl) || new bootstrap.Modal(loginModalEl);
                    loginModal.hide();
                }
                
                if(adminPasswordInput) adminPasswordInput.value = '';

                // කුඩා ප්‍රමාදයක් (මිලි තත්පර 400ක්) ලබා දී Dashboard Modal එක විවෘත කිරීම
                // මෙසේ කරන්නේ Bootstrap Modal දෙකක් එකවර මාරු වීමේදී එන Error එක නැති කිරීමටයි.
                setTimeout(() => {
                    const dashboardModalEl = document.getElementById('adminDashboardModal');
                    if (dashboardModalEl) {
                        const dashboardModal = bootstrap.Modal.getInstance(dashboardModalEl) || new bootstrap.Modal(dashboardModalEl);
                        dashboardModal.show();
                    } else {
                        console.error("adminDashboardModal ID එක HTML එකේ සොයාගත නොහැක.");
                    }
                }, 400);
                
            } else {
                // Password වැරදි නම් Error එක පෙන්නනවා
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
                // ලැබුණු ID එකත් එක්කම UI එකට Add කරනවා
                addTrailerToUI(newTrailer, docId);
                alert('Trailer Added Successfully! 🎉');
            } else {
                alert('දෝෂයක්! දත්ත එකතු කිරීමට නොහැකි විය.');
            }

            // ෆෝම් එක හිස් කරලා Modal එක වහනවා
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

    // Firebase එකට Save කරන Function එක
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

    // Firebase එකෙන් දත්ත අරන් පෙන්නන Function එක
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

    // Firebase එකෙන් දත්ත Delete කරන Function එක
    async function deleteTrailerFromFirebase(docId, elementToRemove) {
        if (confirm("ඔබට විශ්වාසද මෙම ට්‍රේලර් එක මකා දැමිය යුතුයි කියා?")) {
            try {
                await deleteDoc(doc(db, "trailers", docId));
                elementToRemove.remove(); // පිටුවෙන් අයින් කිරීම
                alert("Trailer Deleted Successfully! 🗑️");
            } catch (e) {
                console.error("Error deleting document: ", e);
                alert("මකා දැමීමේදී දෝෂයක් ඇතිවිය.");
            }
        }
    }

    // HTML එකට අලුත් Movie Card එකක් එකතු කරන Function එක
    function addTrailerToUI(trailer, docId) {
        if (!dynamicTrailers) return;

        const colDiv = document.createElement('div');
        colDiv.className = 'col-6 col-md-4 col-lg-3';
        
        // Admin නම් විතරක් Delete බොත්තම පෙන්වයි, නැත්නම් හංගයි
        const displayStyle = isAdmin ? 'block' : 'none';

        colDiv.innerHTML = `
            <div class="movie-card-wrapper" style="position:relative;">
                
                <!-- Delete Button -->
                <button class="btn btn-danger btn-sm delete-btn" style="position:absolute; top:8px; right:8px; z-index:10; border-radius: 5px; padding: 2px 8px; font-size: 12px; display: ${displayStyle};">
                    <i class="fas fa-trash"></i> Delete
                </button>

                <a href="${trailer.trailer}" class="movie-card" target="_blank">
                    <div class="year-badge">${trailer.year}</div>
                    <div class="sub-badge">SINHALA SUB</div>
                    <img src="${trailer.image}" alt="Movie Poster">
                    <div class="movie-info">
                        <h5 class="movie-title">${trailer.title}</h5>
                    </div>
                </a>
            </div>
        `;
        
        // අලුත් ට්‍රේලර් මුලටම එකතු කිරීමට
        dynamicTrailers.prepend(colDiv);

        // Delete බොත්තමට ක්‍රියාකාරීත්වය එකතු කිරීම
        const deleteBtn = colDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function(e) {
            e.preventDefault(); // ලින්ක් එක ක්ලික් වෙන එක වළක්වන්න
            deleteTrailerFromFirebase(docId, colDiv);
        });
    }

});