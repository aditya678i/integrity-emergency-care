// patient-hospitals.js

// Haversine formula to calculate distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;  
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
        ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
}

// DEMO MODE: Hardcoded premium list of 15 hospitals.
window.demoHospitals = [
    // Government
    { id: 101, name: "AIIMS (All India Institute of Medical Sciences)", lat: 28.5672, lon: 77.2100 },
    { id: 102, name: "Safdarjung Hospital", lat: 28.5686, lon: 77.2066 },
    { id: 103, name: "RML (Dr. Ram Manohar Lohia) Hospital", lat: 28.6253, lon: 77.1996 },
    { id: 104, name: "Lok Nayak Jai Prakash Narayan (LNJP) Hospital", lat: 28.6385, lon: 77.2394 },
    { id: 105, name: "GB Pant Hospital", lat: 28.6388, lon: 77.2371 },
    { id: 106, name: "Deen Dayal Upadhyay Hospital", lat: 28.6288, lon: 77.1121 },
    
    // Private / Clinics
    { id: 107, name: "Max Super Speciality Hospital", lat: 28.5280, lon: 77.2120 },
    { id: 108, name: "Apollo Indraprastha Hospital", lat: 28.5411, lon: 77.2842 },
    { id: 109, name: "Fortis Escorts Heart Institute", lat: 28.5583, lon: 77.2766 },
    { id: 110, name: "Medanta - The Medicity", lat: 28.4397, lon: 77.0427 },
    { id: 111, name: "BLK-Max Super Speciality Hospital", lat: 28.6429, lon: 77.1782 },
    { id: 112, name: "Sir Ganga Ram Hospital", lat: 28.6389, lon: 77.1895 },
    { id: 113, name: "Artemis Hospital", lat: 28.4326, lon: 77.0678 },
    { id: 114, name: "Apollo Spectra Clinic", lat: 28.5521, lon: 77.2435 },
    { id: 115, name: "Max Multi Speciality Clinic", lat: 28.5372, lon: 77.1993 }
];

async function fetchNearbyHospitals(lat, lon) {
    let premiumHospitals = JSON.parse(JSON.stringify(window.demoHospitals));

    // Assign fake "nearby" distances to simulate them being close
    premiumHospitals.forEach(hosp => {
        hosp.distance = Number((Math.random() * (4.8 - 0.5) + 0.5).toFixed(1));
    });

    // Sort by mock distance ascending
    premiumHospitals.sort((a, b) => a.distance - b.distance);

    // Give a short delay to simulate network load
    setTimeout(() => {
        renderHospitalCards(premiumHospitals, lat, lon);
    }, 600);
}

