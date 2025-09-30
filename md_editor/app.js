/* ---------- wait for DOM ---------- */
document.addEventListener('DOMContentLoaded', () => {

/* ---------- state ---------- */
let currentFileName = 'untitled.md';
let previewVisible = false;
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');

/* ---------- 1. Preview toggle ---------- */
const previewBtn = document.getElementById('previewToggle');
previewBtn.onclick = () => {
  previewVisible = !previewVisible;
  preview.classList.toggle('hidden', !previewVisible);
  render();
};
function render() { if (previewVisible) preview.innerHTML = marked.parse(editor.value); }
editor.addEventListener('input', render);

/* ---------- 2. File I/O ---------- */
const fileInput = document.getElementById('fileInput');
document.getElementById('openBtn').onclick = () => fileInput.click();
fileInput.onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { editor.value = r.result; currentFileName = f.name; pushHistory(); render(); };
  r.readAsText(f);
};
function download(name, content) {
  const blob = new Blob([content], {type:'text/markdown'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
}
document.getElementById('saveBtn').onclick = () => download(currentFileName, editor.value);
document.getElementById('saveAsBtn').onclick = () => {
  const name = prompt('Save as:', currentFileName);
  if (!name) return;
  currentFileName = name.endsWith('.md') || name.endsWith('.markdown') ? name : name + '.md';
  download(currentFileName, editor.value);
};

/* ---------- 3. Undo/redo stack ---------- */
const history = []; let histPos = -1;
function pushHistory() {
  history.splice(histPos + 1);
  history.push(editor.value); histPos = history.length - 1;
}
function undo() { if (histPos > 0) { histPos--; editor.value = history[histPos]; render(); } }
function redo() { if (histPos < history.length - 1) { histPos++; editor.value = history[histPos]; render(); } }
editor.addEventListener('input', pushHistory);
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    if (e.key === 'z' && e.shiftKey) { e.preventDefault(); redo(); }
    if (e.key === 'y') { e.preventDefault(); redo(); }
  }
});
pushHistory();

/* ---------- 4. Toolbar & hotkeys ---------- */
document.getElementById('toolbar').onclick = e => { if (e.target.tagName === 'BUTTON') wrapInsert(e.target.dataset.md); };
function wrapInsert(mark) {
  const s = editor.selectionStart, e = editor.selectionEnd, selected = editor.value.slice(s, e);
  let before, after;
  if (mark === '**' || mark === '_' || mark === '`') { before = after = mark; }
  else if (mark === '[](url)') { before = '['; after = '](url)'; }
  else { before = mark; after = ''; }
  editor.setRangeText(before + selected + after, s, e, 'end'); editor.focus(); pushHistory(); render();
}
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey) {
    let cmd = null;
    if (e.key === 'b') cmd = '**'; if (e.key === 'i') cmd = '_'; if (e.key === 'k') cmd = '`';
    if (e.key === 'l') cmd = '[](url)'; if (e.key === 'u') cmd = '- '; if (e.key === 'q') cmd = '> ';
    if (cmd) { e.preventDefault(); wrapInsert(cmd); }
  }
});

/* ---------- 5. Auto-save & restore ---------- */
const LS_KEY = 'mdEditor_autosave';
setInterval(() => localStorage.setItem(LS_KEY, editor.value), 2000);
window.addEventListener('load', () => { const s = localStorage.getItem(LS_KEY); if (s) { editor.value = s; pushHistory(); render(); } });
window.addEventListener('beforeunload', () => localStorage.setItem(LS_KEY, editor.value));

