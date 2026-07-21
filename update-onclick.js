const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
    '<div class="patient-lang-selector" style="height: 36px; box-sizing: border-box;">',
    '<div class="patient-lang-selector" style="height: 36px; box-sizing: border-box; cursor: pointer;" onclick="goToPatientLanguageScreen()">'
);
fs.writeFileSync('index.html', html);
console.log('Successfully updated patient-lang-selector onclick');
