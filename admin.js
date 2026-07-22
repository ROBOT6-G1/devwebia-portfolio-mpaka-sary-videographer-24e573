const ADMIN_PIN_HASH = '5994471abb01112afcc18159f6cc746f494bc7367c9f91ef65e2172086e340e6'; // SHA-256 hash of '0000'

const authScreen = document.getElementById('auth-screen');
const adminContent = document.getElementById('admin-content');
const pinInput = document.getElementById('pin-input');
const pinSubmit = document.getElementById('pin-submit');
const authError = document.getElementById('auth-error');
const logoutButton = document.getElementById('logout-button');
const sectionsNav = document.getElementById('sections-nav');
const contentEditor = document.getElementById('content-editor');

// Utility to hash PIN
async function sha256(message) {
    const textEncoder = new TextEncoder();
    const data = textEncoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash;
}

async function checkAuth() {
    const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
    if (isAuthenticated) {
        authScreen.classList.add('hidden');
        adminContent.classList.remove('hidden');
        loadAdminContent();
    } else {
        authScreen.classList.remove('hidden');
        adminContent.classList.add('hidden');
    }
}

pinSubmit.addEventListener('click', async () => {
    const pin = pinInput.value;
    const hashedPin = await sha256(pin);
    if (hashedPin === ADMIN_PIN_HASH) {
        sessionStorage.setItem('adminAuth', 'true');
        checkAuth();
    } else {
        authError.classList.remove('hidden');
        pinInput.value = '';
    }
});

logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('adminAuth');
    checkAuth();
});

async function loadAdminContent() {
    const { data: siteContent, error } = await supabase
        .from('site_content')
        .select('*');

    if (error) {
        console.error('Error loading site content:', error.message);
        return;
    }

    let contentMap = {};
    siteContent.forEach(item => {
        contentMap[item.section] = item.data;
    });

    renderSectionsNav(contentMap);
    renderEditor('hero', contentMap.hero);
}

function renderSectionsNav(contentMap) {
    sectionsNav.innerHTML = '';
    const sections = ['header', 'hero', 'about', 'projects', 'skills', 'contact', 'footer'];
    sections.forEach(section => {
        const button = document.createElement('button');
        button.textContent = section.charAt(0).toUpperCase() + section.slice(1);
        button.className = 'px-4 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-brand-200 hover:text-brand-800 transition';
        button.onclick = () => renderEditor(section, contentMap[section]);
        sectionsNav.appendChild(button);
    });
}

