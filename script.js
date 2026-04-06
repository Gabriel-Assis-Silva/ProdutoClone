const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const instanceList = document.getElementById('instance-list');
const saveBtn = document.getElementById('save-btn');
const saveStatus = document.getElementById('save-status');
const autosaveCheck = document.getElementById('autosave-check');

let currentData = UserData.getAllData();
let settings = UserData.getSettings();
let isDirty = false;

window.onload = () => {
    autosaveCheck.checked = settings.autosave;
    renderSidebar();
    if (currentData.activeId && currentData.files[currentData.activeId]) {
        loadInstance(currentData.activeId);
    } else {
        editor.disabled = true;
    }
};

function createNewInstance() {
    const name = prompt("Nome do arquivo:", "novo-arquivo.md");
    if (!name) return;
    const id = 'file_' + Date.now();
    currentData.files[id] = { title: name, content: "" };
    currentData.activeId = id;
    saveToDisk();
    renderSidebar();
    loadInstance(id);
}

function loadInstance(id) {
    if (isDirty && !settings.autosave) {
        if (!confirm("Existem alterações não salvas. Sair mesmo assim?")) return;
    }
    currentData.activeId = id;
    editor.value = currentData.files[id].content;
    editor.disabled = false;
    isDirty = false;
    updateUIStatus();
    updatePreview();
    renderSidebar();
    saveToDisk();
}

function renderSidebar() {
    instanceList.innerHTML = "";
    Object.keys(currentData.files).forEach(id => {
        const div = document.createElement('div');
        div.className = `instance-item ${id === currentData.activeId ? 'active' : ''}`;
        div.innerText = currentData.files[id].title;
        div.onclick = () => loadInstance(id);
        instanceList.appendChild(div);
    });
}

function updateUIStatus() {
    if (isDirty && !settings.autosave) {
        saveBtn.classList.add('unsaved');
        saveStatus.innerText = "Modificado";
    } else {
        saveBtn.classList.remove('unsaved');
        saveStatus.innerText = "";
    }
}

function manualSave() {
    if (!currentData.activeId) return;
    currentData.files[currentData.activeId].content = editor.value;
    saveToDisk();
    isDirty = false;
    updateUIStatus();
    saveStatus.innerText = "Salvo!";
    setTimeout(() => updateUIStatus(), 1500);
}

function saveToDisk() { UserData.saveAllData(currentData); }

function toggleAutosave() {
    settings.autosave = autosaveCheck.checked;
    UserData.saveSettings(settings);
    if (settings.autosave && isDirty) manualSave();
    updateUIStatus();
}

editor.addEventListener('input', () => {
    isDirty = true;
    updatePreview();
    if (settings.autosave) {
        currentData.files[currentData.activeId].content = editor.value;
        saveToDisk();
        isDirty = false;
    }
    updateUIStatus();
});

function updatePreview() {
    preview.innerHTML = marked.parse(editor.value);
}

// Atalhos
window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        manualSave();
    }
    if (document.activeElement === editor && (e.ctrlKey || e.metaKey)) {
        if (e.key.toLowerCase() === 'b') { e.preventDefault(); applyStyle('bold'); }
        if (e.key.toLowerCase() === 'i') { e.preventDefault(); applyStyle('italic'); }
    }
});

function applyStyle(type) {
    if (!currentData.activeId) return;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);
    let prefix = "", suffix = "", placeholder = "";

    switch (type) {
        case 'bold': prefix = "**"; suffix = "**"; placeholder = "negrito"; break;
        case 'italic': prefix = "*"; suffix = "*"; placeholder = "itálico"; break;
        case 'heading': prefix = "\n# "; suffix = ""; placeholder = "Título"; break;
        case 'code': prefix = "```\n"; suffix = "\n```"; placeholder = "código"; break;
    }

    const content = selectedText || placeholder;
    const replacement = prefix + content + suffix;
    editor.setRangeText(replacement, start, end, 'select');
    if (!selectedText) {
        editor.setSelectionRange(start + prefix.length, start + prefix.length + content.length);
    }
    isDirty = true;
    if (settings.autosave) manualSave();
    updatePreview();
    updateUIStatus();
    editor.focus();
}

function deleteCurrentInstance() {
    if (!currentData.activeId) return;
    if (confirm("Excluir este arquivo?")) {
        delete currentData.files[currentData.activeId];
        currentData.activeId = Object.keys(currentData.files)[0] || null;
        saveToDisk();
        location.reload();
    }
}