const API_URL = "http://localhost:5000";
let isRegistering = false; // Tracks if user is in Login or Register mode

// ==========================================
// 1. INITIALIZATION & NAVIGATION
// ==========================================

// Check login status when page loads
window.onload = () => {
    const token = localStorage.getItem('token');
    
    if(token) {
        // If logged in: Show Profile, Hide Login
        document.getElementById('nav-profile-btn').classList.remove('hidden');
        document.getElementById('nav-login-btn').classList.add('hidden');
    } else {
        // If logged out: Show Login, Hide Profile
        document.getElementById('nav-profile-btn').classList.add('hidden');
        document.getElementById('nav-login-btn').classList.remove('hidden');
    }
    
    fetchProducts(); // Always load products
};

function showPage(pageId) {
    // SECURITY CHECK: These pages require login
    if (pageId === 'sell' || pageId === 'profile') {
        const token = localStorage.getItem('token');
        if (!token) {
            Swal.fire({
                icon: 'warning',
                title: 'Access Denied',
                text: 'Please Login to access this feature',
                confirmButtonColor: '#6C63FF'
            });
            showPage('auth');
            return;
        }
    }

    // Hide all pages
    ['home', 'sell', 'auth', 'profile'].forEach(id => 
        document.getElementById(id + '-page').classList.add('hidden')
    );

    // Show the requested page
    document.getElementById(pageId + '-page').classList.remove('hidden');

    // If opening Profile, load the data fresh
    if (pageId === 'profile') {
        loadProfile();
    }
}

function logout() {
    localStorage.clear();
    location.reload(); // Refresh page to reset state
}

// ==========================================
// 2. AUTHENTICATION LOGIC
// ==========================================

function toggleAuthMode() {
    isRegistering = !isRegistering;
    const title = document.getElementById('auth-title');
    const toggleText = document.getElementById('toggle-text');
    const linkText = document.getElementById('auth-action-link'); 
    
    const regFields = document.querySelectorAll('.register-only');

    if (isRegistering) {
        // Switch to REGISTER mode
        title.innerText = "Create VJTI Account";
        toggleText.innerText = "Already have an account? ";
        linkText.innerText = "Login";
        regFields.forEach(el => el.classList.remove('hidden'));
        
        document.getElementById('auth-branch').required = true;
        document.getElementById('auth-mobile').required = true;
    } else {
        // Switch to LOGIN mode
        title.innerText = "Login to UniMart";
        toggleText.innerText = "New here? ";
        linkText.innerText = "Create Account";
        regFields.forEach(el => el.classList.add('hidden'));
        
        document.getElementById('auth-branch').required = false;
        document.getElementById('auth-mobile').required = false;
    }
}

