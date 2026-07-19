document.addEventListener('DOMContentLoaded', () => {
    // Hide status bar elements initially for the white splash
    const statusBar = document.querySelector('.status-bar');
    if(statusBar) statusBar.style.color = '#fff';

    // Splash screen animation sequence
    setTimeout(() => {
        // 1. Fade out the initial white loader to reveal the gradient background
        const loader = document.querySelector('.white-loader-overlay');
        const gradientBg = document.querySelector('.gradient-bg-overlay');
        const logoBox = document.querySelector('.logo-box');
        
        if(loader) loader.style.opacity = '0';
        if(gradientBg) gradientBg.style.opacity = '1';
        
        // 2. Animate logo driving in from the left
        if(logoBox) {
            logoBox.classList.add('animate-in');
            
            // Start the siren flash simultaneously
            const siren = document.querySelector('.siren-pulse-glow');
            if(siren) siren.classList.add('flashing');
                
            // 3. Transition to Role Selection Screen after it stops
            setTimeout(() => {
                const splashScreen = document.getElementById('splash-screen');
                const roleScreen = document.getElementById('role-screen');
                
                if(splashScreen && roleScreen) {
                    splashScreen.classList.remove('active-view');
                    roleScreen.classList.add('active-view');
                    
                    // Change status bar back to dark for the next screen
                    if(statusBar) statusBar.style.color = '#1C2434';
                    
                    // Add active class to trigger staggered animations of role cards
                    setTimeout(() => {
                        roleScreen.classList.add('role-active');
                    }, 50);
                }
            }, 2000); // Give it time to slide in and be seen for a moment
        }
    }, 800); // Initial solid white duration
});

// Canvas rendering for the logo
const canvas = document.getElementById('logo-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    const img = new Image();
    // Using absolute path for local loading or just fallback to relative if in same folder
    img.src = 'assets/logo.png';
    // If the image fails to load, draw a fallback text
    img.onerror = () => {
        canvas.width = 280;
        canvas.height = 280;
        ctx.fillStyle = '#0E62E4';
        ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('INTEGRITY', 140, 140);
        ctx.font = '500 16px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Emergency Care', 140, 175);
    };
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Remove white background dynamically
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                // If pixel is white or very close to white, make it transparent
                if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
                    data[i+3] = 0; // Alpha to 0
                }
            }
            ctx.putImageData(imageData, 0, 0);
        } catch (e) {
            console.error("Could not remove white background:", e);
        }
    };
}

// Navigation Functions
// ── State → City → Pincode Data ──────────────────────
let stateCityData = {};

