const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<div id="language-screen"');
const end = html.indexOf('</div>\n            </div>\n\n\n\n            <div id="emergency-type-screen"');
let langScreen = html.substring(start, end + 26);
langScreen = langScreen.replace('id="language-screen"', 'id="patient-language-screen"')
    .replace('onclick="goBackFromLanguage()"', 'onclick="goBackFromPatientLanguage()"')
    .replace(/#C0202A/g, '#2b84f0')
    .replace(/#FA9A9F/g, '#cce4ff')
    .replace('onclick="saveLanguage()"', 'onclick="savePatientLanguage()"')
    .replace('id="lang-selected-text"', 'id="patient-lang-selected-text"')
    .replace('id="lang-options-list"', 'id="patient-lang-options-list"')
    .replace('oninput="onLangSearch(this.value)"', 'oninput="onPatientLangSearch(this.value)"')
    .replace('class="lang-search-input"', 'class="patient-lang-search-input"');

// Insert it before emergency-type-screen
const modifiedHtml = html.replace('<div id="emergency-type-screen"', langScreen + '\n\n            <div id="emergency-type-screen"');
fs.writeFileSync('index.html', modifiedHtml);
console.log('Successfully added patient-language-screen');
