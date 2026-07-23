document.addEventListener('DOMContentLoaded', () => {
    // If we are reloading to restore state after language change, skip splash animation!
    if (sessionStorage.getItem('returnToLanguage') === 'true') {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) splashScreen.classList.remove('active-view');
        const roleScreen = document.getElementById('role-screen');
        if (roleScreen) roleScreen.classList.add('role-active');
        return;
    }

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
    img.src = 'assets/splash-logo.png';
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

        // Initialize for Registration Screen
        const stateOptionsEl = document.getElementById('hosp-state-options');
        if (stateOptionsEl) {
            stateOptionsEl.innerHTML = '';
            const states = Object.keys(stateCityData).sort();
            states.forEach(state => {
                const opt = document.createElement('div');
                opt.className = 'custom-select-option';
                opt.textContent = state;
                opt.onclick = () => selectState(state);
                stateOptionsEl.appendChild(opt);
            });
        }
        
        // Initialize for Update Info Screen
        const ciStateOptionsEl = document.getElementById('ci-hosp-state-options');
        if (ciStateOptionsEl) {
            ciStateOptionsEl.innerHTML = '';
            const states = Object.keys(stateCityData).sort();
            states.forEach(state => {
                const opt = document.createElement('div');
                opt.className = 'custom-select-option';
                opt.textContent = state;
                opt.onclick = () => selectCiState(state);
                ciStateOptionsEl.appendChild(opt);
            });
        }
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

// ── Update Info (CI) Dropdowns ──────────────────────────
function selectCiState(state) {
    const display = document.getElementById('ci-hosp-state-display');
    if (display) {
        display.textContent = state;
        display.classList.add('has-values');
    }
    const options = document.getElementById('ci-hosp-state-options');
    if (options) options.classList.remove('show');
    
    // Reset city and pincode
    const cityDisplay = document.getElementById('ci-hosp-city-display');
    if (cityDisplay) {
        cityDisplay.textContent = 'City';
        cityDisplay.classList.remove('has-values');
    }
    const pinEl = document.getElementById('ci-hosp-pin');
    if (pinEl) pinEl.value = '';

    // Render cities
    const cityOptionsEl = document.getElementById('ci-hosp-city-options');
    if (!cityOptionsEl) return;
    cityOptionsEl.innerHTML = '';
    let cities = stateCityData[state] || [];
    cities = [...cities].sort();
    
    cities.forEach(city => {
        const opt = document.createElement('div');
        opt.className = 'custom-select-option';
        opt.textContent = city;
        opt.onclick = () => selectCiCity(city);
        cityOptionsEl.appendChild(opt);
    });
}

function selectCiCity(city) {
    const display = document.getElementById('ci-hosp-city-display');
    if (display) {
        display.textContent = city;
        display.classList.add('has-values');
    }
    const options = document.getElementById('ci-hosp-city-options');
    if (options) options.classList.remove('show');

    // Update Pincode
    const pinEl = document.getElementById('ci-hosp-pin');
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
    triggerGoogleTranslate('en');
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
    if (roleScreen) {
        roleScreen.classList.add('active-view');
    }
    // Restore the patient language when returning from the hospital section
    triggerGoogleTranslate(patientLangId);
}

function goToEmergencyType() {
    triggerGoogleTranslate(patientLangId);
    const roleScreen = document.getElementById('role-screen');
    const emergencyTypeScreen = document.getElementById('emergency-type-screen');
    
    if (roleScreen && emergencyTypeScreen) {
        roleScreen.classList.remove('active-view');
        emergencyTypeScreen.classList.add('active-view');
    }
}

let currentPatientEmergencyType = 'Other';


function getLangCodeDisplay(id) {
    const lang = languages.find(l => l.id === id);
    return lang ? lang.name : id.toUpperCase();
}

function goToPatientHospitals(emergencyType = 'Other') {
    triggerGoogleTranslate(patientLangId);
    const selector = document.querySelector('.patient-lang-selector');
    if (selector) {
        selector.innerHTML = getLangCodeDisplay(patientLangId) + ' <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    }
    currentPatientEmergencyType = emergencyType;
    const emergencyTypeScreen = document.getElementById('emergency-type-screen');
    const hospitalsScreen = document.getElementById('patient-hospitals-screen');
    
    if (emergencyTypeScreen && hospitalsScreen) {
        emergencyTypeScreen.classList.remove('active-view');
        hospitalsScreen.classList.add('active-view');
        
        // Show loading state for hospitals immediately
        const hospitalListContainer = document.getElementById('patient-hospitals-list');
        if (hospitalListContainer) {
            hospitalListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: #888;">Fetching nearest hospitals...</div>';
        }
        
        requestPatientLocation();
    }
}

function requestPatientLocation() {
    const locAddress = document.querySelector('.patient-location-pill .loc-address');
    if (!locAddress) return;

    if (navigator.geolocation) {
        locAddress.textContent = "Requesting location...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                locAddress.textContent = "Fetching location...";
                
                // Sync with location picker if it exists
                if (typeof currentPickerLat !== 'undefined') {
                    currentPickerLat = lat;
                    currentPickerLon = lon;
                }
                
                // Fetch nearby hospitals using Overpass API
                if (typeof fetchNearbyHospitals === 'function') {
                    fetchNearbyHospitals(lat, lon);
                }
                
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.display_name) {
                            // Extract a shorter address if possible (suburb/city)
                            const addressParts = [];
                            if (data.address.suburb) addressParts.push(data.address.suburb);
                            if (data.address.city) addressParts.push(data.address.city);
                            else if (data.address.state_district) addressParts.push(data.address.state_district);
                            
                            locAddress.textContent = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
                        } else {
                            locAddress.textContent = "Unknown location";
                        }
                    })
                    .catch(err => {
                        console.error('Reverse geocoding error:', err);
                        locAddress.textContent = "Location details unavailable";
                    });
            },
            (error) => {
                console.error('Geolocation error:', error);
                
                // Fallback to default location or previously picked location
                const lat = typeof currentPickerLat !== 'undefined' ? currentPickerLat : 28.6139;
                const lon = typeof currentPickerLon !== 'undefined' ? currentPickerLon : 77.2090;
                
                if (typeof fetchNearbyHospitals === 'function') {
                    fetchNearbyHospitals(lat, lon);
                }
                
                // Fetch the address for fallback so it doesn't look broken
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.display_name) {
                            const addressParts = [];
                            if (data.address.suburb) addressParts.push(data.address.suburb);
                            if (data.address.city) addressParts.push(data.address.city);
                            else if (data.address.state_district) addressParts.push(data.address.state_district);
                            locAddress.textContent = addressParts.length > 0 ? addressParts.join(', ') : data.display_name;
                        } else {
                            locAddress.textContent = "Default Location";
                        }
                    })
                    .catch(() => {
                        locAddress.textContent = "Default Location";
                    });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        // Geolocation not supported fallback
        const lat = typeof currentPickerLat !== 'undefined' ? currentPickerLat : 28.6139;
        const lon = typeof currentPickerLon !== 'undefined' ? currentPickerLon : 77.2090;
        
        if (typeof fetchNearbyHospitals === 'function') {
            fetchNearbyHospitals(lat, lon);
        }
        locAddress.textContent = "Default Location";
    }
}