const cityPincodeData = {
    'New Delhi':'110001','Dwarka':'110045','Rohini':'110085','Preet Vihar':'110092',
    'Lajpat Nagar':'110024','Connaught Place':'110001','Janakpuri':'110058',
    'Mumbai':'400001','Pune':'411001','Nagpur':'440001','Nashik':'422001',
    'Aurangabad':'431001','Solapur':'413001','Thane':'400601','Kolhapur':'416001',
    'Bengaluru':'560001','Mysuru':'570001','Hubli':'580001','Mangaluru':'575001',
    'Belagavi':'590001','Kalaburagi':'585101','Davangere':'577001',
    'Chennai':'600001','Coimbatore':'641001','Madurai':'625001','Salem':'636001',
    'Tiruchirappalli':'620001','Tirunelveli':'627001','Vellore':'632001',
    'Lucknow':'226001','Kanpur':'208001','Agra':'282001','Varanasi':'221001',
    'Meerut':'250001','Prayagraj':'211001','Ghaziabad':'201001','Noida':'201301',
    'Ahmedabad':'380001','Surat':'395001','Vadodara':'390001','Rajkot':'360001',
    'Bhavnagar':'364001','Jamnagar':'361001','Gandhinagar':'382001',
    'Jaipur':'302001','Jodhpur':'342001','Udaipur':'313001','Kota':'324001',
    'Ajmer':'305001','Bikaner':'334001','Alwar':'301001',
    'Kolkata':'700001','Howrah':'711101','Durgapur':'713201','Siliguri':'734001',
    'Asansol':'713301','Bardhaman':'713101','Malda':'732101',
    'Amritsar':'143001','Ludhiana':'141001','Jalandhar':'144001','Patiala':'147001',
    'Bathinda':'151001','Mohali':'160055','Gurdaspur':'143521',
    'Gurugram':'122001','Faridabad':'121001','Ambala':'134001','Rohtak':'124001',
    'Panipat':'132103','Hisar':'125001','Karnal':'132001',
    'Hyderabad':'500001','Warangal':'506001','Nizamabad':'503001',
    'Karimnagar':'505001','Khammam':'507001','Mahbubnagar':'509001',
    'Visakhapatnam':'530001','Vijayawada':'520001','Guntur':'522001',
    'Nellore':'524001','Kurnool':'518001','Tirupati':'517501','Kakinada':'533001',
    'Thiruvananthapuram':'695001','Kochi':'682001','Kozhikode':'673001',
    'Thrissur':'680001','Kollam':'691001','Kannur':'670001','Palakkad':'678001',
    'Bhopal':'462001','Indore':'452001','Gwalior':'474001','Jabalpur':'482001',
    'Ujjain':'456001','Sagar':'470001','Rewa':'486001',
    'Patna':'800001','Gaya':'823001','Bhagalpur':'812001','Muzaffarpur':'842001',
    'Darbhanga':'846001','Ranchi':'834001','Jamshedpur':'831001',
    'Dhanbad':'826001','Bokaro':'827001','Bhubaneswar':'751001','Cuttack':'753001',
    'Raipur':'492001','Bilaspur':'495001','Guwahati':'781001','Silchar':'788001',
    'Shimla':'171001','Dehradun':'248001','Haridwar':'249401','Panaji':'403001',
    'Margao':'403601','Srinagar':'190001','Jammu':'180001','Chandigarh':'160001',
    'Puducherry':'605001','Imphal':'795001','Shillong':'793001','Gangtok':'737101',
    'Itanagar':'791111','Kohima':'797001','Aizawl':'796001','Agartala':'799001',
    'Leh':'194101','Kargil':'194103',
};

let currentState = "";
let currentCity = "";

async function initDropdowns() {
    try {
        const response = await fetch('assets/states-districts.json');
        const data = await response.json();
        
        data.states.forEach(s => {
            stateCityData[s.state] = s.districts;
        });

        const stateOptionsEl = document.getElementById('hosp-state-options');
        if (!stateOptionsEl) return;
        stateOptionsEl.innerHTML = '';
        
        const states = Object.keys(stateCityData).sort();
        states.forEach(state => {
            const opt = document.createElement('div');
            opt.className = 'custom-select-option';
            opt.textContent = state;
            opt.onclick = () => selectState(state);
            stateOptionsEl.appendChild(opt);
        });
    } catch (e) {
        console.error("Error loading states and cities", e);
    }
}

function selectState(state) {
    currentState = state;
    currentCity = "";
    const display = document.getElementById('hosp-state-display');
    if (display) {
        display.textContent = state;
        display.classList.add('has-values');
    }
    const options = document.getElementById('hosp-state-options');
    if (options) options.classList.remove('show');
    
    // Reset city and pincode
    const cityDisplay = document.getElementById('hosp-city-display');
    if (cityDisplay) {
        cityDisplay.textContent = 'City';
        cityDisplay.classList.remove('has-values');
    }
    const pinEl = document.getElementById('hosp-pin');
    if (pinEl) pinEl.value = '';

    // Render cities
    const cityOptionsEl = document.getElementById('hosp-city-options');
    if (!cityOptionsEl) return;
    cityOptionsEl.innerHTML = '';
    let cities = stateCityData[state] || [];
    cities = [...cities].sort();
    
    cities.forEach(city => {
        const opt = document.createElement('div');
        opt.className = 'custom-select-option';
        opt.textContent = city;
        opt.onclick = () => selectCity(city);
        cityOptionsEl.appendChild(opt);
    });
}

function selectCity(city) {
    currentCity = city;
    const display = document.getElementById('hosp-city-display');
    if (display) {
        display.textContent = city;
        display.classList.add('has-values');
    }
    const options = document.getElementById('hosp-city-options');
    if (options) options.classList.remove('show');

    // Update Pincode
    const pinEl = document.getElementById('hosp-pin');
    if (pinEl) {
        pinEl.value = '';
        if (cityPincodeData[city]) {
            pinEl.value = cityPincodeData[city];
        }
    }
}