// Handle Login/Register Form Submit
document.getElementById('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('auth-username').value;
    const password = document.getElementById('auth-password').value;
    const confirmPass = document.getElementById('auth-confirm-pass').value;
    const branch = document.getElementById('auth-branch').value;
    const mobile = document.getElementById('auth-mobile').value;

    // Client-side Validation
    if (isRegistering) {
        if (password !== confirmPass) {
            Swal.fire('Error', 'Passwords do not match!', 'error');
            return;
        }
        if (mobile.length !== 10) {
            Swal.fire('Error', 'Please enter a valid 10-digit mobile number', 'error');
            return;
        }
    }

    const endpoint = isRegistering ? '/register' : '/login';
    const payload = isRegistering 
        ? { username, password, branch, mobile } 
        : { username, password };

    try {
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (res.ok) {
            if (isRegistering) {
                Swal.fire('Success', 'Registration Successful! Please Login.', 'success');
                toggleAuthMode(); // Switch back to login UI
            } else {
                // LOGIN SUCCESS: Save Data
                localStorage.setItem('token', data.token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('branch', data.branch); // Save branch for profile
                localStorage.setItem('mobile', data.mobile);

                // Show success popup
                Swal.fire({
                    title: `Welcome, ${data.username}!`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Update Navbar
               document.getElementById('nav-profile-btn').classList.remove('hidden'); // Show Profile
            document.getElementById('nav-login-btn').classList.add('hidden');      // Hide Login Button
                showPage('home');
            }
        } else {
            Swal.fire('Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Server Connection Failed', 'error');
    }
});

// ==========================================
// 3. HOME PAGE LOGIC (Search & Display)
// ==========================================

let currentProducts = []; // Global variable to store fetched products

async function fetchProducts() {
    const search = document.getElementById('search-input').value;
    const category = document.getElementById('category-filter').value;
    
    try {
        const res = await fetch(`${API_URL}/products?search=${search}&category=${category}`);
        currentProducts = await res.json(); // Store result in global variable
        renderProducts(currentProducts);
    } catch (err) {
        console.error("Error fetching products:", err);
    }
}

function renderProducts(products) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = "";
    
    if(products.length === 0) { 
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>No items found.</p>"; 
        return; 
    }

    products.forEach((item, index) => {
        // We pass the 'index' to the click function to identify which item was clicked
        const card = `
            <div class="card" onclick="openProductDetails(${index})" style="cursor: pointer;">
                <img src="${item.imageUrl}" alt="Item">
                <div class="card-content">
                    <h3>${item.name}</h3>
                    <p class="price">₹${item.price}</p>
                    <span class="category">${item.category}</span>
                    <p style="font-size:0.8rem; color:#666; margin-top:5px;">
                        Sold by: ${item.sellerName || 'Student'}
                    </p> 
                    <p style="font-size:0.8rem; color:#6C63FF; margin-top:10px;">
                        Tap for details & chat ->
                    </p>
                </div>
            </div>`;
        grid.innerHTML += card;
    });
}

// ==========================================
// NEW: MODAL LOGIC
// ==========================================

function openProductDetails(index) {
    const item = currentProducts[index]; 
    if (!item) return;

    // 1. Populate Image & Text
    document.getElementById('modal-img').src = item.imageUrl || 'https://via.placeholder.com/300?text=No+Image';
    document.getElementById('modal-title').innerText = item.name;
    document.getElementById('modal-price').innerText = `₹${item.price}`;
    document.getElementById('modal-category').innerText = item.category;
    document.getElementById('modal-seller').innerText = item.sellerName || 'Student';
    
    // Handle description text
    const desc = item.description && item.description !== 'undefined' 
        ? item.description 
        : "No description provided.";
    document.getElementById('modal-desc').innerText = desc;

    // 2. Configure Chat Button (ALWAYS CLICKABLE)
    // We bind the click event immediately. validation happens inside contactSeller.
    const chatBtn = document.getElementById('modal-chat-btn');
    chatBtn.onclick = () => contactSeller(item.contactPhone, item.name);

    // Show the Modal
    document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductDetails() {
    document.getElementById('product-modal').classList.add('hidden');
}

// ==========================================
// CONTACT SELLER (Debug Version)
// ==========================================

function contactSeller(phone, itemName) {
    const token = localStorage.getItem('token');
    
    // 1. LOGIN CHECK
    if (!token) {
        Swal.fire({
            title: 'Login Required',
            text: 'Please login to chat with the seller!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Go to Login',
            confirmButtonColor: '#6C63FF'
        }).then((result) => {
            if (result.isConfirmed) {
                closeProductDetails();
                showPage('auth');
            }
        });
        return;
    }

    // 2. DEBUGGING (Check your Console F12 if it fails)
    console.log("Raw Phone Data:", phone);

    // 3. VALIDATION & CLEANING
    // If phone is missing, "undefined", or null
    if (!phone || phone === 'undefined' || phone === 'null') {
        Swal.fire('Error', 'Seller phone number is missing for this item.', 'error');
        return;
    }

    // Remove any non-number characters (like spaces or dashes)
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');

    if (cleanPhone.length < 10) {
        Swal.fire('Error', 'Invalid phone number format.', 'error');
        return;
    }

    // 4. OPEN WHATSAPP
    // We explicitly use https:// to prevent localhost 404s
    const message = `Hi, I am interested in your item "${itemName}" listed on UniMart.`;
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    
    console.log("Opening URL:", whatsappUrl); // Check this URL in console
    window.open(whatsappUrl, '_blank');
}
// ==========================================
// 4. SELL ITEM LOGIC (File Upload)
// ==========================================

document.getElementById('sell-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('contactPhone', localStorage.getItem('mobile'));
    formData.append('sellerName', localStorage.getItem('username'));

    const fileInput = document.getElementById('image-file');
    if (fileInput.files.length > 0) {
        formData.append('image', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/add-product`, {
            method: 'POST',
            body: formData 
        });

        if (res.ok) {
            Swal.fire('Posted!', 'Your item is now live.', 'success');
            document.getElementById('sell-form').reset();
            showPage('home');
            fetchProducts();
        } else {
            Swal.fire('Error', 'Failed to upload item', 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Server Error', 'error');
    }
});

/// ==========================================
// 5. PROFILE PAGE LOGIC (Dashboard)
// ==========================================

async function loadProfile() {
    const username = localStorage.getItem('username');
    const branch = localStorage.getItem('branch') || 'Student'; 
    
    document.getElementById('profile-name').innerText = username;
    document.getElementById('profile-details').innerText = `VJTI • ${branch}`;

    // Fetch Ads posted by this user
    try {
        const res = await fetch(`${API_URL}/my-ads?username=${username}`);
        const products = await res.json();

        const activeGrid = document.getElementById('my-ads-grid');
        const historyList = document.getElementById('sold-history-list');
        const statActive = document.getElementById('stat-active');
        const statSold = document.getElementById('stat-sold');

        activeGrid.innerHTML = "";
        historyList.innerHTML = "";

        let activeCount = 0;
        let soldCount = 0;

        products.forEach(item => {
            if (item.status === 'active') {
                activeCount++;
                
                // SAFETY: Escape single quotes in description to prevent HTML errors
                const safeDesc = (item.description || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
                
                activeGrid.innerHTML += `
                    <div class="card">
                        <img src="${item.imageUrl}" alt="Item">
                        <div class="card-content">
                            <h3>${item.name}</h3>
                            <p class="price">₹${item.price}</p>
                            
                            <div style="display:flex; gap:10px; margin-top:10px;">
                                <button onclick="openEditModal('${item._id}', '${item.name.replace(/'/g, "\\'")}', '${item.price}', '${safeDesc}')" 
                                        class="btn-secondary" style="flex:1; background:#4CAF50; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                
                                <button onclick="deleteItem('${item._id}')" 
                                        class="btn-delete" style="flex:1;">
                                    <i class="fas fa-trash"></i> Remove
                                </button>
                            </div>
                        </div>
                    </div>`;
            } else {
                soldCount++;
                historyList.innerHTML += `
                    <div class="sold-item">
                        <img src="${item.imageUrl}" alt="Item">
                        <div style="flex:1;">
                            <strong>${item.name}</strong>
                            <p style="margin:0; font-size:0.9rem;">₹${item.price}</p>
                        </div>
                        <span class="sold-badge">SOLD</span>
                    </div>`;
            }
        });

        statActive.innerText = activeCount;
        statSold.innerText = soldCount;
    } catch (err) {
        console.error("Error loading profile:", err);
    }
}
// Handle "Remove Ad" Logic
async function deleteItem(id) {
    const inputOptions = new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                'sold': 'I sold this item',
                'delete': 'I changed my mind / Other'
            })
        }, 200)
    })

    const { value: reason } = await Swal.fire({
        title: 'Remove Ad?',
        text: "Why are you removing this item?",
        icon: 'question',
        input: 'radio',
        inputOptions: inputOptions,
        confirmButtonColor: '#6C63FF',
        inputValidator: (value) => {
            if (!value) return 'You need to choose a reason!'
        }
    })

    if (reason) {
        if (reason === 'sold') {
            await fetch(`${API_URL}/mark-sold/${id}`, { method: 'PUT' });
            Swal.fire('Great!', 'Item marked as sold.', 'success');
        } else {
            await fetch(`${API_URL}/delete-product/${id}`, { method: 'DELETE' });
            Swal.fire('Deleted', 'Ad removed permanently.', 'info');
        }
        loadProfile(); // Refresh the profile view
    }
}

// ==========================================
// 6. EDIT ITEM LOGIC
// ==========================================

function openEditModal(id, name, price, description) {
    // Fill the form with existing data
    document.getElementById('edit-id').value = id;
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-price').value = price;
    document.getElementById('edit-desc').value = description;

    // Show the hidden modal (Make sure you added the HTML for #edit-modal)
    document.getElementById('edit-modal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

// Handle Edit Form Submission
const editForm = document.getElementById('edit-form');
if (editForm) {
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value;
        const price = document.getElementById('edit-price').value;
        const description = document.getElementById('edit-desc').value;

        try {
            const res = await fetch(`${API_URL}/update-product/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, price, description })
            });

            if (res.ok) {
                Swal.fire('Updated!', 'Item details updated successfully.', 'success');
                closeEditModal();
                loadProfile(); // Refresh the profile to see changes
                
                // If we are currently on the home page, refresh that too
                if (!document.getElementById('home-page').classList.contains('hidden')) {
                    fetchProducts();
                }
            } else {
                Swal.fire('Error', 'Failed to update item', 'error');
            }
        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Server Error', 'error');
        }
    });
}
// ==========================================
// 7. EDIT PROFILE LOGIC
// ==========================================