function goBackToEmergencyType() {
    const hospitalsScreen = document.getElementById('patient-hospitals-screen');
    const emergencyTypeScreen = document.getElementById('emergency-type-screen');
    
    if (hospitalsScreen && emergencyTypeScreen) {
        hospitalsScreen.classList.remove('active-view');
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

function updateCiMultiSelect() {
    const options = document.getElementById('ci-hosp-type-options');
    const checkboxes = options.querySelectorAll('input[type="checkbox"]');
    const display = document.getElementById('ci-hosp-type-display');
    
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

//  State: Hospital Profile & ICU Data 
let hospitalProfile = {
    name: '', type: '', regNum: '', state: '', city: '', pin: '', address: '', phone: '', photo: null,
};
let hospitalICUs = [];
try {
    const hp = localStorage.getItem('hospitalProfile');
    if (hp && hp !== 'undefined') {
        hospitalProfile = JSON.parse(hp);
    }
    const hi = localStorage.getItem('hospitalICUs');
    if (hi && hi !== 'undefined') {
        hospitalICUs = JSON.parse(hi);
    }
} catch (e) {
    console.warn("Failed to parse localStorage data:", e);
}
let editingICUIndex = -1; // -1 = new, else index to edit

function persistHospitalData() {
    localStorage.setItem('hospitalProfile', JSON.stringify(hospitalProfile));
    localStorage.setItem('hospitalICUs', JSON.stringify(hospitalICUs));
}

// ── Dashboard Navigation ──────────────────────────────
function goToDashboard() {
    triggerGoogleTranslate('en');
    // Collect registration data
    hospitalProfile.name = document.getElementById('hosp-name').value.trim() || 'My Hospital';
    const typeDisplay = document.getElementById('hosp-type-display');
    hospitalProfile.type = (typeDisplay && typeDisplay.classList.contains('has-values'))
        ? typeDisplay.textContent : '';
        
    persistHospitalData();

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
    // Clear all fields so it starts empty as requested
    const fieldsToClear = [
        'ci-hosp-name', 'ci-hosp-reg-num', 'ci-hosp-pin', 'ci-hosp-address'
    ];
    fieldsToClear.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    const typeDisplay = document.getElementById('ci-hosp-type-display');
    if (typeDisplay) { typeDisplay.textContent = 'Hospital Type'; typeDisplay.classList.remove('has-values'); }
    const typeOpts = document.getElementById('ci-hosp-type-options');
    if (typeOpts) { typeOpts.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false); }
    
    const stateDisplay = document.getElementById('ci-hosp-state-display');
    if (stateDisplay) { stateDisplay.textContent = 'State'; stateDisplay.classList.remove('has-values'); }
    
    const cityDisplay = document.getElementById('ci-hosp-city-display');
    if (cityDisplay) { cityDisplay.textContent = 'City'; cityDisplay.classList.remove('has-values'); }
    
    const preview = document.getElementById('ci-photo-preview');
    if (preview) {
        preview.innerHTML = `
            <div class="ci-upload-content" id="ci-upload-content">
                <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                <span>Upload Your Hospital Logo / Photo</span>
            </div>
            <input type="file" id="ci-photo-input" accept="image/*" style="display:none;" onchange="handlePhotoUpload(event)">
        `;
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
    <div style="margin-bottom: 32px;">
        <!-- Title -->
        <h3 style="color: #C0202A; font-family: var(--font); font-size: 1.3rem; font-weight: 800; text-transform: uppercase; margin: 0 0 12px 16px;">
            ${names}
        </h3>
        <!-- Card -->
        <div style="background: #FDECEA; border-radius: 24px; padding: 28px 24px 24px 24px;">
            <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds</div>
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.totalBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant</div>
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.vacantBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant<br>(with ventilator)</div>
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.ventBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant<br>(without ventilator)</div>
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.noVentBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Emergency phone No</div>
                    <div style="color: #C0202A; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.contact || '-'}</div>
                </div>
            </div>
            <button onclick="editICUFromDash(${index})" style="width: 100%; background: #C0202A; color: #fff; font-family: var(--font); font-size: 1.25rem; font-weight: 600; padding: 14px 24px; border: none; border-radius: 20px; cursor: pointer; transition: opacity 0.2s; -webkit-tap-highlight-color: transparent;" onmousedown="this.style.opacity='0.7'" onmouseup="this.style.opacity='1'" onmouseleave="this.style.opacity='1'">
                Update
            </button>
        </div>
    </div>`;
}

// ── Change Info: Save ─────────────────────────────────
function saveChangeInfo() {
    const nameEl = document.getElementById('ci-hosp-name');
    if (nameEl && nameEl.value.trim()) hospitalProfile.name = nameEl.value.trim();
    
    const typeDisplay = document.getElementById('ci-hosp-type-display');
    if (typeDisplay && typeDisplay.classList.contains('has-values')) {
        hospitalProfile.type = typeDisplay.textContent;
    }
    
    const regNumEl = document.getElementById('ci-hosp-reg-num');
    if (regNumEl && regNumEl.value.trim()) hospitalProfile.regNum = regNumEl.value.trim();
    
    const stateDisplay = document.getElementById('ci-hosp-state-display');
    if (stateDisplay && stateDisplay.classList.contains('has-values')) {
        hospitalProfile.state = stateDisplay.textContent;
    }
    
    const cityDisplay = document.getElementById('ci-hosp-city-display');
    if (cityDisplay && cityDisplay.classList.contains('has-values')) {
        hospitalProfile.city = cityDisplay.textContent;
    }
    
    const pinEl = document.getElementById('ci-hosp-pin');
    if (pinEl && pinEl.value.trim()) hospitalProfile.pin = pinEl.value.trim();
    
    const addressEl = document.getElementById('ci-hosp-address');
    if (addressEl && addressEl.value.trim()) hospitalProfile.address = addressEl.value.trim();

    persistHospitalData();
    goBackToDashboard();
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        hospitalProfile.photo = e.target.result;
        const preview = document.getElementById('ci-photo-preview');
        if (preview) {
            let img = preview.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                preview.appendChild(img);
            }
            img.src = e.target.result;
            img.alt = "Hospital Logo";
        }
    };
    reader.readAsDataURL(file);
}

// ── ICU Management Screen ────────────────────────────
let undoTimeout = null;
let deletedICUData = null;
let deletedICUIndex = -1;
let addICUSource = 'change-info';

// Navigate: To Add ICU Bed
function goToAddICU(source = 'change-info') {
    addICUSource = source;
    
    // Hide possible origin screens
    const ciScreen = document.getElementById('change-info-screen');
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    
    if (ciScreen) ciScreen.classList.remove('active-view');
    if (dashScreen) dashScreen.classList.remove('active-view');
    
    const addScreen = document.getElementById('add-icu-screen');
    if (addScreen) {
        addScreen.classList.add('active-view');
    }
    // Reset Add ICU form
    const nameEl = document.getElementById('add-icu-name');
    if (nameEl) nameEl.value = '';
    const contactEl = document.getElementById('add-icu-contact');
    if (contactEl) contactEl.value = '';
    ['add-icu-total', 'add-icu-vacant', 'add-icu-vent', 'add-icu-novent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '0';
            syncMinusButtonColor(id);
        }
    });
}


// Navigate: Add ICU Bed -> Change Info
// Navigate: Add ICU Bed -> Back
function goBackToChangeInfoFromAddICU() {
    const addScreen = document.getElementById('add-icu-screen');
    if (addScreen) addScreen.classList.remove('active-view');
    
    if (addICUSource === 'dashboard') {
        const dashScreen = document.getElementById('hospital-dashboard-screen');
        if (dashScreen) dashScreen.classList.add('active-view');
        renderDashboardICUs();
    } else {
        const ciScreen = document.getElementById('change-info-screen');
        if (ciScreen) ciScreen.classList.add('active-view');
    }
}


function syncMinusButtonColor(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const val = parseInt(el.textContent) || 0;
    const minusBtn = el.previousElementSibling;
    if (minusBtn && minusBtn.classList.contains('icu-qty-minus')) {
        minusBtn.style.background = (val > 0) ? '#ED1C24' : '#FA9A9F';
    }
}

// Quantity counter update
function updateICUCount(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseInt(el.textContent) || 0;
    const next = Math.max(0, current + delta);
    el.textContent = next;
    syncMinusButtonColor(id);
}

// Add ICU from Add ICU Bed screen
function addICUAndGoBack() {
    const nameEl = document.getElementById('add-icu-name');
    const name = nameEl ? nameEl.value.trim() : '';
    if (!name) {
        alert('Please enter an ICU Bed Name.');
        return;
    }

    const getCount = (id) => parseInt(document.getElementById(id)?.textContent) || 0;
    const contactEl = document.getElementById('add-icu-contact');
    const contact = contactEl ? contactEl.value.trim() : '';

    const icuObj = {
        names: [name],
        name: name,
        contact: contact,
        totalBeds:  getCount('add-icu-total'),
        vacantBeds: getCount('add-icu-vacant'),
        ventBeds:   getCount('add-icu-vent'),
        noVentBeds: getCount('add-icu-novent')
    };

    hospitalICUs.push(icuObj);
    persistHospitalData();
    renderCIICUList();
    goBackToChangeInfoFromAddICU();
}





function showUndoSnackbar() {
    const snackbar = document.getElementById('icu-snackbar');
    const snackbarText = document.getElementById('snackbar-text');
    if (!snackbar || !snackbarText || !deletedICUData) return;

    const names = Array.isArray(deletedICUData.names) ? deletedICUData.names.join(' + ') : deletedICUData.name;
    snackbarText.textContent = `${names} deleted`;
    
    snackbar.classList.add('show');
    
    if (undoTimeout) clearTimeout(undoTimeout);
    undoTimeout = setTimeout(() => {
        snackbar.classList.remove('show');
        deletedICUData = null;
        deletedICUIndex = -1;
    }, 4000);
}

function deleteICU(index) {
    deletedICUData = hospitalICUs[index];
    deletedICUIndex = index;
    hospitalICUs.splice(index, 1);
    persistHospitalData();
    renderCIICUList();
    showUndoSnackbar();
}

function undoDeleteICU() {
    if (deletedICUData && deletedICUIndex !== -1) {
        hospitalICUs.splice(deletedICUIndex, 0, deletedICUData);
        persistHospitalData();
        renderCIICUList();
        
        const snackbar = document.getElementById('icu-snackbar');
        if (snackbar) snackbar.classList.remove('show');
        
        if (undoTimeout) clearTimeout(undoTimeout);
        deletedICUData = null;
        deletedICUIndex = -1;
    }
}

function commitICUChanges() {
    hospitalICUs = JSON.parse(JSON.stringify(tempICUs));
    goBackToChangeInfo();
    renderCIICUList();
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

let currentUpdateICUIndex = -1;

function editICUFromDash(index) {
    currentUpdateICUIndex = index;
    const icu = hospitalICUs[index];
    if (!icu) return;
    
    document.getElementById('upd-icu-total').textContent = icu.totalBeds || 0;
    document.getElementById('upd-icu-vacant').textContent = icu.vacantBeds || 0;
    document.getElementById('upd-icu-vent').textContent = icu.ventBeds || 0;
    document.getElementById('upd-icu-novent').textContent = icu.noVentBeds || 0;
    document.getElementById('upd-icu-contact').value = icu.contact || '';

    ['upd-icu-total', 'upd-icu-vacant', 'upd-icu-vent', 'upd-icu-novent'].forEach(id => syncMinusButtonColor(id));

    // Switch screen
    document.querySelector('.screen-view.active-view')?.classList.remove('active-view');
    document.getElementById('update-icu-screen').classList.add('active-view');
}

function goBackToDashboardFromUpdate() {
    document.getElementById('update-icu-screen').classList.remove('active-view');
    document.getElementById('hospital-dashboard-screen').classList.add('active-view');
}

function updateUpdateICUCount(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const current = parseInt(el.textContent) || 0;
    const next = Math.max(0, current + delta);
    el.textContent = next;
    syncMinusButtonColor(id);
}

function confirmICUUpdate() {
    if (currentUpdateICUIndex === -1) return;
    const getCount = (id) => parseInt(document.getElementById(id)?.textContent) || 0;
    const contact = document.getElementById('upd-icu-contact').value.trim();
    
    const icu = hospitalICUs[currentUpdateICUIndex];
    icu.totalBeds = getCount('upd-icu-total');
    icu.vacantBeds = getCount('upd-icu-vacant');
    icu.ventBeds = getCount('upd-icu-vent');
    icu.noVentBeds = getCount('upd-icu-novent');
    icu.contact = contact;
    
    persistHospitalData();

    renderDashboard();
    goBackToDashboardFromUpdate();
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
        // Optionally style the first item's border to match reference exactly, or leave as default
        return `
        <div class="temp-icu-card">
            <span class="temp-icu-card-name">${i + 1}. ${names}</span>
            <button class="temp-icu-del" onclick="deleteICU(${i})"><svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg></button>
        </div>`;
    }).join('');
}

// ── Language Selection ─────────────────────────────────
const languages = [
    { id: 'en', name: 'English' },
    { id: 'hi', name: 'हिंदी' },
    { id: 'bn', name: 'বাংলা' },
    { id: 'mr', name: 'मराठी' },
    { id: 'te', name: 'తెలుగు' },
    { id: 'gu', name: 'ગુજરાતી' },
    { id: 'ta', name: 'தமிழ்' },
    { id: 'kn', name: 'ಕನ್ನಡ' },
    { id: 'ml', name: 'മലയാളം' },
    { id: 'pa', name: 'ਪੰਜਾਬੀ' }
];


let patientLangId = localStorage.getItem('patientLangId') || 'en';

function triggerGoogleTranslate(langCode) {
    const select = document.querySelector('.goog-te-combo');
    if (select && select.value !== langCode) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    }
}

let currentLangContext = 'patient';

function goToPatientLanguageScreen() {
    currentLangContext = 'patient';
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('patient-language-screen').classList.add('active-view');
    renderPatientLanguageOptions();
}

function goBackFromPatientLanguage() {
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('patient-hospitals-screen').classList.add('active-view');
}

function renderPatientLanguageOptions() {
    const list = document.getElementById('patient-lang-options-list');
    
    const selectedLang = languages.find(l => l.id === patientLangId) || languages[0];
    document.getElementById('patient-lang-selected-text').textContent = selectedLang.name;

    list.innerHTML = languages.map(lang => {
        const isSelected = lang.id === patientLangId;
        return `
            <div class="lang-option ${isSelected ? 'selected' : ''}" onclick="selectPatientLanguage('${lang.id}')">
                <span>${lang.name}</span>
                ${isSelected ? '<svg class="svg-icon lang-check-icon" viewBox="0 0 24 24" width="24px" height="24px" fill="#2b84f0"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.2 14.6l-4.4-4.4 1.4-1.4 3 3 6.6-6.6 1.4 1.4z"/></svg>' 
                : '<div class="lang-radio-circle" style="border-color: #2b84f0;"></div>'}
            </div>
        `;
    }).join('');
}

function selectPatientLanguage(langId) {
    patientLangId = langId;
    renderPatientLanguageOptions();
}

function savePatientLanguage() {
    localStorage.setItem('patientLangId', patientLangId);
    
    const selector = document.querySelector('.patient-lang-selector');
    if (selector) {
        selector.innerHTML = getLangCodeDisplay(patientLangId) + ' <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    }

    triggerGoogleTranslate(patientLangId);
    goBackFromPatientLanguage();
}


// ── App Initialization & State Restoration ────────────────
window.addEventListener('DOMContentLoaded', () => {
    // Restore state if we just reloaded to clear translation
    if (sessionStorage.getItem('returnToLanguage') === 'true') {
        sessionStorage.removeItem('returnToLanguage');
        
        const savedICUs = sessionStorage.getItem('hospitalICUs');
        if (savedICUs) {
            try {
                hospitalICUs = JSON.parse(savedICUs);
                renderCIICUList();
            } catch(e) {}
        }

        // Hide all screens and show change info directly
        document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
        document.getElementById('change-info-screen').classList.add('active-view');
        
        // Ensure language is set back to English visually
        const btn = document.querySelector('.ci-lang-selector');
        if(btn) {
            btn.innerHTML = `ENG <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>`;
        }
    }
});

function onLangSearch(val) {
    renderLanguageOptions(val);
}

// Expose openAmbCallModal to window for inline onclick handler
window.openAmbCallModal = function(contactNumber) {
    document.getElementById('hosp-amb-number').innerText = '+91 ' + contactNumber.replace('+91', '').trim();
    document.getElementById('hosp-amb-link').href = 'tel:' + contactNumber;
    document.getElementById('ambulance-call-modal').classList.add('open');
};

window.closeAmbCallModal = function() {
    document.getElementById('ambulance-call-modal').classList.remove('open');
};
