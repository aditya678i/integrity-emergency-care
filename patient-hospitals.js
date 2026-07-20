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

async function fetchNearbyHospitals(lat, lon) {
    const radius = 5000; // 5km search radius
    const query = `
        [out:json];
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        out center;
    `;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        let hospitals = data.elements.map(el => {
            return {
                id: el.id,
                name: el.tags.name || "Unknown Hospital",
                lat: el.lat || el.center?.lat,
                lon: el.lon || el.center?.lon,
                distance: calculateDistance(lat, lon, el.lat || el.center?.lat, el.lon || el.center?.lon)
            };
        });
        
        // Filter out unknown hospitals
        hospitals = hospitals.filter(h => h.name !== "Unknown Hospital");
        
        // Sort by nearest
        hospitals.sort((a, b) => a.distance - b.distance);
        
        // If empty, mock a hospital just so we show something if they are not in a mapped area
        if (hospitals.length === 0) {
            hospitals.push({
                id: 1,
                name: "City Central Hospital",
                lat: lat + 0.01,
                lon: lon + 0.01,
                distance: 1.2
            });
        }
        
        renderHospitalCards(hospitals, lat, lon);
        
    } catch (error) {
        console.error("Error fetching hospitals from OSM:", error);
        document.getElementById('patient-hospitals-list').innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                Failed to fetch hospitals. Please check your internet connection.
            </div>
        `;
    }
}

function renderHospitalCards(osmHospitals, userLat, userLon) {
    const container = document.getElementById('patient-hospitals-list');
    container.innerHTML = '';
    
    // We get currentPatientEmergencyType from app.js (e.g., 'Heart', 'Bleeding')
    const emergencyType = (typeof currentPatientEmergencyType !== 'undefined') ? currentPatientEmergencyType : 'Other';

    osmHospitals.forEach(hosp => {
        // Check if this OSM hospital matches our registered hospitalProfile in localStorage
        // Since we are simulating real-time DB via localStorage, we check if the name matches (case insensitive)
        let isRegistered = false;
        let matchedICU = null;
        let hospContact = '';
        
        const registeredProfile = JSON.parse(localStorage.getItem('hospitalProfile'));
        const registeredICUs = JSON.parse(localStorage.getItem('hospitalICUs')) || [];

        if (registeredProfile && registeredProfile.name && hosp.name.toLowerCase().includes(registeredProfile.name.toLowerCase())) {
            isRegistered = true;
            // Now find the specific department for the selected emergency type
            matchedICU = registeredICUs.find(icu => {
                if (icu.names && icu.names.includes(emergencyType)) return true;
                if (icu.name === emergencyType) return true;
                return false;
            });
            
            // If they provided a specific contact for this ICU department, use it. Else use main hospital phone.
            if (matchedICU && matchedICU.contact) {
                hospContact = matchedICU.contact;
            } else if (registeredProfile.phone) {
                hospContact = registeredProfile.phone;
            }
        }
        
        // Build Google Maps routing URL
        const mapUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLon}&destination=${hosp.lat},${hosp.lon}`;
        
        // Build Tel URL
        const telUrl = hospContact ? `tel:${hospContact}` : `tel:112`; // Fallback to emergency number
        
        const card = document.createElement('div');
        card.className = 'patient-hosp-card';
        
        let statsHTML = '';
        
        if (isRegistered && matchedICU) {
            statsHTML = `
                <div class="hosp-stats">
                    <div class="stat-row">
                        <span class="stat-label">${emergencyType} ICU Beds</span>
                        <span class="stat-val">${matchedICU.totalBeds || 0}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">${emergencyType} Beds Vacant</span>
                        <span class="stat-val" style="color: #069c56;">${matchedICU.vacantBeds || 0}</span>
                    </div>
                </div>

                <div class="patient-vent-card">
                    <div class="vent-col">
                        <div class="vent-label">With Ventilator</div>
                        <div class="vent-num">${matchedICU.ventBeds || 0}</div>
                    </div>
                    <div class="vent-col">
                        <div class="vent-label">Without Ventilator</div>
                        <div class="vent-num">${matchedICU.noVentBeds || 0}</div>
                    </div>
                </div>
            `;
        } else if (isRegistered && !matchedICU) {
            statsHTML = `
                <div style="padding: 12px; background: #FFF3CD; color: #856404; border-radius: 8px; font-size: 0.85rem; margin-top: 10px;">
                    This hospital is registered but does not have a specialized ${emergencyType} department listed.
                </div>
            `;
        } else {
            statsHTML = `
                <div style="padding: 12px; background: #F3F4F6; color: #6B7280; border-radius: 8px; font-size: 0.85rem; margin-top: 10px;">
                    This hospital is not registered on the app. Real-time bed data is unavailable.
                </div>
            `;
        }
        
        card.innerHTML = `
            <h2 class="hosp-name">${hosp.name} <span style="font-size:0.75rem; color:#666; font-weight:normal;">(${hosp.distance.toFixed(1)} km away)</span></h2>
            <div class="hosp-img-container">
                <div class="hosp-img-placeholder" style="background-image: url('assets/logo.png'); background-size: contain; background-repeat: no-repeat; background-position: center; background-color: #f9f9f9;"></div>
            </div>
            
            <div class="hosp-actions">
                <a href="${telUrl}" class="btn-call" style="text-decoration: none; display: flex; justify-content: center;">
                    <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                    Call hospital
                </a>
                <a href="${mapUrl}" target="_blank" class="btn-map" style="text-decoration: none; display: flex; justify-content: center;">
                    <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                    Show Map
                </a>
            </div>

            ${statsHTML}

            <button class="btn-book-amb" style="margin-top: 16px;">
                <svg class="svg-icon amb-icon" viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="currentColor"><path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v12h3.14a3 3 0 0 0 5.72 0h4.28a3 3 0 0 0 5.72 0H20V12l-1-5zm-9-1a2 2 0 0 1 4 0v1h-4V6zm-3 8H5v-2h2v2zm5 0H9v-2h2v2zm5 0h-2v-2h2v2zm-6 6a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm8 0a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/></svg>
                Book Ambulance
                <svg class="svg-icon arrow-icon" viewBox="0 0 24 24" width="1.2em" height="1.2em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17l9.2-9.2M17 17V7H7"/></svg>
            </button>
        `;
        container.appendChild(card);
    });
}
