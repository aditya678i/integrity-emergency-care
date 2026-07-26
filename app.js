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

// Canvas logic removed because we now use a direct img tag with CSS animations for the splash logo.

// Patient Flow Functions
let selectedEmergencyType = null;

function selectEmergencyType(element, type) {
    const items = document.querySelectorAll('.emergency-item');
    items.forEach(item => item.classList.remove('selected'));
    element.classList.add('selected');
    selectedEmergencyType = type;
    
    const confirmBtn = document.getElementById('confirm-emergency-btn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
    }
}

function confirmEmergency() {
    if (selectedEmergencyType) {
        goToPatientHospitals(selectedEmergencyType);
    }
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
                opt.onclick = () => {
                    selectState(state);
                    if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
                };
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
                opt.onclick = () => {
                    selectCiState(state);
                    if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
                };
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
        opt.onclick = () => {
            selectCity(city);
            if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
        };
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
        opt.onclick = () => {
            selectCiCity(city);
            if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
        };
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
    triggerGoogleTranslate(patientLangId);
    const roleScreen = document.getElementById('role-screen');
    const hospitalScreen = document.getElementById('hospital-register-screen');
    const verifyScreen = document.getElementById('hospital-verification-screen');
    const loginScreen = document.getElementById('hospital-login-screen');
    const changeInfoScreen = document.getElementById('change-info-screen');
    
    if (roleScreen) roleScreen.classList.remove('active-view');
    if (verifyScreen) verifyScreen.classList.remove('active-view');
    if (loginScreen) loginScreen.classList.remove('active-view');
    if (changeInfoScreen) changeInfoScreen.classList.remove('active-view');
    
    if (hospitalScreen) {
        hospitalScreen.classList.add('active-view');
    }
}

