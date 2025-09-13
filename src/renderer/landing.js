document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const importProjectBtn = document.getElementById('import-project-btn');
    const importFileInput = document.getElementById('import-file-input');
    const projectTabsContainer = document.getElementById('project-tabs-container');
    const createTabPanel = document.getElementById('create-tab');
    const projectDetailsPanel = document.getElementById('project-details-tab');
    const boardGrid = document.querySelector('.board-grid');
    const openProjectBtn = document.getElementById('open-project-btn');
    const deleteProjectBtn = document.getElementById('delete-project-btn');
    const projectNameInput = document.getElementById('project-name-input');
    const projectDescriptionInput = document.getElementById('project-description-input');
    const createProjectBtn = document.getElementById('create-project-btn');
    const staticCreateTab = document.querySelector('.project-tab[data-tab="create"]');
    
    // --- Single-Page Wizard UI ---
    const panelSubtitle = document.getElementById('panel-subtitle');
    const typeSelectionView = document.getElementById('project-type-selection-view');
    const selectHardwareBtn = document.getElementById('select-hardware-project');
    const selectSimulationBtn = document.getElementById('select-simulation-project');
    const hardwareProjectForm = document.getElementById('hardware-project-form');
    const backBtnHardware = document.getElementById('back-to-type-select-hardware');
    const simulationProjectForm = document.getElementById('simulation-project-form');
    const simProjectNameInput = document.getElementById('sim-project-name-input');
    const createSimBtn = document.getElementById('create-simulation-btn');
    const backBtnSim = document.getElementById('back-to-type-select-sim');
    
    // Theme switcher buttons
    const lightThemeBtn = document.getElementById('theme-light');
    const darkThemeBtn = document.getElementById('theme-dark');
    const contrastThemeBtn = document.getElementById('theme-contrast');

    // --- State ---
    let projects = [];
    let selectedBoardForProject = null;

    // --- Board Definitions ---
    const boards = [
        { id: 'esp32', name: 'ESP32', description: 'Powerful MCU with Wi-Fi & Bluetooth.', image: 'src/renderer/assets/ESP32.png' },
        { id: 'pico', name: 'Raspberry Pi Pico', description: 'Flexible, high-performance board.', image: 'src/renderer/assets/Pico.png' },
    ];
    const THEME_KEY = 'blockIdeTheme';
    
    // --- Functions ---

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem(THEME_KEY, theme);
        updateThemeButtons(theme);
    }

    function updateThemeButtons(activeTheme) {
        document.querySelectorAll('.theme-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`theme-${activeTheme}`);
        if(activeBtn) activeBtn.classList.add('active');
    }

    function showCustomConfirm(message, callback) {
        const modal = document.getElementById('custom-confirm-modal');
        const msgEl = document.getElementById('custom-confirm-message');
        const yesBtn = document.getElementById('custom-confirm-yes');
        const noBtn = document.getElementById('custom-confirm-no');
        msgEl.textContent = message;
        modal.style.display = 'flex';
        const handleConfirmation = (confirmed) => {
            modal.style.display = 'none';
            yesBtn.onclick = null;
            noBtn.onclick = null;
            callback(confirmed);
        };
        yesBtn.onclick = () => handleConfirmation(true);
        noBtn.onclick = () => handleConfirmation(false);
    }
    
    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    const getProjects = () => JSON.parse(localStorage.getItem('blockIdeProjects') || '[]').map(p => ({
        name: p.name,
        projectType: p.projectType || 'hardware', 
        boardId: p.boardId,
        description: p.description || '',
        createdAt: p.createdAt || Date.now(),
        modifiedAt: p.modifiedAt || Date.now(),
    }));
    
    const saveProjects = (updatedProjects) => localStorage.setItem('blockIdeProjects', JSON.stringify(updatedProjects));

    function renderProjectTabs() {
        projects = getProjects();
        projectTabsContainer.innerHTML = '';
        projects.forEach((project, index) => {
            const tab = document.createElement('div');
            tab.className = 'project-tab';
            tab.dataset.tab = `project-${index}`;
            tab.dataset.index = index;
            const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#14B8A6'];
            const iconColor = colors[project.name.length % colors.length];
            const subtitle = project.boardId === 'simulation' 
                ? 'Simulation project' 
                : `${project.boardId.toUpperCase()} project`;

            tab.innerHTML = `
                <div class="tab-icon" style="background: ${iconColor};">
                    <svg width="24" height="24" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 2v6h6" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
                <div class="tab-content">
                    <h3>${project.name}</h3>
                    <p>${subtitle}</p>
                </div>`;
            tab.addEventListener('click', () => switchTab(`project-${index}`));
            projectTabsContainer.appendChild(tab);
        });
    }

    function switchTab(tabId) {
        document.querySelectorAll('.project-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        const isCreateTab = tabId === 'create';
        createTabPanel.classList.toggle('active', isCreateTab);
        projectDetailsPanel.classList.toggle('active', !isCreateTab);

        if (isCreateTab) {
            showView('type-select');
        } else {
            const index = parseInt(document.querySelector(`.project-tab[data-tab="${tabId}"]`).dataset.index, 10);
            showProjectDetails(projects[index], index);
        }
    }

    function showProjectDetails(project, index) {
        const boardName = project.boardId === 'simulation' ? 'Simulation' : project.boardId.toUpperCase();
        
        document.getElementById('project-details-name').textContent = project.name;
        document.getElementById('project-details-board').textContent = boardName;
        document.getElementById('project-details-created').textContent = formatDate(project.createdAt);
        document.getElementById('project-details-modified').textContent = formatDate(project.modifiedAt);
        document.getElementById('project-details-description').textContent = project.description || 'No description provided.';
        document.getElementById('project-details-board-meta').textContent = boardName;
        
        openProjectBtn.onclick = () => {
            if (project.boardId === 'simulation') {
                window.location.href = `simulation-ide.html?project=${encodeURIComponent(project.name)}`;
            } else {
                window.location.href = `ide.html?project=${encodeURIComponent(project.name)}&board=${encodeURIComponent(project.boardId)}`;
            }
        };
        deleteProjectBtn.onclick = () => deleteProject(index);
    }
    
    function deleteProject(index) {
        const projectToDelete = projects[index];
        const message = `Are you sure you want to delete "${projectToDelete.name}"? This cannot be undone.`;
        showCustomConfirm(message, (confirmed) => {
            if (confirmed) {
                projects.splice(index, 1);
                saveProjects(projects);
                localStorage.removeItem(`project_${projectToDelete.name}`);
                renderProjectTabs();
                switchTab('create');
            }
        });
    }

    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target.result;
                const projectData = JSON.parse(fileContent);

                if (!projectData.workspace || !projectData.boardId || !projectData.projectName) {
                    return alert("This does not appear to be a valid project file.");
                }

                const handleImportLogic = () => {
                    const now = Date.now();
                    const newProjectData = {
                        name: projectData.projectName,
                        boardId: projectData.boardId,
                        description: projectData.description || '',
                        modifiedAt: now
                    };

                    const existingProjectIndex = projects.findIndex(p => p.name === projectData.projectName);
                    if (existingProjectIndex !== -1) {
                        projects[existingProjectIndex] = { ...projects[existingProjectIndex], ...newProjectData };
                    } else {
                        projects.push({ ...newProjectData, createdAt: now });
                    }
                    
                    localStorage.setItem(`project_${projectData.projectName}`, projectData.workspace);
                    saveProjects(projects);
                    renderProjectTabs();
                    const finalIndex = projects.findIndex(p => p.name === newProjectData.name);
                    switchTab(`project-${finalIndex}`);
                };

                const existingProject = projects.find(p => p.name === projectData.projectName);
                if (existingProject) {
                    showCustomConfirm(`A project named "${projectData.projectName}" already exists. Overwrite it?`, (confirmed) => {
                        if (confirmed) handleImportLogic();
                    });
                } else {
                    handleImportLogic();
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('Failed to import project: ' + error.message);
            }
        };
        reader.readAsText(file);
        // Reset the input so the user can import the same file again if they need to.
        importFileInput.value = '';
    }

    function populateBoardSelection() {
        boardGrid.innerHTML = '';
        boards.forEach(board => {
            const card = document.createElement('div');
            card.className = 'board-card';
            card.dataset.boardId = board.id;
            card.innerHTML = `<img src="${board.image}" alt="${board.name}"><h4>${board.name}</h4><p>${board.description}</p>`;
            card.addEventListener('click', () => {
                document.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedBoardForProject = board.id;
            });
            boardGrid.appendChild(card);
        });
    }

    function createNewHardwareProject() {
        const projectName = projectNameInput.value.trim();
        if (!projectName) return alert('Please enter a project name.');
        if (!selectedBoardForProject) return alert('Please select a microcontroller board.');
        if (projects.some(p => p.name === projectName)) return alert('A project with this name already exists.');
        
        const now = Date.now();
        projects.push({
            name: projectName,
            boardId: selectedBoardForProject,
            description: projectDescriptionInput.value.trim(),
            createdAt: now,
            modifiedAt: now
        });
        saveProjects(projects);

        // Navigate to the hardware IDE page with project info in URL
        window.location.href = `ide.html?project=${encodeURIComponent(projectName)}&board=${encodeURIComponent(selectedBoardForProject)}`;
    }
    
    function createNewSimulationProject() {
        const projectName = simProjectNameInput.value.trim();
        if (!projectName) return alert('Please enter a project name.');
        if (projects.some(p => p.name === projectName)) return alert('A project with this name already exists.');
        
        const now = Date.now();
        const newProject = {
            name: projectName,
            boardId: 'simulation',
            description: 'A Scratch-like simulation project.',
            createdAt: now,
            modifiedAt: now
        };
        projects.push(newProject);
        saveProjects(projects);

        // Navigate to the simulation IDE page
        window.location.href = `simulation-ide.html?project=${encodeURIComponent(projectName)}`;
    }

    function showView(viewToShow) {
        typeSelectionView.style.display = 'none';
        hardwareProjectForm.style.display = 'none';
        simulationProjectForm.style.display = 'none';
    
        if (viewToShow === 'type-select') {
            panelSubtitle.textContent = 'Choose a project type to get started.';
            typeSelectionView.style.display = 'block';
        } else if (viewToShow === 'hardware') {
            panelSubtitle.textContent = 'Configure your new hardware project.';
            hardwareProjectForm.style.display = 'block';
        } else if (viewToShow === 'simulation') {
            panelSubtitle.textContent = 'Give your new simulation a name.';
            simulationProjectForm.style.display = 'block';
        }
    }

    // --- Main Application Initialization ---
    
    // Setup event listeners for UI elements
    importProjectBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileImport);
    createProjectBtn.addEventListener('click', createNewHardwareProject);
    createSimBtn.addEventListener('click', createNewSimulationProject);
    staticCreateTab.addEventListener('click', () => switchTab('create'));
    projectNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); createProjectBtn.click(); } });
    simProjectNameInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { e.preventDefault(); createSimBtn.click(); } });

    selectHardwareBtn.addEventListener('click', () => showView('hardware'));
    selectSimulationBtn.addEventListener('click', () => showView('simulation'));
    backBtnHardware.addEventListener('click', () => showView('type-select'));
    backBtnSim.addEventListener('click', () => showView('type-select'));

    lightThemeBtn.addEventListener('click', () => setTheme('light'));
    darkThemeBtn.addEventListener('click', () => setTheme('dark'));
    contrastThemeBtn.addEventListener('click', () => setTheme('contrast'));

    // Initial load
    renderProjectTabs();
    populateBoardSelection();
    setTheme(localStorage.getItem(THEME_KEY) || 'light');
    switchTab('create');
});