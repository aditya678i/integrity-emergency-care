const fs = require('fs');
let appJs = fs.readFileSync('app.js', 'utf8');

// Add getLangCode helper
const getLangCodeHelper = `
function getLangCodeDisplay(id) {
    const map = {
        'en': 'ENG',
        'hi': 'HIN',
        'bn': 'BEN',
        'mr': 'MAR',
        'te': 'TEL',
        'gu': 'GUJ'
    };
    return map[id] || id.toUpperCase();
}
`;

// Inject helper before goToPatientHospitals
appJs = appJs.replace('function goToPatientHospitals', getLangCodeHelper + '\nfunction goToPatientHospitals');

// Replace patientLangId.toUpperCase() with getLangCodeDisplay(patientLangId)
appJs = appJs.replace(/patientLangId\.toUpperCase\(\)/g, 'getLangCodeDisplay(patientLangId)');

fs.writeFileSync('app.js', appJs);
console.log('Fixed EN to ENG');
