document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const importProjectBtn = document.getElementById('import-project-btn');
    const importFileInput = document.getElementById('import-file-input');
    const projectsGrid = document.getElementById('projects-grid');
    const createProjectBtn = document.getElementById('create-new-project-btn');

    // New Project Modal Elements
    const newProjectModal = document.getElementById('new-project-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    const modalBackBtn = document.getElementById('modal-back-btn');
    const modalCreateBtn = document.getElementById('modal-create-btn');
    const projectNameInput = document.getElementById('modal-project-name');
    const hardwareTypeCard = document.querySelector('.type-card[data-type="hardware"]');
    const simulationTypeCard = document.querySelector('.type-card[data-type="simulation"]');
    const boardGrid = newProjectModal.querySelector('.board-grid');
    const step1 = document.getElementById('step-1-name-type');
    const step2 = document.getElementById('step-2-board');

    // Info Modal Elements
    const projectInfoModal = document.getElementById('project-info-modal');
    const infoModalCloseBtn = document.getElementById('info-modal-close-btn');

    // Theme switcher buttons
    const lightThemeBtn = document.getElementById('theme-light');
    const darkThemeBtn = document.getElementById('theme-dark');
    const contrastThemeBtn = document.getElementById('theme-contrast');

    // --- State ---
    let projects = [];
    let selectedBoardForProject = null;
    let selectedProjectType = null;

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

    function formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    }

    const getProjects = () => JSON.parse(localStorage.getItem('blockIdeProjects') || '[]').map(p => ({
        name: p.name,
        projectType: p.boardId === 'simulation' ? 'simulation' : 'hardware', 
        boardId: p.boardId,
        createdAt: p.createdAt || Date.now(),
        modifiedAt: p.modifiedAt || Date.now(),
    }));
    
    const saveProjects = (updatedProjects) => localStorage.setItem('blockIdeProjects', JSON.stringify(updatedProjects));

    function renderProjectCards() {
        projects = getProjects();
        projectsGrid.querySelectorAll('.project-card:not(.create-card)').forEach(card => card.remove());

        projects.forEach((project, index) => {
            const card = document.createElement('div');
            card.className = 'project-card';
            
            const boardName = project.boardId === 'simulation' ? 'Simulation' : project.boardId.toUpperCase();

            card.innerHTML = `
                <div class="card-actions">
                    <button class="card-action-btn info-btn" title="Info">i</button>
                    <button class="card-action-btn delete-btn" title="Delete">×</button>
                </div>
                <div class="card-content">
                    <h3>${project.name}</h3>
                    <p>${boardName} Project</p>
                </div>`;
            
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.card-action-btn')) {
                    openProject(project);
                }
            });

            card.querySelector('.info-btn').addEventListener('click', () => showProjectInfo(project));
            card.querySelector('.delete-btn').addEventListener('click', () => deleteProject(index));

            projectsGrid.appendChild(card);
        });
    }

    function openProject(project) {
        if (project.boardId === 'simulation') {
            window.location.href = `simulation-ide.html?project=${encodeURIComponent(project.name)}`;
        } else {
            window.location.href = `ide.html?project=${encodeURIComponent(project.name)}&board=${encodeURIComponent(project.boardId)}`;
        }
    }

    function showProjectInfo(project) {
        const boardName = project.boardId === 'simulation' ? 'Simulation' : project.boardId.toUpperCase();
        document.getElementById('info-modal-title').textContent = project.name;
        document.getElementById('info-modal-board').textContent = boardName;
        document.getElementById('info-modal-created').textContent = formatDate(project.createdAt);
        document.getElementById('info-modal-modified').textContent = formatDate(project.modifiedAt);
        projectInfoModal.style.display = 'flex';
    }

    function deleteProject(index) {
        const projectToDelete = projects[index];
        const message = `Are you sure you want to delete "${projectToDelete.name}"? This cannot be undone.`;
        showCustomConfirm(message, (confirmed) => {
            if (confirmed) {
                projects.splice(index, 1);
                saveProjects(projects);
                localStorage.removeItem(`project_${projectToDelete.name}`);
                localStorage.removeItem(`project_workspace_${projectToDelete.name}`);
                localStorage.removeItem(`project_extensions_${projectToDelete.name}`);
                renderProjectCards();
            }
        });
    }

    // --- Modal Logic ---
    function openNewProjectModal() {
        projectNameInput.value = '';
        selectedProjectType = null;
        selectedBoardForProject = null;
        hardwareTypeCard.classList.remove('selected');
        simulationTypeCard.classList.remove('selected');
        boardGrid.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected'));
        modalNextBtn.disabled = true;
        modalCreateBtn.disabled = true;
        goToStep(1);
        newProjectModal.style.display = 'flex';
        projectNameInput.focus();
    }

    function closeNewProjectModal() {
        newProjectModal.style.display = 'none';
    }

    function goToStep(stepNum) {
        step1.classList.toggle('active', stepNum === 1);
        step2.classList.toggle('active', stepNum === 2);
    }
    
    function validateStep1() {
        const isNameValid = projectNameInput.value.trim().length > 0;
        const isTypeSelected = selectedProjectType !== null;
        modalNextBtn.disabled = !(isNameValid && isTypeSelected);
    }

    hardwareTypeCard.addEventListener('click', () => {
        selectedProjectType = 'hardware';
        hardwareTypeCard.classList.add('selected');
        simulationTypeCard.classList.remove('selected');
        validateStep1();
    });

    simulationTypeCard.addEventListener('click', () => {
        selectedProjectType = 'simulation';
        simulationTypeCard.classList.add('selected');
        hardwareTypeCard.classList.remove('selected');
        validateStep1();
    });
    
    projectNameInput.addEventListener('input', validateStep1);

    modalNextBtn.addEventListener('click', () => {
        if (selectedProjectType === 'hardware') {
            goToStep(2);
        } else if (selectedProjectType === 'simulation') {
            createNewSimulationProject();
        }
    });

    modalBackBtn.addEventListener('click', () => goToStep(1));
    modalCancelBtn.addEventListener('click', closeNewProjectModal);
    modalCreateBtn.addEventListener('click', createNewHardwareProject);

    function populateBoardSelection() {
        boardGrid.innerHTML = '';
        boards.forEach(board => {
            const card = document.createElement('div');
            card.className = 'board-card';
            card.dataset.boardId = board.id;
            card.innerHTML = `<img src="${board.image}" alt="${board.name}"><h4>${board.name}</h4>`;
            card.addEventListener('click', () => {
                document.querySelectorAll('.board-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                selectedBoardForProject = board.id;
                modalCreateBtn.disabled = false;
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
            createdAt: now,
            modifiedAt: now
        });
        saveProjects(projects);
        window.location.href = `ide.html?project=${encodeURIComponent(projectName)}&board=${encodeURIComponent(selectedBoardForProject)}`;
    }
    
    function createNewSimulationProject() {
        const projectName = projectNameInput.value.trim();
        if (!projectName) return alert('Please enter a project name.');
        if (projects.some(p => p.name === projectName)) return alert('A project with this name already exists.');
        
        const now = Date.now();
        projects.push({
            name: projectName,
            boardId: 'simulation',
            createdAt: now,
            modifiedAt: now
        });
        saveProjects(projects);
        window.location.href = `simulation-ide.html?project=${encodeURIComponent(projectName)}`;
    }

    function handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const projectData = JSON.parse(e.target.result);
                const isSimProject = projectData.targets && projectData.stage;
                const projectName = isSimProject ? projectData.sprites[0]?.name || 'Imported-Sim' : projectData.projectName;
                const boardId = isSimProject ? 'simulation' : projectData.boardId;
                
                if (!projectName || !boardId) return alert("This does not appear to be a valid project file.");

                const handleImportLogic = () => {
                    const now = Date.now();
                    const newProject = { name: projectName, boardId, modifiedAt: now };
                    const existingIndex = projects.findIndex(p => p.name === projectName);
                    if (existingIndex !== -1) projects[existingIndex] = { ...projects[existingIndex], ...newProject };
                    else projects.push({ ...newProject, createdAt: now });
                    if (isSimProject) localStorage.setItem(`project_${projectName}`, JSON.stringify(projectData));
                    else {
                        localStorage.setItem(`project_workspace_${projectName}`, projectData.workspace);
                        if (projectData.extensions) localStorage.setItem(`project_extensions_${projectName}`, JSON.stringify(projectData.extensions));
                    }
                    saveProjects(projects);
                    renderProjectCards();
                };

                if (projects.some(p => p.name === projectName)) {
                    showCustomConfirm(`A project named "${projectName}" already exists. Overwrite it?`, (confirmed) => {
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
        importFileInput.value = '';
    }

    // --- Main Application Initialization ---
    createProjectBtn.addEventListener('click', openNewProjectModal);
    importProjectBtn.addEventListener('click', () => importFileInput.click());
    importFileInput.addEventListener('change', handleFileImport);
    infoModalCloseBtn.addEventListener('click', () => projectInfoModal.style.display = 'none');
    
    lightThemeBtn.addEventListener('click', () => setTheme('light'));
    darkThemeBtn.addEventListener('click', () => setTheme('dark'));
    contrastThemeBtn.addEventListener('click', () => setTheme('contrast'));

    // Initial load
    renderProjectCards();
    populateBoardSelection();
    setTheme(localStorage.getItem(THEME_KEY) || 'light');
});