/* ---------- 6. Template library – grouped & A-Z ---------- */
const templates = {
  /* -------- Blog -------- */
  "Blog / Article": `# Article Title\n\n*Author* – ${new Date().toDateString()}\n\n## Intro\n\nHook your readers here…\n\n## Body\n\nWrite the main content…\n\n## Conclusion\n\nWrap-up and call-to-action.\n`,
  "Blog / Guest Post": `> This is a guest post by **Author Name**.\n\n# Title\n\nShort bio paragraph.\n\n## Main Section\n\nContent…\n\n---\nThank you for reading!\n`,
  "Blog / Release Notes": `# 🚀 Release v1.2.3\n\n**Date**: ${new Date().toISOString().slice(0,10)}\n\n## ✨ Features\n- Feature A\n- Feature B\n\n## 🐛 Fixes\n- Bug 1\n- Bug 2\n\n## 📝 Notes\nAdditional info…\n`,

  /* -------- Code -------- */
  "Code / Changelog": `# Changelog\n\nAll notable changes to this project will be documented here.\n\n## [1.0.1] - ${new Date().toISOString().slice(0,10)}\n### Fixed\n- Fixed typo in README.\n\n## [1.0.0] - YYYY-MM-DD\n### Added\n- Initial release.\n`,
  "Code / API Docs": `# API Reference\n\n## Endpoint: \\`GET /users\\`\n\n**Description**: List all users.\n\n### Response\n\\`\\`\\`json\n[\n  { "id": 1, "name": "Alice" }\n]\n\\`\\`\\`\n`,
  "Code / README": `# Project Name\n\nOne-liner description.\n\n## Installation\n\n\\`\\`\\`bash\nnpm install\n\\`\\`\\`\n\n## Usage\n\n\\`\\`\\`js\nconst example = "hello";\n\\`\\`\\`\n\n## License\n\nMIT\n`,

  /* -------- Docs -------- */
  "Docs / Meeting Minutes": `# Meeting Minutes\n\n**Date**: ${new Date().toDateString()}  \n**Attendees**: Name 1, Name 2\n\n## Agenda\n1. Topic A\n2. Topic B\n\n## Discussion\n- Point 1\n- Point 2\n\n## Action Items\n- [ ] Task 1 – Owner – Due\n`,
  "Docs / SOP": `# Standard Operating Procedure\n\n## Purpose\nDescribe the purpose.\n\n## Scope\nWho/what it covers.\n\n## Procedure\nStep-by-step instructions…\n`,
  "Docs / User Manual": `# User Manual\n\n## Getting Started\nQuick overview…\n\n## Features\nDetail each feature…\n\n## Troubleshooting\nFAQ…\n`,

  /* -------- Mail -------- */
  "Mail / Newsletter": `# Newsletter Title\n\nHello *|FNAME|*,\n\nShort intro sentence.\n\n## What's New\n- Item 1\n- Item 2\n\n## Stay Connected\nFollow us on social media.\n\nBest regards,  \nTeam\n`,
  "Mail / Press Release": `**FOR IMMEDIATE RELEASE**\n\n# Headline Goes Here\n\n**City, Country – ${new Date().toDateString()}** – Lead paragraph…\n\n## Quotes\n> “Quote 1” – Name, Title\n\n## About Company\nBoilerplate…\n\n**Media Contact**:  \nName  \nEmail  \nPhone\n`,

  /* -------- Misc -------- */
  "Misc / Cheat Sheet": `# Markdown Cheat Sheet\n\n| Element      | Syntax           |\n|--------------|------------------|\n| Heading      | \\`# H1\\` … \\`###### H6\\` |\n| Bold         | \\`**bold**\\`     |\n| Link         | \\`[t](url)\\`     |\n| Image        | \\`![alt](src)\\`  |\n| Code         | \\`\\`code\\`\\`     |\n| Fenced Code  | \\`\\`\\` … \\`\\`\\`  |\n`,
  "Misc / Todo": `# Todo List\n\n## Today\n- [ ] Task 1\n- [ ] Task 2\n\n## This Week\n- [ ] Longer task\n`,
  "Misc / Wedding Invite": `# You're Invited!\n\n**Date & Time**  \nSaturday, DD Month YYYY – 4:00 PM\n\n**Location**  \nVenue Name, Address\n\nRSVP by DD Month.\n`,

  /* -------- Note -------- */
  "Note / Lecture Notes": `# Lecture Title\n\n**Course**: XYZ 101  \n**Date**: ${new Date().toDateString()}\n\n## Key Points\n- Point 1\n- Point 2\n\n## Summary\nOne-paragraph recap.\n`,
  "Note / Daily Journal": `# Daily Journal – ${new Date().toDateString()}\n\n## Gratitude\n- Item 1\n- Item 2\n\n## Reflection\nWrite thoughts…\n\n## Tomorrow\n- Task 1\n`,

  /* -------- Report -------- */
  "Report / Weekly Status": `# Weekly Status Report\n\n**Week Ending**: ${new Date().toDateString()}\n\n## Accomplishments\n- Item 1\n- Item 2\n\n## Blockers\n- Blocker 1\n\n## Next Week\n- Plan 1\n`,
  "Report / Expense Report": `# Expense Report\n\n**Period**: MM/YYYY\n\n| Date | Description | Amount |\n|------|-------------|--------|\n| DD/MM | Lunch | $25.00 |\n| DD/MM | Taxi | $40.00 |\n\n**Total**: $65.00\n`,
  "Report / Book Review": `# Book Title\n\n**Author**: Name  \n**Rating**: ⭐⭐⭐⭐☆\n\n## Summary\nBrief synopsis…\n\n## Thoughts\nPersonal review…\n`
};
}); /* ---------- end DOMContentLoaded ---------- */