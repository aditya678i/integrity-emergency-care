const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// 1. Setup local storage variables
const langVars = `
let hospitalLangId = localStorage.getItem('hospitalLangId') || 'en';
let patientLangId = localStorage.getItem('patientLangId') || 'en';

function triggerGoogleTranslate(langCode) {
    const select = document.querySelector('.goog-te-combo');
    if (select && select.value !== langCode) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    }
}
`;

appJs = appJs.replace('let selectedLangId = \'en\';', langVars);

// 2. Add patient language functions
const patientLangFuncs = `
let currentLangContext = 'hospital'; // or 'patient'

function goToLanguageScreen() {
    currentLangContext = 'hospital';
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('language-screen').classList.add('active-view');
    document.querySelector('.lang-search-input').value = '';
    renderLanguageOptions();
}

function goToPatientLanguageScreen() {
    currentLangContext = 'patient';
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('patient-language-screen').classList.add('active-view');
    document.querySelector('.patient-lang-search-input').value = '';
    renderPatientLanguageOptions();
}

function goBackFromLanguage() {
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('change-info-screen').classList.add('active-view');
}

function goBackFromPatientLanguage() {
    document.querySelectorAll('.screen-view').forEach(el => el.classList.remove('active-view'));
    document.getElementById('patient-hospitals-screen').classList.add('active-view');
}

function renderPatientLanguageOptions(searchQuery = '') {
    const list = document.getElementById('patient-lang-options-list');
    
    // Update the "You Selected" text based on patientLangId
    const selectedLang = languages.find(l => l.id === patientLangId) || languages[0];
    document.getElementById('patient-lang-selected-text').textContent = selectedLang.name;

    const query = searchQuery.trim().toLowerCase();
    const filteredLangs = languages.filter(l => l.name.toLowerCase().includes(query) || (l.id === 'en' && 'english'.includes(query)));

    list.innerHTML = filteredLangs.map(lang => {
        const isSelected = lang.id === patientLangId;
        return \`
            <div class="lang-option \${isSelected ? 'selected' : ''}" onclick="selectPatientLanguage('\${lang.id}')">
                <span>\${lang.name}</span>
                \${isSelected ? '<svg class="svg-icon lang-check-icon" viewBox="0 0 24 24" width="24px" height="24px" fill="#2b84f0"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1.2 14.6l-4.4-4.4 1.4-1.4 3 3 6.6-6.6 1.4 1.4z"/></svg>' 
                : '<div class="lang-circle" style="border-color: #2b84f0;"></div>'}
            </div>
        \`;
    }).join('');
}

function onPatientLangSearch(query) {
    renderPatientLanguageOptions(query);
}

function selectPatientLanguage(langId) {
    patientLangId = langId;
    renderPatientLanguageOptions(document.querySelector('.patient-lang-search-input').value);
}

function savePatientLanguage() {
    localStorage.setItem('patientLangId', patientLangId);
    triggerGoogleTranslate(patientLangId);
    
    // Update the UI pill on patient hospitals screen
    const selector = document.querySelector('.patient-lang-selector');
    if (selector) {
        selector.innerHTML = patientLangId.toUpperCase() + ' <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    }

    goBackFromPatientLanguage();
}
`;

appJs = appJs.replace(/function goToLanguageScreen\(\) {[\s\S]*?function renderLanguageOptions\(searchQuery = ''\) {/, patientLangFuncs + '\nfunction renderLanguageOptions(searchQuery = \'\') {');

// 3. Update existing Hospital language logic to use hospitalLangId instead of selectedLangId
appJs = appJs.replace(/selectedLangId/g, 'hospitalLangId');

// 4. Update saveLanguage() to save hospitalLangId and trigger translate
appJs = appJs.replace(/function saveLanguage\(\) {[\s\S]*?}/, `function saveLanguage() {
    localStorage.setItem('hospitalLangId', hospitalLangId);
    triggerGoogleTranslate(hospitalLangId);
    goBackFromLanguage();
}`);

// 5. Inject triggers on transitions
// When going to Patient Screen
appJs = appJs.replace(/function goToEmergencyType\(\) {/, `function goToEmergencyType() {
    triggerGoogleTranslate(patientLangId);`);
    
// When going to Hospital Dashboard
appJs = appJs.replace(/function goToDashboard\(\) {/, `function goToDashboard() {
    triggerGoogleTranslate(hospitalLangId);`);
    
// Add missing initialization for patient pill
appJs = appJs.replace(/function goToPatientHospitals\(emergencyType = 'Other'\) {/, `function goToPatientHospitals(emergencyType = 'Other') {
    triggerGoogleTranslate(patientLangId);
    const selector = document.querySelector('.patient-lang-selector');
    if (selector) {
        selector.innerHTML = patientLangId.toUpperCase() + ' <svg class="svg-icon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    }`);

// Also trigger when going to hospital login/register
appJs = appJs.replace(/function goToHospitalRegister\(\) {/, `function goToHospitalRegister() {
    triggerGoogleTranslate(hospitalLangId);`);

fs.writeFileSync('app.js', appJs);
console.log('Successfully updated app.js for isolated language contexts.');