function goToRoleScreen() {
    // Hide all possible current screens and show role screen
    ['hospital-register-screen', 'hospital-dashboard-screen', 'change-info-screen', 'hospital-login-screen'].forEach(id => {
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
        const totalBedsEl = document.getElementById('total-nearby-beds');
        if (totalBedsEl) {
            totalBedsEl.textContent = '...';
        }
        
        requestPatientLocation();
    }
}

function requestPatientLocation() {
    const locCity = document.querySelector('.patient-location-header .loc-city');
    const locAddress = document.querySelector('.patient-location-header .loc-full-address');
    if (!locCity || !locAddress) return;

    if (navigator.geolocation) {
        locCity.textContent = "Requesting...";
        locAddress.textContent = "Waiting for permission...";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                locCity.textContent = "Fetching...";
                locAddress.textContent = "Getting address details...";
                
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
                            // Extract state for the big text
                            const state = data.address.state || data.address.state_district || data.address.city || data.address.town || data.address.county || data.address.region || "Unknown State";
                            locCity.textContent = state;
                            
                            // Extract full address for the small text
                            locAddress.textContent = data.display_name;
                        } else {
                            locCity.textContent = "Location";
                            locAddress.textContent = "Unknown location";
                        }
                    })
                    .catch(err => {
                        console.error('Reverse geocoding error:', err);
                        locCity.textContent = "Error";
                        locAddress.textContent = "Location details unavailable";
                    });
            },
            (error) => {
                console.error('Geolocation error:', error);
                locCity.textContent = "Location Denied";
                locAddress.textContent = "Using fallback location";
                
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
                            const state = data.address.state || data.address.state_district || data.address.city || data.address.town || data.address.county || data.address.region || "Unknown State";
                            locCity.textContent = state;
                            locAddress.textContent = data.display_name;
                        }
                    });
            },
            { timeout: 10000 }
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
    if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
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
    if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
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
function goToDashboard(skipHideRegScreen = false) {
    triggerGoogleTranslate(patientLangId);
    // Collect registration data
    const hospNameEl = document.getElementById('hosp-name');
    if (hospNameEl && hospNameEl.value) hospitalProfile.name = hospNameEl.value.trim();
    if (!hospitalProfile.name) hospitalProfile.name = 'My Hospital';
    
    const typeDisplay = document.getElementById('hosp-type-display');
    if (typeDisplay && typeDisplay.classList.contains('has-values')) {
        hospitalProfile.type = typeDisplay.textContent;
    }
    
    const emailEl = document.getElementById('hosp-reg-email');
    if (emailEl && emailEl.value) {
        hospitalProfile.email = emailEl.value.trim(); // Save email to profile
    } else {
        hospitalProfile.email = localStorage.getItem('hospitalRegEmail') || '';
    }

    const stateDisplay = document.getElementById('hosp-state-display');
    if (stateDisplay && stateDisplay.classList.contains('has-values')) hospitalProfile.state = stateDisplay.textContent;
    
    const cityDisplay = document.getElementById('hosp-city-display');
    if (cityDisplay && cityDisplay.classList.contains('has-values')) hospitalProfile.city = cityDisplay.textContent;

    const pinEl = document.getElementById('hosp-pin');
    if (pinEl && pinEl.value) hospitalProfile.pin = pinEl.value.trim();

    const addressEl = document.getElementById('hosp-address');
    if (addressEl && addressEl.value) hospitalProfile.address = addressEl.value.trim();

    const adminCodeInput = document.getElementById('hosp-admin-code');
    if (adminCodeInput && adminCodeInput.value) {
        localStorage.setItem('hospitalAdminCode', adminCodeInput.value);
    }
        
    persistHospitalData();

    const hospRegScreen = document.getElementById('hospital-register-screen');
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    if (hospRegScreen && dashScreen) {
        if (!skipHideRegScreen) hospRegScreen.classList.remove('active-view');
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
    
    // Pre-populate fields from hospitalProfile
    const hospNameEl = document.getElementById('ci-hosp-name');
    if (hospNameEl) hospNameEl.value = hospitalProfile.name && hospitalProfile.name !== 'My Hospital' ? hospitalProfile.name : '';

    const emailEl = document.getElementById('ci-hosp-email');
    if (emailEl) emailEl.value = hospitalProfile.email || localStorage.getItem('hospitalRegEmail') || '';
    
    ciEmailVerified = false;
    const sendOtpBtn = document.getElementById('ci-btn-send-otp');
    if (sendOtpBtn) {
        sendOtpBtn.style.display = 'none';
        sendOtpBtn.textContent = 'Send OTP';
        sendOtpBtn.style.background = '#C0202A';
        sendOtpBtn.disabled = false;
    }
    const otpSection = document.getElementById('ci-otp-section');
    if (otpSection) otpSection.style.display = 'none';
    const otpInput = document.getElementById('ci-hosp-otp');
    if (otpInput) otpInput.value = '';

    const typeDisplay = document.getElementById('ci-hosp-type-display');
    const typeOpts = document.getElementById('ci-hosp-type-options');
    if (typeDisplay && typeOpts) {
        typeOpts.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        if (hospitalProfile.type) {
            typeDisplay.textContent = hospitalProfile.type;
            typeDisplay.classList.add('has-values');
            const types = hospitalProfile.type.split(', ');
            types.forEach(t => {
                const cb = typeOpts.querySelector(`input[value="${t}"]`);
                if (cb) cb.checked = true;
            });
        } else {
            typeDisplay.textContent = 'Hospital Type';
            typeDisplay.classList.remove('has-values');
        }
    }

    const stateDisplay = document.getElementById('ci-hosp-state-display');
    if (stateDisplay) {
        if (hospitalProfile.state) {
            stateDisplay.textContent = hospitalProfile.state;
            stateDisplay.classList.add('has-values');
        } else {
            stateDisplay.textContent = 'State';
            stateDisplay.classList.remove('has-values');
        }
    }

    const cityDisplay = document.getElementById('ci-hosp-city-display');
    if (cityDisplay) {
        if (hospitalProfile.city) {
            cityDisplay.textContent = hospitalProfile.city;
            cityDisplay.classList.add('has-values');
        } else {
            cityDisplay.textContent = 'City';
            cityDisplay.classList.remove('has-values');
        }
    }

    const pinEl = document.getElementById('ci-hosp-pin');
    if (pinEl) pinEl.value = hospitalProfile.pin || '';

    const addressEl = document.getElementById('ci-hosp-address');
    if (addressEl) addressEl.value = hospitalProfile.address || '';

    const preview = document.getElementById('ci-photo-preview');
    const content = document.getElementById('ci-upload-content');
    if (hospitalProfile.photo) {
        if (preview && content) {
            preview.style.backgroundImage = `url(${hospitalProfile.photo})`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.style.border = 'none';
            content.style.display = 'none';
        }
    } else {
        if (preview && content) {
            preview.style.backgroundImage = '';
            preview.style.border = 'none';
            content.style.display = 'flex';
        }
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

    // Set hospital name
    const name = hospitalProfile.name || 'My Hospital';
    nameEl.textContent = name;

    if (typeEl) typeEl.textContent = hospitalProfile.type;

    // Show/hide empty state
    if (hospitalICUs.length === 0) {
        emptyState.style.display = 'flex';
        icuList.innerHTML = '';
        
        // Show lock icon if verification is pending
        const lockIcon = document.getElementById('verification-lock-icon');
        if (lockIcon) {
            lockIcon.style.display = localStorage.getItem('verificationPending') === 'true' ? 'flex' : 'none';
        }
    } else {
        emptyState.style.display = 'none';
        icuList.innerHTML = hospitalICUs.map((icu, i) => buildICUCard(icu, i)).join('');
    }
}

function timeAgo(timestamp) {
    if (!timestamp) return 'Just now';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " mins ago";
    return "Just now";
}

function buildICUCard(icu, index) {
    const names = Array.isArray(icu.names) ? icu.names.join(' + ') : icu.name;
    const updateTimeStr = timeAgo(icu.updatedAt);
    return `
    <div style="margin-bottom: 32px;">
        <!-- Title -->
        <h3 style="color: #000; font-family: var(--font); font-size: 1.3rem; font-weight: 800; text-transform: uppercase; margin: 0 0 12px 16px;">
            ${names}
        </h3>
        <!-- Card -->
        <div style="background: #F5F5F5; border-radius: 10px; padding: 28px 24px 24px 24px;">
            <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.totalBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.vacantBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant<br>(with ventilator)</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.ventBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Total ICU Beds Vacant<br>(without ventilator)</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.noVentBeds || '0'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Emergency Number</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.contact || '-'}</div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px;">
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem; line-height: 1.3;">Ambulance Number</div>
                    <div style="color: #000; font-family: var(--font); font-weight: 800; font-size: 1.05rem;">${icu.ambulanceNumber || '-'}</div>
                </div>
            </div>
            
            <button onclick="editICUFromDash(${index})" style="width: 100%; background: #C0202A; color: #fff; font-family: var(--font); font-size: 1.25rem; font-weight: 600; padding: 14px 24px; border: none; border-radius: 20px; cursor: pointer; transition: opacity 0.2s; -webkit-tap-highlight-color: transparent;" onmousedown="this.style.opacity='0.7'" onmouseup="this.style.opacity='1'" onmouseleave="this.style.opacity='1'">
                Update
            </button>
            
            <div style="text-align: right; margin-top: 16px; font-family: var(--font); font-size: 0.85rem; font-weight: 600; color: #888;">
                Last updated: ${updateTimeStr}
            </div>
        </div>
    </div>`;
}

// ── Change Info: Save & Email OTP ─────────────────────────────────
let ciEmailVerified = false;

function checkEmailChange() {
    const emailEl = document.getElementById('ci-hosp-email');
    const sendOtpBtn = document.getElementById('ci-btn-send-otp');
    const otpSection = document.getElementById('ci-otp-section');
    const originalEmail = hospitalProfile.email || localStorage.getItem('hospitalRegEmail') || '';
    
    if (emailEl && sendOtpBtn) {
        if (emailEl.value.trim() !== originalEmail) {
            sendOtpBtn.style.display = 'block';
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.style.background = '#C0202A';
            sendOtpBtn.disabled = false;
            ciEmailVerified = false;
        } else {
            sendOtpBtn.style.display = 'none';
            if (otpSection) otpSection.style.display = 'none';
            ciEmailVerified = false;
        }
    }
}

function sendCIOTP() {
    const email = document.getElementById('ci-hosp-email').value.trim();
    if (!email) {
        alert("Please enter a valid email address.");
        return;
    }
    const sendOtpBtn = document.getElementById('ci-btn-send-otp');
    if (sendOtpBtn) {
        sendOtpBtn.textContent = 'Sent!';
        sendOtpBtn.disabled = true;
    }
    const otpSection = document.getElementById('ci-otp-section');
    if (otpSection) otpSection.style.display = 'block';
    
    // Simulate OTP sent
    setTimeout(() => {
        alert("OTP for verification is: 1234");
    }, 500);
}

function verifyCIOTP() {
    const otpInput = document.getElementById('ci-hosp-otp');
    if (otpInput && otpInput.value === '1234') {
        ciEmailVerified = true;
        const otpSection = document.getElementById('ci-otp-section');
        if (otpSection) otpSection.style.display = 'none';
        
        const sendOtpBtn = document.getElementById('ci-btn-send-otp');
        if (sendOtpBtn) {
            sendOtpBtn.textContent = 'Verified ✓';
            sendOtpBtn.style.background = '#4CAF50';
        }
        alert("Email verified successfully! You can now log in with this email.");
    } else {
        alert("Invalid OTP. Please try again.");
    }
}

function saveChangeInfo() {
    const nameEl = document.getElementById('ci-hosp-name');
    if (nameEl && nameEl.value.trim()) hospitalProfile.name = nameEl.value.trim();
    
    const typeDisplay = document.getElementById('ci-hosp-type-display');
    if (typeDisplay && typeDisplay.classList.contains('has-values')) {
        hospitalProfile.type = typeDisplay.textContent;
    }
    
    const emailEl = document.getElementById('ci-hosp-email');
    if (emailEl) {
        const newEmail = emailEl.value.trim();
        const originalEmail = hospitalProfile.email || localStorage.getItem('hospitalRegEmail') || '';
        if (newEmail !== originalEmail) {
            if (!ciEmailVerified) {
                alert("Please verify your new email address using OTP before saving.");
                return; // Stop saving
            }
            hospitalProfile.email = newEmail;
            localStorage.setItem('hospitalRegEmail', newEmail);
        }
    }
    
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
        const content = document.getElementById('ci-upload-content');
        if (preview && content) {
            preview.style.backgroundImage = `url(${e.target.result})`;
            preview.style.backgroundSize = 'cover';
            preview.style.backgroundPosition = 'center';
            preview.style.border = 'none';
            content.style.display = 'none';
        }
    };
    reader.readAsDataURL(file);
}

// ── ICU Management Screen ────────────────────────────
let undoTimeout = null;
let deletedICUData = null;
let deletedICUIndex = -1;
let addICUSource = 'change-info';

function closeVerificationModal() {
    const modal = document.getElementById('verification-pending-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

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
    const ambulanceEl = document.getElementById('add-icu-ambulance');
    if (ambulanceEl) ambulanceEl.value = '';
    
    // Reset Emergency Conditions
    currentICUConditions = [];
    const conditionsText = document.getElementById('add-icu-conditions-text');
    if (conditionsText) conditionsText.textContent = 'Emergency Conditions Treated';
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
        renderDashboard();
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
    const ambulanceEl = document.getElementById('add-icu-ambulance');
    const ambulanceNumber = ambulanceEl ? ambulanceEl.value.trim() : '';

    const icuObj = {
        names: [name],
        name: name,
        contact: contact,
        ambulanceNumber: ambulanceNumber,
        conditions: [...currentICUConditions],
        totalBeds:  getCount('add-icu-total'),
        vacantBeds: getCount('add-icu-vacant'),
        ventBeds:   getCount('add-icu-vent'),
        noVentBeds: getCount('add-icu-novent'),
        updatedAt: Date.now()
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
    document.getElementById('upd-icu-ambulance').value = icu.ambulanceNumber || '';

    currentUpdateICUConditions = Array.isArray(icu.conditions) ? [...icu.conditions] : [];
    const textEl = document.getElementById('upd-icu-conditions-text');
    if (textEl) {
        if (currentUpdateICUConditions.length === 0) {
            textEl.textContent = 'Emergency Conditions Treated';
        } else if (currentUpdateICUConditions.length === 1) {
            textEl.textContent = '1 Condition Selected';
        } else {
            textEl.textContent = `${currentUpdateICUConditions.length} Conditions Selected`;
        }
    }

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
    const ambulanceNumber = document.getElementById('upd-icu-ambulance').value.trim();
    
    const icu = hospitalICUs[currentUpdateICUIndex];
    icu.totalBeds = getCount('upd-icu-total');
    icu.vacantBeds = getCount('upd-icu-vacant');
    icu.ventBeds = getCount('upd-icu-vent');
    icu.noVentBeds = getCount('upd-icu-novent');
    icu.contact = contact;
    icu.ambulanceNumber = ambulanceNumber;
    icu.conditions = [...currentUpdateICUConditions];
    icu.updatedAt = Date.now();
    
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
        return `
        <div style="background: #fff; border-radius: 12px; padding: 14px 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
            <span style="font-family: var(--font); font-size: 1.05rem; font-weight: 500; color: #000;">${i + 1}. ${names}</span>
            <button onclick="deleteICU(${i})" style="background: #C0202A; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer;">
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="4" fill="none"><path d="M5 12h14"/></svg>
            </button>
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
    
    // Toggle notranslate for specific Hindi words so they stay Hindi when English is selected,
    // but can be translated into regional languages.
    const elementsToProtect = [
        document.querySelector('.role-title-hi'),
        document.querySelector('#patient-select-btn .card-label-hi'),
        document.querySelector('#hospital-select-btn .card-label-hi')
    ];
    
    elementsToProtect.forEach(el => {
        if (!el) return;
        if (langCode === 'en' || langCode === '') {
            el.classList.add('notranslate');
        } else {
            el.classList.remove('notranslate');
        }
    });

    if (select && select.value !== langCode) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    }
}

let currentLangContext = 'patient';

let previousScreenBeforeLanguage = null;

function goToPatientLanguageScreen() {
    currentLangContext = 'patient';
    const activeScreen = document.querySelector('.screen-view.active-view');
    if (activeScreen) {
        previousScreenBeforeLanguage = activeScreen.id;
    } else {
        previousScreenBeforeLanguage = 'role-screen';
    }
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('patient-language-screen').classList.add('active-view');
    renderPatientLanguageOptions();
}

function goBackFromPatientLanguage() {
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    if (previousScreenBeforeLanguage) {
        document.getElementById(previousScreenBeforeLanguage).classList.add('active-view');
    } else {
        document.getElementById('patient-hospitals-screen').classList.add('active-view');
    }
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
                : '<div class="lang-radio-circle" style="border-color: #93c5fd;"></div>'}
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

// --- Mock OTP Logic ---
let currentMockOTP = null;

function sendOTP() {
    const emailInput = document.getElementById('hosp-reg-email');
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }

    // Generate random 4-digit OTP
    currentMockOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Show OTP input section
    document.getElementById('otp-section').style.display = 'block';
    
    // Check overall form validity
    if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();

    // Show mock alert for the user
    alert(`Mock Email Sent to ${email}\n\nYour OTP is: ${currentMockOTP}\n\n(Note: In a real app, this would be sent via EmailJS or a backend server.)`);
}

function verifyOTPAndRegister() {
    /* TEMPORARILY DISABLED
    const enteredOTP = document.getElementById('hosp-reg-otp').value.trim();
    if (enteredOTP !== currentMockOTP) {
        alert('Invalid OTP. Please try again.');
        return;
    }
    */
    
    // Save email explicitly to localStorage
    const emailInput = document.getElementById('hosp-reg-email');
    if (emailInput && emailInput.value) {
        localStorage.setItem('hospitalRegEmail', emailInput.value.trim());
    }
    
    // If successful, proceed to verification screen
    alert('OTP Verified successfully!');
    goToVerification();
}

function goToVerification() {
    triggerGoogleTranslate(patientLangId);
    const hospRegScreen = document.getElementById('hospital-register-screen');
    const verifyScreen = document.getElementById('hospital-verification-screen');
    if (hospRegScreen && verifyScreen) {
        hospRegScreen.classList.remove('active-view');
        verifyScreen.classList.add('active-view');
    }
}

function handleCertUpload(event) {
    const file = event.target.files[0];
    if (file) {
        // Show file name
        const fileNameDiv = document.getElementById('upload-file-name');
        if (fileNameDiv) {
            fileNameDiv.textContent = 'Uploaded: ' + file.name;
            fileNameDiv.style.display = 'block';
        }
        
        // Enable Continue button
        const continueBtn = document.getElementById('btn-verify-continue');
        if (continueBtn) {
            continueBtn.style.opacity = '1';
            continueBtn.style.pointerEvents = 'auto';
            continueBtn.style.background = '#B22222';
            continueBtn.style.color = '#fff';
        }
    }
}

function continueToDashboardFromVerify() {
    // Set pending verification flag
    localStorage.setItem('verificationPending', 'true');
    
    const verifyScreen = document.getElementById('hospital-verification-screen');
    const dashScreen = document.getElementById('hospital-dashboard-screen');
    
    if (verifyScreen && dashScreen) {
        verifyScreen.classList.remove('active-view');
        
        // Reuse goToDashboard logic to collect admin code, etc
        goToDashboard(true); // true means skip hiding register screen since it's already hidden
    }
}

// ---------------------------------------------------------
// Hospital Admin Code & Login Logic
// ---------------------------------------------------------

function generateAdminCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'HOSP-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('hosp-admin-code');
    if (input) {
        input.value = code;
        const copyBtn = document.getElementById('btn-copy-code');
        if (copyBtn) copyBtn.style.display = 'inline-flex';
        
        if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
        
        const generateBtn = document.getElementById('btn-generate-code');
        if (generateBtn) generateBtn.style.display = 'none';
    }
}

function copyAdminCode() {
    const input = document.getElementById('hosp-admin-code');
    if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
            alert('Admin Code copied to clipboard: ' + input.value);
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    }
}

function goToHospitalLogin() {
    const hospRegScreen = document.getElementById('hospital-register-screen');
    const hospLoginScreen = document.getElementById('hospital-login-screen');
    if (hospRegScreen && hospLoginScreen) {
        hospRegScreen.classList.remove('active-view');
        hospLoginScreen.classList.add('active-view');
    }
}

function loginWithAdminCode() {
    /* TEMPORARILY DISABLED
    const input = document.getElementById('login-admin-code');
    if (!input || !input.value.trim()) {
        alert('Please enter your Admin Code.');
        return;
    }
    const storedCode = localStorage.getItem('hospitalAdminCode');
    if (storedCode && input.value.trim().toUpperCase() === storedCode) {
    */
        const hospLoginScreen = document.getElementById('hospital-login-screen');
        const dashScreen = document.getElementById('hospital-dashboard-screen');
        if (hospLoginScreen && dashScreen) {
            hospLoginScreen.classList.remove('active-view');
            dashScreen.classList.add('active-view');
            renderDashboard();
        }
    /* TEMPORARILY DISABLED
    } else {
        alert('Code is illegal or not registered in our database.');
    }
    */
}

function goBackToHospitalRegister() {
    const hospLoginScreen = document.getElementById('hospital-login-screen');
    const hospRegScreen = document.getElementById('hospital-register-screen');
    if (hospRegScreen && hospLoginScreen) {
        hospLoginScreen.classList.remove('active-view');
        hospRegScreen.classList.add('active-view');
    }
}

// ---------------------------------------------------------
// Forgot Admin Code Logic
// ---------------------------------------------------------

function goToForgotCode() {
    const hospLoginScreen = document.getElementById('hospital-login-screen');
    const forgotCodeScreen = document.getElementById('forgot-code-screen');
    if (hospLoginScreen && forgotCodeScreen) {
        hospLoginScreen.classList.remove('active-view');
        forgotCodeScreen.classList.add('active-view');
        
        // Reset form
        document.getElementById('forgot-code-email').value = '';
        document.getElementById('forgot-code-result').style.display = 'none';
        document.getElementById('btn-generate-forgot-code').style.display = 'block';
    }
}

function goBackToHospitalLogin() {
    const forgotCodeScreen = document.getElementById('forgot-code-screen');
    const hospLoginScreen = document.getElementById('hospital-login-screen');
    if (forgotCodeScreen && hospLoginScreen) {
        forgotCodeScreen.classList.remove('active-view');
        hospLoginScreen.classList.add('active-view');
    }
}

function handleForgotCodeGenerate() {
    const emailInput = document.getElementById('forgot-code-email').value.trim();
    if (!emailInput || !emailInput.includes('@')) {
        alert('Please enter a valid email address.');
        return;
    }

    const regEmail = localStorage.getItem('hospitalRegEmail');
    if (!regEmail || regEmail.toLowerCase() !== emailInput.toLowerCase()) {
        alert('Email not found in our records. Please ensure it matches the one used during registration.');
        return;
    }

    // Generate new code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'HOSP-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Update local storage
    localStorage.setItem('hospitalAdminCode', code);

    // Animate button
    const btn = document.getElementById('btn-generate-forgot-code');
    const btnHeight = btn.offsetHeight;
    
    // Prepare button for transition
    btn.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
    btn.style.whiteSpace = 'nowrap';
    btn.style.overflow = 'hidden';
    
    // Start animation (shrink and hide text) AT THE SAME TIME as showing the code
    btn.style.color = 'transparent';
    btn.style.width = btnHeight + 'px';
    btn.style.height = btnHeight + 'px';
    btn.style.minWidth = btnHeight + 'px';
    btn.style.borderRadius = '50%';
    btn.style.padding = '0';
    btn.style.margin = '32px auto 0 auto';
    btn.style.animation = 'none'; // Clear pulse
    btn.onclick = null; // Disable click during transition
    
    // Show result immediately!
    const newCodeInput = document.getElementById('new-generated-code');
    if (newCodeInput) newCodeInput.value = code;
    
    const resultDiv = document.getElementById('forgot-code-result');
    resultDiv.style.opacity = '0';
    resultDiv.style.display = 'block';
    resultDiv.style.transition = 'opacity 0.4s ease';
    void resultDiv.offsetWidth; // Reflow
    resultDiv.style.opacity = '1';

    setTimeout(() => {
        // Show tick
        btn.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: scale(0); transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); margin: 0 auto; display: block;"><path d="M20 6L9 17l-5-5"/></svg>`;
        void btn.offsetWidth;
        const svg = btn.querySelector('svg');
        if(svg) svg.style.transform = 'scale(1)';
        
        // Wait 2 seconds with the tick
        setTimeout(() => {
            // Expand to Confirm button
            btn.style.width = '100%';
            btn.style.height = 'auto';
            btn.style.minWidth = '0';
            btn.style.borderRadius = '999px';
            btn.style.padding = '16px';
            
            // Hide tick, show text
            btn.innerHTML = 'Confirm';
            btn.style.color = '#fff';
            
            // Allow click to confirm
            btn.onclick = function() {
                goBackToHospitalLogin();
                const loginInput = document.getElementById('login-admin-code');
                if (loginInput) loginInput.value = code;
                
                // Reset button back to original state for next time
                setTimeout(() => {
                    btn.innerHTML = 'Generate New Code';
                    btn.style = 'margin-top: 32px; transition: all 0.4s ease; display: block; width: 100%; padding: 16px; border-radius: 999px; background: #B22222; color: #fff; font-family: var(--font); font-size: 1.1rem; font-weight: 600; border: none; cursor: pointer;';
                    btn.onclick = handleForgotCodeGenerate;
                    document.getElementById('forgot-code-result').style.display = 'none';
                }, 500);
            };
        }, 2000);
    }, 400); // Wait for shrink to finish before showing tick
}

function copyNewAdminCode() {
    const input = document.getElementById('new-generated-code');
    if (input && input.value) {
        navigator.clipboard.writeText(input.value).then(() => {
            alert('New Admin Code copied to clipboard: ' + input.value);
        }).catch(err => {
            alert('Failed to copy: ' + err);
        });
    }
}

function openLanguageMenu() {
    // Instead of opening a new menu, navigate to the patient language screen
    goToPatientLanguageScreen();
}

// ==========================================
// EMERGENCY CONDITIONS LOGIC
// ==========================================

var currentICUConditions = [];
var currentUpdateICUConditions = [];

const ALL_EMERGENCY_CONDITIONS = [
    { id: 'brain', title: 'Brain', sub: 'Stroke, Seizure, Trauma, etc.' },
    { id: 'asthma', title: 'Asthma', sub: 'Severe Attacks, Respiratory Failure, etc.' },
    { id: 'accident', title: 'Accident', sub: 'Trauma, Fractures, Internal Injury, etc.' },
    { id: 'lungs', title: 'Lungs', sub: 'Pneumonia, COPD, Embolism, etc.' },
    { id: 'bleeding', title: 'Bleeding', sub: 'Internal Hemorrhage, Trauma, etc.' },
    { id: 'burns', title: 'Burns', sub: 'Severe Thermal/Chemical Burns, etc.' },
    { id: 'pregnancy', title: 'Pregnancy', sub: 'Eclampsia, Complications, etc.' },
    { id: 'unconsciousness', title: 'Unconsciousness', sub: 'Coma, Shock, etc.' },
    { id: 'poisoning', title: 'Poisoning', sub: 'Toxin Ingestion, Overdose, etc.' }
];

function toggleConditionsDropdown() {
    const listEl = document.getElementById('icu-conditions-list');
    const dropdown = document.getElementById('add-icu-conditions-dropdown');
    const icon = document.getElementById('add-icu-conditions-icon');
    
    if (!listEl || !dropdown) return;
    
    if (dropdown.style.display === 'none') {
        // Generate list
        listEl.innerHTML = ALL_EMERGENCY_CONDITIONS.map(cond => {
            const isChecked = currentICUConditions.includes(cond.title) ? 'checked' : '';
            return `
                <label style="display: flex; align-items: flex-start; gap: 12px; font-family: var(--font); cursor: pointer; padding: 4px 0;">
                    <input type="checkbox" value="${cond.title}" class="icu-condition-checkbox" style="width: 20px; height: 20px; margin-top: 2px; accent-color: #EF4444;" onchange="saveConditions()" ${isChecked}>
                    <div>
                        <div style="font-weight: 800; font-size: 1.05rem; color: #000;">${cond.title}</div>
                        <div style="font-size: 0.85rem; color: #666;">(${cond.sub})</div>
                    </div>
                </label>
            `;
        }).join('');
        
        dropdown.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        dropdown.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

function saveConditions() {
    const checkboxes = document.querySelectorAll('.icu-condition-checkbox');
    currentICUConditions = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
        
    const textEl = document.getElementById('add-icu-conditions-text');
    if (textEl) {
        if (currentICUConditions.length === 0) {
            textEl.textContent = 'Emergency Conditions Treated';
        } else if (currentICUConditions.length === 1) {
            textEl.textContent = '1 Condition Selected';
        } else {
            textEl.textContent = `${currentICUConditions.length} Conditions Selected`;
        }
    }
}

function toggleUpdateConditionsDropdown() {
    const listEl = document.getElementById('upd-icu-conditions-list');
    const dropdown = document.getElementById('upd-icu-conditions-dropdown');
    const icon = document.getElementById('upd-icu-conditions-icon');
    
    if (!listEl || !dropdown) return;
    
    if (dropdown.style.display === 'none') {
        listEl.innerHTML = ALL_EMERGENCY_CONDITIONS.map(cond => {
            const isChecked = currentUpdateICUConditions.includes(cond.title) ? 'checked' : '';
            return `
                <label style="display: flex; align-items: flex-start; gap: 12px; font-family: var(--font); cursor: pointer; padding: 4px 0;">
                    <input type="checkbox" value="${cond.title}" class="upd-icu-condition-checkbox" style="width: 20px; height: 20px; margin-top: 2px; accent-color: #EF4444;" onchange="saveUpdateConditions()" ${isChecked}>
                    <div>
                        <div style="font-weight: 800; font-size: 1.05rem; color: #000;">${cond.title}</div>
                        <div style="font-size: 0.85rem; color: #666;">(${cond.sub})</div>
                    </div>
                </label>
            `;
        }).join('');
        
        dropdown.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
    } else {
        dropdown.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
}

function saveUpdateConditions() {
    const checkboxes = document.querySelectorAll('.upd-icu-condition-checkbox');
    currentUpdateICUConditions = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
        
    const textEl = document.getElementById('upd-icu-conditions-text');
    if (textEl) {
        if (currentUpdateICUConditions.length === 0) {
            textEl.textContent = 'Emergency Conditions Treated';
        } else if (currentUpdateICUConditions.length === 1) {
            textEl.textContent = '1 Condition Selected';
        } else {
            textEl.textContent = `${currentUpdateICUConditions.length} Conditions Selected`;
        }
    }
}

function openSearchScreen() {
    const hospitalsScreen = document.getElementById("patient-hospitals-screen");
    const searchScreen = document.getElementById("search-hospitals-screen");
    
    if (hospitalsScreen && searchScreen) {
        hospitalsScreen.classList.remove("active-view");
        searchScreen.classList.add("active-view");
        
        // Auto focus the input so mobile keyboard pops up
        setTimeout(() => {
            const searchInput = document.getElementById("active-hospital-search");
            if (searchInput) searchInput.focus();
        }, 100);
    }
}

function closeSearchScreen() {
    const hospitalsScreen = document.getElementById("patient-hospitals-screen");
    const searchScreen = document.getElementById("search-hospitals-screen");
    
    if (hospitalsScreen && searchScreen) {
        searchScreen.classList.remove("active-view");
        hospitalsScreen.classList.add("active-view");
        
        const searchInput = document.getElementById("active-hospital-search");
        if (searchInput) {
            searchInput.value = "";
            document.getElementById('search-results-container').innerHTML = '';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('active-hospital-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            if (query.length > 0) {
                const results = window.demoHospitals.filter(h => h.name.toLowerCase().includes(query));
                // Add fake distances
                results.forEach(hosp => {
                    if (!hosp.distance) hosp.distance = Number((Math.random() * (4.8 - 0.5) + 0.5).toFixed(1));
                });
                if (typeof renderDetailedHospitalCards === 'function') {
                    renderDetailedHospitalCards(results);
                }
            } else {
                document.getElementById('search-results-container').innerHTML = '';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const hospInputs = ['hosp-name', 'hosp-reg-email', 'hosp-reg-otp', 'hosp-pin', 'hosp-address', 'hosp-admin-code'];
    hospInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', () => {
            if (typeof window.checkHospFormValidity === 'function') window.checkHospFormValidity();
        });
    });
});

window.checkHospFormValidity = function() {
    const nameEl = document.getElementById('hosp-name');
    const typeEl = document.getElementById('hosp-type-display');
    const emailEl = document.getElementById('hosp-reg-email');
    const stateEl = document.getElementById('hosp-state-display');
    const cityEl = document.getElementById('hosp-city-display');
    const pinEl = document.getElementById('hosp-pin');
    const addressEl = document.getElementById('hosp-address');
    const adminCodeEl = document.getElementById('hosp-admin-code');
    const otpEl = document.getElementById('hosp-reg-otp');
    
    if (!nameEl || !typeEl || !emailEl || !stateEl || !cityEl || !pinEl || !addressEl || !adminCodeEl || !otpEl) return;

    const name = nameEl.value.trim();
    const type = typeEl.textContent;
    const email = emailEl.value.trim();
    const state = stateEl.textContent;
    const city = cityEl.textContent;
    const pin = pinEl.value.trim();
    const address = addressEl.value.trim();
    const adminCode = adminCodeEl.value.trim();
    const otp = otpEl.value.trim();
    
    const otpSection = document.getElementById('otp-section');
    const otpVisible = otpSection && otpSection.style.display !== 'none';
    
    const isValid = name !== '' && 
                    type !== 'Hospital Type' && 
                    email !== '' && 
                    state !== 'State' && 
                    city !== 'City' && 
                    pin.length === 6 &&
                    address !== '' &&
                    adminCode !== '' &&
                    otpVisible && 
                    otp.length === 4;

    const registerBtn = document.getElementById('btn-hosp-register');
    if (registerBtn) {
        if (isValid) {
            registerBtn.classList.remove('disabled');
            registerBtn.disabled = false;
        } else {
            registerBtn.classList.add('disabled');
            registerBtn.disabled = true;
        }
    }
};

