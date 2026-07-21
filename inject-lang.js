const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// The language screen is defined as <div id="language-screen" ...> ... </div> ... </div> ... </div>
// Let's use a very precise match to extract it
const langStartStr = '<div id="language-screen" class="screen-view">';
const startIdx = html.indexOf(langStartStr);

if (startIdx === -1) {
    console.error("Could not find language-screen");
    process.exit(1);
}

// Find the end of the language screen. 
// It ends right before: <div id="emergency-type-screen" class="screen-view">
const endStr = '<div id="emergency-type-screen" class="screen-view">';
const endIdx = html.indexOf(endStr, startIdx);

if (endIdx === -1) {
    console.error("Could not find emergency-type-screen after language-screen");
    process.exit(1);
}

let langScreenHtml = html.substring(startIdx, endIdx);

// Now perform the replacements on the duplicated string to make it patient-specific
langScreenHtml = langScreenHtml.replace('id="language-screen"', 'id="patient-language-screen"')
    .replace('onclick="goBackFromLanguage()"', 'onclick="goBackFromPatientLanguage()"')
    .replace(/#C0202A/g, '#2b84f0')
    .replace(/#FA9A9F/g, '#cce4ff')
    .replace('onclick="saveLanguage()"', 'onclick="savePatientLanguage()"')
    .replace('id="lang-selected-text"', 'id="patient-lang-selected-text"')
    .replace('id="lang-options-list"', 'id="patient-lang-options-list"')
    .replace('oninput="onLangSearch(this.value)"', 'oninput="onPatientLangSearch(this.value)"')
    .replace('class="lang-search-input"', 'class="patient-lang-search-input"');

// Now we need to insert the patient-language-screen right before emergency-type-screen
const beforeEnd = html.substring(0, endIdx);
const afterEnd = html.substring(endIdx);
let newHtml = beforeEnd + langScreenHtml + afterEnd;

// Finally, we need to add the onclick handler to the patient language selector pill
newHtml = newHtml.replace(
    '<div class="patient-lang-selector" style="height: 36px; box-sizing: border-box;">',
    '<div class="patient-lang-selector" style="height: 36px; box-sizing: border-box; cursor: pointer;" onclick="goToPatientLanguageScreen()">'
);

fs.writeFileSync('index.html', newHtml);
console.log('Successfully injected patient-language-screen');