function toggleCustomSelect(id, e) {
    if (e) { e.stopPropagation(); }
    const options = document.getElementById(id);
    if (options) {
        document.querySelectorAll('.custom-select-options, .multiselect-options').forEach(el => {
            if (el.id !== id) el.classList.remove('show');
        });
        options.classList.toggle('show');
    }
}

// ── Hospital Navigation ──────────────────────────────
function goToHospitalRegister() {
    const roleScreen = document.getElementById('role-screen');
    const hospitalScreen = document.getElementById('hospital-register-screen');
    if (roleScreen && hospitalScreen) {
        roleScreen.classList.remove('active-view');
        hospitalScreen.classList.add('active-view');
    }
}

function goToRoleScreen() {
    // Hide all possible current screens and show role screen
    ['hospital-register-screen', 'hospital-dashboard-screen', 'change-info-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active-view');
    });
    const roleScreen = document.getElementById('role-screen');
    if (roleScreen) roleScreen.classList.add('active-view');
}

function goToEmergencyType() {
    const roleScreen = document.getElementById('role-screen');
    const emergencyTypeScreen = document.getElementById('emergency-type-screen');
    
    if (roleScreen && emergencyTypeScreen) {
        roleScreen.classList.remove('active-view');
        emergencyTypeScreen.classList.add('active-view');
    }
}

function goToRoleSelection() {
    const emergencyTypeScreen = document.getElementById('emergency-type-screen');
    const roleScreen = document.getElementById('role-screen');
    
    if (emergencyTypeScreen && roleScreen) {
        emergencyTypeScreen.classList.remove('active-view');
        roleScreen.classList.add('active-view');
    }
}

// ── Custom Multi-Select Logic ────────────────────────
function toggleMultiSelect(e, optionsId) {
    if (e) { e.stopPropagation(); }
    const id = optionsId || 'hosp-type-options';
    const options = document.getElementById(id);
    if (options) {
        // Close all other open dropdowns first
        document.querySelectorAll('.multiselect-options.show, .custom-select-options.show').forEach(el => {
            if (el.id !== id) el.classList.remove('show');
        });
        options.classList.toggle('show');
    }
}

function updateMultiSelect() {
    const options = document.getElementById('hosp-type-options');
    const checkboxes = options.querySelectorAll('input[type="checkbox"]');
    const display = document.getElementById('hosp-type-display');
    
    let selected = [];
    checkboxes.forEach(cb => {
        if (cb.checked) selected.push(cb.value);
    });

    if (selected.length > 0) {
        display.textContent = selected.join(', ');
        display.classList.add('has-values');
    } else {
        display.textContent = 'Hospital Type';
        display.classList.remove('has-values');
    }
}

// Close multiselect when clicking outside
document.addEventListener('click', (e) => {
    // For multiselects
    document.querySelectorAll('.custom-multiselect').forEach(ms => {
        const opts = ms.querySelector('.multiselect-options');
        if (opts && !ms.contains(e.target)) opts.classList.remove('show');
    });
    // For custom single selects
    document.querySelectorAll('.custom-select').forEach(sel => {
        const options = sel.querySelector('.custom-select-options');
        if (options && !sel.contains(e.target)) options.classList.remove('show');
    });
    // Close modal if clicking overlay background
    const overlay = document.getElementById('icu-modal-overlay');
    if (overlay && e.target === overlay) closeICUModal();
});

// Initialize dynamically built dropdowns
initDropdowns();

// ── State: Hospital Profile & ICU Data ────────────────
let hospitalProfile = {
    name: '',
    type: '',
    phone: '',
    photo: null,
};
let hospitalICUs = []; // Array of ICU objects
let editingICUIndex = -1; // -1 = new, else index to edit

// ── Dashboard Navigation ──────────────────────────────
function goToDashboard() {
    // Collect registration data
    hospitalProfile.name = document.getElementById('hosp-name').value.trim() || 'My Hospital';
    const typeDisplay = document.getElementById('hosp-type-display');
    hospitalProfile.type = (typeDisplay && typeDisplay.classList.contains('has-values'))
        ? typeDisplay.textContent : '';

    const hospRegScreen = document.getElementById('hospital-register-screen');
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    if (hospRegScreen && dashScreen) {
        hospRegScreen.classList.remove('active-view');
        dashScreen.classList.add('active-view');
    }
    renderDashboard();
}