function renderHospitalCards(osmHospitals, userLat, userLon) {
    const container = document.getElementById('patient-hospitals-list');
    container.innerHTML = '';
    
    // We get currentPatientEmergencyType from app.js (e.g., 'Heart', 'Bleeding')
    const emergencyType = (typeof currentPatientEmergencyType !== 'undefined') ? currentPatientEmergencyType : 'Other';

    let totalAllVacantBeds = 0;

    osmHospitals.forEach((hosp, index) => {
        const nameLower = hosp.name.toLowerCase();
        const isGovt = nameLower.includes('govt') || nameLower.includes('government') || 
                       nameLower.includes('municipal') || nameLower.includes('state') || 
                       nameLower.includes('aiims') || nameLower.includes('safdarjung') ||
                       nameLower.includes('public');
        const hospTypeClass = isGovt ? 'type-govt' : 'type-private';
        
        // Mock data logic for presentation
        const totalBeds = Math.floor(Math.random() * 30) + 10; // 10 to 39
        const vacantBeds = Math.floor(Math.random() * totalBeds);
        const ventBeds = Math.floor(Math.random() * (vacantBeds + 1));
        const noVentBeds = vacantBeds - ventBeds;
        
        totalAllVacantBeds += vacantBeds;
        
        // Array of realistic hospital image URLs
        const hospitalImages = [
            "assets/hospitals/hosp1.jpeg",
            "assets/hospitals/hosp2.jpeg",
            "assets/hospitals/hosp3.jpeg",
            "assets/hospitals/hosp4.jpeg",
            "assets/hospitals/hosp5.jpeg",
            "assets/hospitals/hosp6.jpeg",
            "assets/hospitals/hosp7.jpeg",
            "assets/hospitals/hosp8.jpeg",
            "assets/hospitals/hosp9.jpeg",
            "assets/hospitals/hosp10.jpeg",
            "assets/hospitals/hosp11.jpeg",
            "assets/hospitals/hosp12.jpeg",
            "assets/hospitals/hosp13.jpeg",
            "assets/hospitals/hosp14.jpeg",
            "assets/hospitals/hosp15.jpeg",
            "assets/hospitals/hosp16.jpeg",
            "assets/hospitals/hosp17.jpeg",
            "assets/hospitals/hosp18.jpeg"
        ];
        
        // Randomly pick a realistic hospital photo based on index to keep it consistent
        const photoUrl = hospitalImages[(index + hosp.id) % hospitalImages.length];
        
        const updateTimes = ['15 min', '43 min', '1 hour', '2 hours', '45 min', '30 min', '10 min', '5 min', '20 min'];
        const randomTime = updateTimes[Math.floor(Math.random() * updateTimes.length)];
        
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${hosp.lat},${hosp.lon}`;
        const hospContact = '112';
        const telUrl = `tel:${hospContact}`;
        
        const card = document.createElement('div');
        card.className = `patient-hosp-card ${hospTypeClass}`;
        
        if (emergencyType === 'Other') {
            const icuTypes = [
                "Critical Care Medicine Unit",
                "Cardiology ICU (CCU)",
                "Neurology ICU (Neuro-ICU)",
                "Trauma & Emergency ICU",
                "Neonatal ICU (NICU)",
                "Burn Care Unit"
            ];
            
            let accordionsHTML = '';
            icuTypes.forEach((type, i) => {
                const accId = `acc-${hosp.id}-${i}`;
                const total = Math.floor(Math.random() * 20) + 5;
                const vacant = Math.floor(Math.random() * total);
                
                accordionsHTML += `
                    <div class="icu-accordion-item" style="margin-bottom: 8px;">
                        <div class="icu-accordion-btn" onclick="toggleIcuAccordion('${accId}')" style="background-color: #EBF5FF; color: #1E3A8A; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                            <span>${i+1}. ${type}</span>
                            <svg id="arrow-${accId}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                        <div id="${accId}" class="icu-accordion-content" style="display: none; background-color: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                            <div style="font-size: 0.85rem; color: #4B5563; display: flex; justify-content: space-between;">
                                <span>Total ICU Beds Vacant</span>
                                <span style="font-weight: 700; color: #1E3A8A;">${vacant} out of ${total}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            card.innerHTML = `
                <div class="hosp-card-header">
                    <div class="hosp-card-title">${hosp.name}</div>
                    <div class="hosp-card-distance">(${hosp.distance ? hosp.distance.toFixed(1) : '2.1'} km away)</div>
                </div>
                <div class="hosp-card-subtitle">${emergencyType} ICU</div>
                
                <img src="${photoUrl}" class="hosp-image" alt="Hospital Building" style="margin-bottom: 12px;" onerror="this.src='assets/logo.png'; this.style.objectFit='contain';">
                
                <div class="hosp-actions-row">
                    <a href="${telUrl}" class="hosp-btn-call" style="text-decoration: none;">
                        <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        Call hospital
                    </a>
                    <a href="${mapUrl}" target="_blank" class="hosp-btn-map" style="text-decoration: none;">
                        <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        Show Map
                    </a>
                </div>
                
                <div style="background-color: #ffffff; border-radius: 20px; padding: 16px; margin-top: 16px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                    <div style="margin-bottom: 12px; font-weight: 800; font-size: 1.1rem; color: #111;">Type of ICU</div>
                    <div class="icu-accordions-container">
                        ${accordionsHTML}
                    </div>
                </div>
                
                <button onclick="openAmbCallModal('${hospContact}')" class="hosp-btn-book" style="margin-top: 16px;">
                    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="6" width="12" height="10" rx="1.5"></rect>
                        <path d="M14 9h4l3 3v4h-7"></path>
                        <circle cx="7" cy="17" r="2"></circle>
                        <circle cx="17" cy="17" r="2"></circle>
                        <path d="M6 11h4M8 9v4"></path>
                    </svg>
                    Book Ambulance
                </button>
                <div class="hosp-last-updated">Last Updated : ${randomTime} ago</div>
            `;
        } else {
            const statsHTML = `
                <div class="icu-availability-header">
                    <div class="icu-title">Total ICU Beds Vacant</div>
                    <div class="icu-fraction">${vacantBeds}/${totalBeds}</div>
                </div>
                <div class="icu-white-card">
                    <div class="icu-col">
                        <div class="icu-col-title">With Ventilator</div>
                        <div class="icu-col-value">${ventBeds}</div>
                    </div>
                    <div class="icu-col">
                        <div class="icu-col-title">Without Ventilator</div>
                        <div class="icu-col-value">${noVentBeds}</div>
                    </div>
                </div>
            `;
            
            card.innerHTML = `
                <div class="hosp-card-header">
                    <div class="hosp-card-title">${hosp.name}</div>
                    <div class="hosp-card-distance">(${hosp.distance ? hosp.distance.toFixed(1) : '2.1'} km away)</div>
                </div>
                <div class="hosp-card-subtitle">${emergencyType} ICU</div>
                
                <img src="${photoUrl}" class="hosp-image" alt="Hospital Building" onerror="this.src='assets/logo.png'; this.style.objectFit='contain';">
                
                <div class="hosp-actions-row">
                    <a href="${telUrl}" class="hosp-btn-call" style="text-decoration: none;">
                        <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                        Call hospital
                    </a>
                    <a href="${mapUrl}" target="_blank" class="hosp-btn-map" style="text-decoration: none;">
                        <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        Show Map
                    </a>
                </div>
                
                <div class="icu-availability-card">
                    ${statsHTML}
                </div>
                
                <button onclick="openAmbCallModal('${hospContact}')" class="hosp-btn-book">
                    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="2" y="6" width="12" height="10" rx="1.5"></rect>
                        <path d="M14 9h4l3 3v4h-7"></path>
                        <circle cx="7" cy="17" r="2"></circle>
                        <circle cx="17" cy="17" r="2"></circle>
                        <path d="M6 11h4M8 9v4"></path>
                    </svg>
                    Book Ambulance
                </button>
                <div class="hosp-last-updated">Last Updated : ${randomTime} ago</div>
            `;
        }
        
        container.appendChild(card);
    });

    const totalBedsEl = document.getElementById('total-nearby-beds');
    if (totalBedsEl) {
        totalBedsEl.textContent = totalAllVacantBeds;
    }
}