function openProfileModal() {
    // Pre-fill with current data from localStorage
    document.getElementById('edit-profile-branch').value = localStorage.getItem('branch');
    document.getElementById('edit-profile-mobile').value = localStorage.getItem('mobile') || '';
    
    document.getElementById('profile-modal').classList.remove('hidden');
}

function closeProfileModal() {
    document.getElementById('profile-modal').classList.add('hidden');
}

// Handle Profile Update
document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const branch = document.getElementById('edit-profile-branch').value;
    const mobile = document.getElementById('edit-profile-mobile').value;
    const username = localStorage.getItem('username');

    if (mobile.length !== 10) {
        Swal.fire('Error', 'Mobile number must be 10 digits', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/update-profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, mobile, branch })
        });

        const data = await res.json();

        if (res.ok) {
            // 1. Update LocalStorage immediately
            localStorage.setItem('branch', data.branch);
            localStorage.setItem('mobile', data.mobile);

            // 2. Update UI
            loadProfile(); 
            
            // 3. Success Message
            Swal.fire('Success', 'Profile updated & all your ads are now fixed!', 'success');
            closeProfileModal();
        } else {
            Swal.fire('Error', data.error, 'error');
        }
    } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Server Error', 'error');
    }
});

// Add this to your window.onclick to close the new modal too
window.onclick = function(event) {
    const pModal = document.getElementById('product-modal');
    const eModal = document.getElementById('edit-modal');
    const profModal = document.getElementById('profile-modal'); // New

    if (event.target == pModal) closeProductDetails();
    if (eModal && event.target == eModal) closeEditModal();
    if (profModal && event.target == profModal) closeProfileModal();
}