function goBackToDashboard() {
    const ciScreen = document.getElementById('change-info-screen');
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    if (ciScreen && dashScreen) {
        ciScreen.classList.remove('active-view');
        dashScreen.classList.add('active-view');
    }
    renderDashboard();
}

function goToChangeInfo() {
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    const ciScreen = document.getElementById('change-info-screen');
    if (dashScreen && ciScreen) {
        dashScreen.classList.remove('active-view');
        ciScreen.classList.add('active-view');
    }
    // Pre-fill Change Info form
    const ciName = document.getElementById('ci-hosp-name');
    const ciPhone = document.getElementById('ci-hosp-phone');
    if (ciName) ciName.value = hospitalProfile.name;
    if (ciPhone) ciPhone.value = hospitalProfile.phone;
    // Restore photo if available
    if (hospitalProfile.photo) {
        const preview = document.getElementById('ci-photo-preview');
        if (preview) preview.innerHTML = `<img src="${hospitalProfile.photo}" alt="Hospital photo">`;
    }
    renderCIICUList();
}

// ── Render Dashboard ─────────────────────────────────
function renderDashboard() {
    const nameEl = document.getElementById('dash-hosp-name-text');
    const typeEl = document.getElementById('dash-hosp-type-text');
    const emptyState = document.getElementById('dash-empty-state');
    const icuList = document.getElementById('dash-icu-list');

    if (!nameEl || !emptyState || !icuList) return;

    // Set hospital name with marquee if long
    const name = hospitalProfile.name || 'My Hospital';
    nameEl.classList.remove('marquee-active');
    nameEl.textContent = name;
    // Duplicate text for seamless loop if marquee needed
    setTimeout(() => {
        const container = nameEl.parentElement;
        if (nameEl.scrollWidth > container.clientWidth) {
            nameEl.textContent = name + '   •   ' + name;
            nameEl.classList.add('marquee-active');
        }
    }, 50);

    if (typeEl) typeEl.textContent = hospitalProfile.type;

    // Show/hide empty state
    if (hospitalICUs.length === 0) {
        emptyState.style.display = 'flex';
        icuList.innerHTML = '';
    } else {
        emptyState.style.display = 'none';
        icuList.innerHTML = hospitalICUs.map((icu, i) => buildICUCard(icu, i)).join('');
    }
}

function buildICUCard(icu, index) {
    const names = Array.isArray(icu.names) ? icu.names.join(' + ') : icu.name;
    return `
    <div class="icu-card">
        <div class="icu-card-header">
            <div class="icu-card-name">${names}</div>
            <div class="icu-card-badge">ICU</div>
        </div>
        <div class="icu-stats-grid">
            <div class="icu-stat-item">
                <div class="icu-stat-label">Total Beds</div>
                <div class="icu-stat-value">${icu.totalBeds || '—'}</div>
            </div>
            <div class="icu-stat-item">
                <div class="icu-stat-label">Vacant Beds</div>
                <div class="icu-stat-value accent">${icu.vacantBeds || '—'}</div>
            </div>
            <div class="icu-stat-item">
                <div class="icu-stat-label">With Ventilator</div>
                <div class="icu-stat-value">${icu.ventBeds || '—'}</div>
            </div>
            <div class="icu-stat-item">
                <div class="icu-stat-label">Without Ventilator</div>
                <div class="icu-stat-value">${icu.noVentBeds || '—'}</div>
            </div>
        </div>
        <div class="icu-card-contact">
            <i class="fa-solid fa-phone"></i>
            ${icu.contact || 'N/A'}
        </div>
        <button class="icu-card-update-btn" onclick="editICUFromDash(${index})">
            Update
        </button>
    </div>`;
}

// ── Change Info: Save ─────────────────────────────────
function saveChangeInfo() {
    const nameEl = document.getElementById('ci-hosp-name');
    const phoneEl = document.getElementById('ci-hosp-phone');
    if (nameEl) hospitalProfile.name = nameEl.value.trim() || hospitalProfile.name;
    if (phoneEl) hospitalProfile.phone = phoneEl.value.trim();
    goBackToDashboard();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        hospitalProfile.photo = e.target.result;
        const preview = document.getElementById('ci-photo-preview');
        if (preview) preview.innerHTML = `<img src="${e.target.result}" alt="Hospital photo">`;
    };
    reader.readAsDataURL(file);
}