window.switchHospTab = function(type) {
    const tabsContainer = document.getElementById("hosp-type-tabs");
    const listContainer = document.getElementById("patient-hospitals-list");
    if (!tabsContainer || !listContainer) return;
    
    tabsContainer.setAttribute("data-active", type);
    listContainer.setAttribute("data-active", type);
    
    const tabs = tabsContainer.querySelectorAll(".hosp-tab");
    tabs.forEach(tab => tab.classList.remove("active"));
    
    if (type === "govt") {
        tabs[0].classList.add("active");
    } else {
        tabs[1].classList.add("active");
    }
};

window.toggleIcuAccordion = function(id) {
    const content = document.getElementById(id);
    const arrow = document.getElementById('arrow-' + id);
    if (content.style.display === 'none' || content.style.display === '') {
        content.style.display = 'block';
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        arrow.style.transform = 'rotate(0deg)';
    }
};

window.renderDetailedHospitalCards = function(hospitals) {
    const container = document.getElementById('search-results-container');
    container.innerHTML = '';
    
    // Default emergency type for the top right badge (optional, or just hardcode 'Multi')
    const emergencyType = (typeof currentPatientEmergencyType !== 'undefined' && currentPatientEmergencyType !== 'Other') ? currentPatientEmergencyType : 'General';
    
    const icuTypes = [
        "Critical Care Medicine Unit",
        "Cardiology ICU (CCU)",
        "Neurology ICU (Neuro-ICU)",
        "Trauma & Emergency ICU",
        "Neonatal ICU (NICU)",
        "Burn Care Unit"
    ];

    hospitals.forEach((hosp, index) => {
        const nameLower = hosp.name.toLowerCase();
        const isGovt = nameLower.includes('govt') || nameLower.includes('government') || 
                       nameLower.includes('municipal') || nameLower.includes('state') || 
                       nameLower.includes('aiims') || nameLower.includes('safdarjung') ||
                       nameLower.includes('public');
        const hospTypeClass = isGovt ? 'type-govt' : 'type-private';
        
        // Real Photo using provided assets
        const hospitalImages = [
            "assets/hospitals/hosp1.jpeg",
            "assets/hospitals/hosp2.jpeg",
            "assets/hospitals/hosp3.jpeg",
            "assets/hospitals/hosp4.jpeg",
            "assets/hospitals/hosp5.jpeg",
            "assets/hospitals/hosp6.jpeg",
            "assets/hospitals/hosp7.jpeg",
            "assets/hospitals/hosp8.jpeg",
            "assets/hospitals/hosp9.jpeg",
            "assets/hospitals/hosp10.jpeg",
            "assets/hospitals/hosp11.jpeg",
            "assets/hospitals/hosp12.jpeg",
            "assets/hospitals/hosp13.jpeg",
            "assets/hospitals/hosp14.jpeg",
            "assets/hospitals/hosp15.jpeg",
            "assets/hospitals/hosp16.jpeg",
            "assets/hospitals/hosp17.jpeg",
            "assets/hospitals/hosp18.jpeg"
        ];
        const photoUrl = hospitalImages[(index + hosp.id) % hospitalImages.length];
        
        const updateTimes = ['15 min', '43 min', '1 hour', '2 hours', '45 min', '30 min', '10 min', '5 min', '20 min'];
        const randomTime = updateTimes[Math.floor(Math.random() * updateTimes.length)];
        
        const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${hosp.lat},${hosp.lon}`;
        const hospContact = '112';
        const telUrl = `tel:${hospContact}`;
        
        const card = document.createElement('div');
        card.className = `patient-hosp-card ${hospTypeClass}`;
        card.style.marginBottom = '20px';
        
        let accordionsHTML = '';
        icuTypes.forEach((type, i) => {
            const accId = `acc-${hosp.id}-${i}`;
            const total = Math.floor(Math.random() * 20) + 5;
            const vacant = Math.floor(Math.random() * total);
            
            accordionsHTML += `
                <div class="icu-accordion-item" style="margin-bottom: 8px;">
                    <div class="icu-accordion-btn" onclick="toggleIcuAccordion('${accId}')" style="background-color: #EBF5FF; color: #1E3A8A; padding: 12px 16px; border-radius: 8px; font-weight: 600; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;">
                        <span>${i+1}. ${type}</span>
                        <svg id="arrow-${accId}" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="transition: transform 0.3s;"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                    <div id="${accId}" class="icu-accordion-content" style="display: none; background-color: #fff; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px; margin-top: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="font-size: 0.85rem; color: #4B5563; display: flex; justify-content: space-between;">
                            <span>Total ICU Beds Vacant</span>
                            <span style="font-weight: 700; color: #1E3A8A;">${vacant} out of ${total}</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        card.innerHTML = `
            <div class="hosp-card-header">
                <div class="hosp-card-title">${hosp.name}</div>
                <div class="hosp-card-distance">(${hosp.distance || '2.1'} km away)</div>
            </div>
            <div class="hosp-card-subtitle">${emergencyType} ICU</div>
            
            <img src="${photoUrl}" class="hosp-image" alt="Hospital Building" style="margin-bottom: 12px;" onerror="this.src='assets/logo.png'; this.style.objectFit='contain';">
            
            <div class="hosp-actions-row">
                <a href="${telUrl}" class="hosp-btn-call" style="text-decoration: none;">
                    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    Call hospital
                </a>
                <a href="${mapUrl}" target="_blank" class="hosp-btn-map" style="text-decoration: none;">
                    <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Show Map
                </a>
            </div>

            <div style="background-color: #ffffff; border-radius: 20px; padding: 16px; margin-top: 16px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
                <div style="margin-bottom: 12px; font-weight: 800; font-size: 1.1rem; color: #111;">Type of ICU</div>
                <div class="icu-accordions-container">
                    ${accordionsHTML}
                </div>
            </div>
            
            <button onclick="openAmbCallModal('${hospContact}')" class="hosp-btn-book" style="margin-top: 16px;">
                <svg viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="6" width="12" height="10" rx="1.5"></rect>
                    <path d="M14 9h4l3 3v4h-7"></path>
                    <circle cx="7" cy="17" r="2"></circle>
                    <circle cx="17" cy="17" r="2"></circle>
                    <path d="M6 11h4M8 9v4"></path>
                </svg>
                Book Ambulance
            </button>
            <div class="hosp-last-updated">Last Updated : ${randomTime} ago</div>
        `;
        container.appendChild(card);
    });
};