async function renderEditor(sectionName, sectionData) {
    contentEditor.innerHTML = '';
    const currentSectionData = { ...sectionData }; // Create a mutable copy

    const createField = (key, value, type = 'text') => {
        let template;
        if (type === 'textarea') {
            template = document.getElementById('textarea-field-template');
        } else if (type === 'image') {
            template = document.getElementById('image-field-template');
        } else {
            template = document.getElementById('text-field-template');
        }

        const clone = template.content.cloneNode(true);
        const label = clone.querySelector('label');
        const input = clone.querySelector(type === 'textarea' ? 'textarea' : (type === 'image' ? 'input[type="file"]' : 'input'));
        
        label.setAttribute('for', `${sectionName}-${key}`);
        label.textContent = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        input.id = `${sectionName}-${key}`;

        if (type === 'image') {
            const preview = clone.querySelector('img');
            preview.id = `${sectionName}-${key}_preview`;
            preview.src = value || 'https://via.placeholder.com/150?text=No+Image';

            const uploadButton = clone.querySelector('button');
            uploadButton.id = `${sectionName}-${key}_upload`;
            uploadButton.onclick = async () => {
                const file = input.files[0];
                if (!file) { alert('Mifidy sary aloha.'); return; }

                const path = `${sectionName}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
                const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true, cacheControl: '3600' });

                if (uploadError) { alert(uploadError.message); return; }

                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
                currentSectionData[key] = publicUrl;
                preview.src = publicUrl;
                await saveContent(sectionName, currentSectionData);
                alert('Sary voaova!');
            };
        } else {
            input.value = value;
            input.addEventListener('input', () => {
                currentSectionData[key] = input.value;
            });
        }
        return clone;
    };

    const createListEditor = (key, items, itemFields) => {
        const listSectionTemplate = document.getElementById('list-section-template');
        const listClone = listSectionTemplate.content.cloneNode(true);
        const listTitle = listClone.querySelector('h3');
        listTitle.textContent = key.charAt(0).toUpperCase() + key.slice(1);
        const itemsContainer = listClone.querySelector('.list-items-container');
        const addButton = listClone.querySelector('.list-add-button');

        const renderListItems = () => {
            itemsContainer.innerHTML = '';
            items.forEach((item, index) => {
                const listItemTemplate = document.getElementById('list-item-template');
                const itemClone = listItemTemplate.content.cloneNode(true);
                const itemIdInput = itemClone.querySelector('.list-item-id');
                itemIdInput.value = item.id || '';

                const deleteButton = itemClone.querySelector('.list-item-delete');
                deleteButton.onclick = async () => {
                    items.splice(index, 1);
                    currentSectionData[key] = items;
                    await saveContent(sectionName, currentSectionData);
                    renderListItems();
                };

                const moveUpButton = itemClone.querySelector('.list-item-move-up');
                if (index === 0) moveUpButton.classList.add('hidden');
                moveUpButton.onclick = async () => {
                    if (index > 0) {
                        [items[index], items[index - 1]] = [items[index - 1], items[index]];
                        currentSectionData[key] = items;
                        await saveContent(sectionName, currentSectionData);
                        renderListItems();
                    }
                };

                const moveDownButton = itemClone.querySelector('.list-item-move-down');
                if (index === items.length - 1) moveDownButton.classList.add('hidden');
                moveDownButton.onclick = async () => {
                    if (index < items.length - 1) {
                        [items[index], items[index + 1]] = [items[index + 1], items[index]];
                        currentSectionData[key] = items;
                        await saveContent(sectionName, currentSectionData);
                        renderListItems();
                    }
                };

                for (const fieldKey in itemFields) {
                    const fieldType = itemFields[fieldKey];
                    const fieldClone = createField(`${key}-${index}-${fieldKey}`, item[fieldKey] || '', fieldType);
                    const fieldInput = fieldClone.querySelector(fieldType === 'textarea' ? 'textarea' : (fieldType === 'image' ? 'input[type="file"]' : 'input'));
                    const fieldLabel = fieldClone.querySelector('label');
                    fieldLabel.textContent = fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1);
                    
                    if (fieldType === 'image') {
                        const preview = fieldClone.querySelector('img');
                        preview.src = item[fieldKey] || 'https://via.placeholder.com/150?text=No+Image';
                        fieldClone.querySelector('button').onclick = async () => {
                            const file = fieldInput.files[0];
                            if (!file) { alert('Mifidy sary aloha.'); return; }
                            const path = `${sectionName}-${key}-${index}-${fieldKey}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
                            const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true, cacheControl: '3600' });
                            if (uploadError) { alert(uploadError.message); return; }
                            const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path);
                            item[fieldKey] = publicUrl;
                            preview.src = publicUrl;
                            await saveContent(sectionName, currentSectionData);
                            alert('Sary voaova!');
                        };
                    } else {
                        fieldInput.value = item[fieldKey] || '';
                        fieldInput.addEventListener('input', () => {
                            item[fieldKey] = fieldInput.value;
                            saveContent(sectionName, currentSectionData);
                        });
                    }
                    itemClone.children[0].insertBefore(fieldClone, deleteButton.parentNode.nextSibling);
                }
                itemsContainer.appendChild(itemClone);
            });
        };

        addButton.onclick = async () => {
            const newItem = { id: Date.now() };
            for (const fieldKey in itemFields) {
                newItem[fieldKey] = '';
                if (itemFields[fieldKey] === 'image') newItem[fieldKey] = 'https://via.placeholder.com/150?text=New+Image';
            }
            items.push(newItem);
            currentSectionData[key] = items;
            await saveContent(sectionName, currentSectionData);
            renderListItems();
        };

        renderListItems();
        return listClone;
    };

    for (const key in currentSectionData) {
        if (Array.isArray(currentSectionData[key])) {
            let itemFields = {};
            if (sectionName === 'projects') {
                itemFields = { title: 'text', description: 'textarea', image: 'image' };
            } else if (sectionName === 'skills') {
                itemFields = { name: 'text', description: 'textarea' };
            }
            contentEditor.appendChild(createListEditor(key, currentSectionData[key], itemFields));
        } else if (typeof currentSectionData[key] === 'string') {
            let fieldType = 'text';
            if (key.includes('text') || key.includes('description') || key.includes('subtitle') || key.includes('processHighlight')) {
                fieldType = 'textarea';
            } else if (key.includes('image')) {
                fieldType = 'image';
            }
            contentEditor.appendChild(createField(key, currentSectionData[key], fieldType));
        }
    }

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Tehirizo ny fanovana';
    saveButton.className = 'mt-8 bg-brand-600 text-white py-2 px-4 rounded-md hover:bg-brand-700 transition';
    saveButton.onclick = async () => {
        await saveContent(sectionName, currentSectionData);
        alert('Voatahiry ny fanovana!');
    };
    contentEditor.appendChild(saveButton);
}

async function saveContent(section, data) {
    const { error } = await supabase
        .from('site_content')
        .upsert({ section: section, data: data });

    if (error) {
        console.error('Error saving content:', error.message);
        alert('Tsy nahomby ny fitahirizana ny atiny: ' + error.message);
    }
}

checkAuth();