// ── ICU Modal ─────────────────────────────────────────
function openICUModal(editIndex) {
    editingICUIndex = (editIndex !== undefined) ? editIndex : -1;
    const modal = document.getElementById('icu-modal-overlay');
    const title = document.getElementById('modal-title');
    if (!modal) return;

    // Reset form
    ['icu-total-beds','icu-vacant-beds','icu-vent-beds','icu-novent-beds','icu-contact'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    // Reset ICU name checkboxes
    const checkboxes = document.querySelectorAll('#icu-name-options input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    const nameDisplay = document.getElementById('icu-name-display');
    if (nameDisplay) { nameDisplay.textContent = 'ICU Name'; nameDisplay.classList.remove('has-values'); }

    // If editing, pre-fill
    if (editingICUIndex >= 0 && hospitalICUs[editingICUIndex]) {
        if (title) title.textContent = 'Edit ICU';
        const icu = hospitalICUs[editingICUIndex];
        const names = Array.isArray(icu.names) ? icu.names : [icu.name];
        checkboxes.forEach(cb => { if (names.includes(cb.value)) cb.checked = true; });
        updateICUNameSelect();
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
        set('icu-total-beds', icu.totalBeds);
        set('icu-vacant-beds', icu.vacantBeds);
        set('icu-vent-beds', icu.ventBeds);
        set('icu-novent-beds', icu.noVentBeds);
        set('icu-contact', icu.contact);
    } else {
        if (title) title.textContent = 'Add New ICU';
    }

    modal.classList.add('show');
}

function closeICUModal(e) {
    if (e && e.target !== document.getElementById('icu-modal-overlay')) return;
    const modal = document.getElementById('icu-modal-overlay');
    if (modal) modal.classList.remove('show');
    // Also close any open dropdown inside modal
    const opts = document.getElementById('icu-name-options');
    if (opts) opts.classList.remove('show');
}

function updateICUNameSelect() {
    const options = document.getElementById('icu-name-options');
    const checkboxes = options ? options.querySelectorAll('input[type="checkbox"]') : [];
    const display = document.getElementById('icu-name-display');
    let selected = [];
    checkboxes.forEach(cb => { if (cb.checked) selected.push(cb.value); });
    if (display) {
        if (selected.length > 0) {
            display.textContent = selected.join(', ');
            display.classList.add('has-values');
        } else {
            display.textContent = 'ICU Name';
            display.classList.remove('has-values');
        }
    }
}

function saveICU() {
    const checkboxes = document.querySelectorAll('#icu-name-options input[type="checkbox"]:checked');
    const names = Array.from(checkboxes).map(cb => cb.value);
    if (names.length === 0) { alert('Please select at least one ICU name.'); return; }

    const get = (id) => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const icuObj = {
        names,
        name: names.join(' + '),
        totalBeds:  get('icu-total-beds'),
        vacantBeds: get('icu-vacant-beds'),
        ventBeds:   get('icu-vent-beds'),
        noVentBeds: get('icu-novent-beds'),
        contact:    get('icu-contact'),
    };

    if (editingICUIndex >= 0) {
        hospitalICUs[editingICUIndex] = icuObj;
    } else {
        hospitalICUs.push(icuObj);
    }

    const modal = document.getElementById('icu-modal-overlay');
    if (modal) modal.classList.remove('show');
    renderCIICUList();
}

function editICUFromDash(index) {
    goToChangeInfo();
    setTimeout(() => openICUModal(index), 100);
}

function deleteICU(index) {
    hospitalICUs.splice(index, 1);
    renderCIICUList();
}

// ── Render Change Info ICU List ───────────────────────
function renderCIICUList() {
    const list = document.getElementById('ci-icu-list');
    if (!list) return;
    if (hospitalICUs.length === 0) {
        list.innerHTML = '';
        return;
    }
    list.innerHTML = hospitalICUs.map((icu, i) => {
        const names = Array.isArray(icu.names) ? icu.names.join(' + ') : icu.name;
        return `
        <div class="ci-icu-item">
            <div>
                <div class="ci-icu-item-name">${names}</div>
                <div class="ci-icu-item-sub">Total: ${icu.totalBeds || '—'} beds • Vacant: ${icu.vacantBeds || '—'}</div>
            </div>
            <div class="ci-icu-item-actions">
                <button class="ci-icu-edit-btn" onclick="openICUModal(${i})" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="ci-icu-del-btn" onclick="deleteICU(${i})" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`;
    }).join('');
}
