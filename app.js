// ===================================
// Game State Management
// ===================================

let gameState = {
    teamName: '',
    selectedScenario: null, // { scenarioObj, issues: [], safeguards: [{text: '', tags: []}], reflection: {} }
    scenarios: []
};

// ===================================
// Initialize App
// ===================================

document.addEventListener('DOMContentLoaded', async () => {
    await loadScenarios();
    initializeEventListeners();
    loadFromLocalStorage();
});

// ===================================
// Load Scenarios from JSON
// ===================================

async function loadScenarios() {
    try {
        const response = await fetch('scenarios.json');
        const data = await response.json();
        gameState.scenarios = data.scenarios;
    } catch (error) {
        console.error('Error loading scenarios:', error);
        alert('Failed to load scenarios. Please refresh the page.');
    }
}

// ===================================
// Event Listeners
// ===================================

function initializeEventListeners() {
    // Welcome screen
    const teamNameInput = document.getElementById('team-name');
    const startBtn = document.getElementById('start-btn');

    teamNameInput.addEventListener('input', (e) => {
        startBtn.disabled = e.target.value.trim().length === 0;
    });

    startBtn.addEventListener('click', startGame);

    // Ethics screen
    document.getElementById('add-issue-btn').addEventListener('click', addIssue);
    document.getElementById('issue-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addIssue();
        }
    });

    document.getElementById('ethics-back-btn').addEventListener('click', () => {
        showScreen('selection-screen');
        renderScenariosGrid();
    });
    document.getElementById('ethics-next-btn').addEventListener('click', () => {
        showScreen('safeguards-screen');
        renderSafeguardsScreen();
    });

    // Safeguards screen
    document.getElementById('safeguards-back-btn').addEventListener('click', () => showScreen('ethics-screen'));
    document.getElementById('safeguards-next-btn').addEventListener('click', () => {
        showScreen('reflection-screen');
        renderReflectionScreen();
    });
    document.getElementById('add-safeguard-btn').addEventListener('click', addSafeguard);
    document.getElementById('safeguard-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addSafeguard();
        }
    });

    // Reflection screen
    document.getElementById('reflection-back-btn').addEventListener('click', () => showScreen('safeguards-screen'));
    document.getElementById('reflection-finish-btn').addEventListener('click', showSummary);
    document.getElementById('reflection-hardest').addEventListener('input', (e) => {
        if (!gameState.selectedScenario.reflection) gameState.selectedScenario.reflection = {};
        gameState.selectedScenario.reflection.hardest = e.target.value;
        saveToLocalStorage();
    });
    document.getElementById('reflection-disagreement').addEventListener('input', (e) => {
        if (!gameState.selectedScenario.reflection) gameState.selectedScenario.reflection = {};
        gameState.selectedScenario.reflection.disagreement = e.target.value;
        saveToLocalStorage();
    });
    document.getElementById('reflection-confidence').addEventListener('input', (e) => {
        if (!gameState.selectedScenario.reflection) gameState.selectedScenario.reflection = {};
        gameState.selectedScenario.reflection.confidence = e.target.value;
        document.getElementById('confidence-value').textContent = e.target.value;
        saveToLocalStorage();
    });

    // Summary screen
    document.getElementById('export-btn').addEventListener('click', exportResults);
    document.getElementById('restart-btn').addEventListener('click', restartGame);

    // Global Reset
    const resetLink = document.getElementById('reset-session-link');
    if (resetLink) {
        resetLink.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all progress and start fresh?')) {
                localStorage.removeItem('futureEthicsGameState');
                window.location.reload();
            }
        });
    }
}

// ===================================
// Game Flow Functions
// ===================================

function startGame() {
    const teamNameInput = document.getElementById('team-name');
    const inputTeamName = teamNameInput.value.trim();

    if (!inputTeamName) return;

    // If new team name entered, clear old progress
    if (gameState.teamName && gameState.teamName !== inputTeamName) {
        gameState.selectedScenario = null;
    }

    gameState.teamName = inputTeamName;
    saveToLocalStorage();

    // Resumption logic
    if (gameState.selectedScenario) {
        const { safeguards, issues, reflection } = gameState.selectedScenario;
        if (reflection && (reflection.hardest || reflection.disagreement)) {
            showSummary();
        } else if (safeguards && safeguards.length > 0) {
            showScreen('reflection-screen');
            renderReflectionScreen();
        } else if (issues.length > 0) {
            showScreen('safeguards-screen');
            renderSafeguardsScreen();
        } else {
            showScreen('ethics-screen');
            renderEthicsScreen();
        }
    } else {
        showScreen('selection-screen');
        renderScenariosGrid();
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    const screen = document.getElementById(screenId);
    if (screen) {
        screen.classList.add('active');
    }
    window.scrollTo(0, 0);
}

function renderScenariosGrid() {
    const grid = document.getElementById('scenarios-grid');
    grid.innerHTML = '';

    gameState.scenarios.forEach((scenario, index) => {
        const btn = document.createElement('button');
        btn.className = 'scenario-card-btn';
        btn.innerHTML = `
            <span class="card-index">Scenario ${index + 1}</span>
            <span class="card-title">${scenario.title}</span>
        `;
        btn.addEventListener('click', () => selectScenario(scenario));
        grid.appendChild(btn);
    });
}

function selectScenario(scenario) {
    gameState.selectedScenario = {
        scenarioObj: scenario,
        issues: [],
        safeguards: [],
        reflection: {}
    };

    saveToLocalStorage();
    showScreen('ethics-screen');
    renderEthicsScreen();
}

function renderEthicsScreen() {
    const { scenarioObj, issues } = gameState.selectedScenario;

    document.getElementById('ethics-scenario-title').textContent = scenarioObj.title;
    document.getElementById('ethics-story-text').textContent = scenarioObj.story;

    const signalsList = document.getElementById('ethics-signals-list');
    signalsList.innerHTML = '';
    scenarioObj.strongSignals.forEach(signal => {
        const li = document.createElement('li');
        li.textContent = signal;
        signalsList.appendChild(li);
    });

    // Render choices
    const choicesList = document.getElementById('ethics-choices-list');
    choicesList.innerHTML = '';
    scenarioObj.choices.forEach((choice, index) => {
        const choiceCard = document.createElement('div');
        choiceCard.className = 'choice-card';
        choiceCard.innerHTML = `
            <div class="choice-header">
                <span class="choice-number">${index + 1}</span>
                <strong>${choice.text}</strong>
            </div>
            <div class="choice-consequence">${choice.consequence}</div>
        `;
        choicesList.appendChild(choiceCard);
    });

    renderIssuesList();
}

function addIssue() {
    const input = document.getElementById('issue-input');
    const issueText = input.value.trim();

    if (issueText) {
        gameState.selectedScenario.issues.push(issueText);
        input.value = '';
        renderIssuesList();
        saveToLocalStorage();
    }
}

function deleteIssue(index) {
    gameState.selectedScenario.issues.splice(index, 1);
    renderIssuesList();
    saveToLocalStorage();
}

function renderIssuesList() {
    const list = document.getElementById('issues-list');
    const nextBtn = document.getElementById('ethics-next-btn');
    const issues = gameState.selectedScenario.issues;
    const countBadge = document.getElementById('issues-count');

    list.innerHTML = '';
    issues.forEach((issue, index) => {
        const item = document.createElement('div');
        item.className = 'issue-item';
        item.innerHTML = `
            <span class="issue-text">${issue}</span>
            <button class="delete-btn" onclick="deleteIssue(${index})">×</button>
        `;
        list.appendChild(item);
    });

    // Update count badge
    const count = issues.length;
    countBadge.textContent = `${count} issue${count !== 1 ? 's' : ''} identified`;
    countBadge.style.display = count > 0 ? 'inline-block' : 'none';

    nextBtn.disabled = issues.length === 0;
}

function renderSafeguardsScreen() {
    const { scenarioObj, issues } = gameState.selectedScenario;
    document.getElementById('safeguards-scenario-title').textContent = scenarioObj.title;

    const selectedIssuesList = document.getElementById('selected-issues-list');
    selectedIssuesList.innerHTML = '';
    issues.forEach(issue => {
        const li = document.createElement('li');
        li.textContent = issue;
        selectedIssuesList.appendChild(li);
    });

    renderSafeguardsList();
}

function addSafeguard() {
    const input = document.getElementById('safeguard-input');
    const safeguardText = input.value.trim();

    if (!safeguardText) return;

    // Get selected tags
    const selectedTags = [];
    document.querySelectorAll('.tag-checkboxes-inline input[type="checkbox"]:checked').forEach(checkbox => {
        selectedTags.push(checkbox.value);
    });

    // Add safeguard with tags
    gameState.selectedScenario.safeguards.push({
        text: safeguardText,
        tags: selectedTags
    });

    // Clear input and checkboxes
    input.value = '';
    document.querySelectorAll('.tag-checkboxes-inline input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    renderSafeguardsList();
    saveToLocalStorage();
}

function deleteSafeguard(index) {
    gameState.selectedScenario.safeguards.splice(index, 1);
    renderSafeguardsList();
    saveToLocalStorage();
}

function renderSafeguardsList() {
    const list = document.getElementById('safeguards-list');
    const nextBtn = document.getElementById('safeguards-next-btn');
    const safeguards = gameState.selectedScenario.safeguards;
    const countBadge = document.getElementById('safeguards-count');

    list.innerHTML = '';
    safeguards.forEach((safeguard, index) => {
        const item = document.createElement('div');
        item.className = 'safeguard-item';

        const tagsHtml = safeguard.tags.length > 0
            ? `<div class="safeguard-item-tags">${safeguard.tags.map(tag => `<span class="tag-pill-small">${tag}</span>`).join('')}</div>`
            : '';

        item.innerHTML = `
            <div class="safeguard-item-content">
                <span class="safeguard-text">${safeguard.text}</span>
                ${tagsHtml}
            </div>
            <button class="delete-btn" onclick="deleteSafeguard(${index})">×</button>
        `;
        list.appendChild(item);
    });

    // Update count badge
    const count = safeguards.length;
    countBadge.textContent = `${count} safeguard${count !== 1 ? 's' : ''} added`;
    countBadge.style.display = count > 0 ? 'inline-block' : 'none';

    nextBtn.disabled = safeguards.length === 0;
}

function renderReflectionScreen() {
    const { scenarioObj, reflection } = gameState.selectedScenario;
    document.getElementById('reflection-scenario-title').textContent = scenarioObj.title;

    // Restore reflection values
    document.getElementById('reflection-hardest').value = reflection?.hardest || '';
    document.getElementById('reflection-disagreement').value = reflection?.disagreement || '';
    document.getElementById('reflection-confidence').value = reflection?.confidence || 3;
    document.getElementById('confidence-value').textContent = reflection?.confidence || 3;
}

function showSummary() {
    showScreen('summary-screen');
    document.getElementById('team-name-display').textContent = `Team: ${gameState.teamName}`;

    const summaryContent = document.getElementById('summary-content');
    const { scenarioObj, issues, safeguards, reflection } = gameState.selectedScenario;

    const safeguardsHtml = safeguards.map(sg => {
        const tagsHtml = sg.tags.length > 0
            ? `<div class="summary-tags">${sg.tags.map(tag => `<span class="tag-pill">${tag}</span>`).join('')}</div>`
            : '';
        return `
            <div class="summary-safeguard-item">
                ${tagsHtml}
                <p>${sg.text}</p>
            </div>
        `;
    }).join('');

    const reflectionHtml = reflection && (reflection.hardest || reflection.disagreement)
        ? `
        <div class="summary-section">
            <h4>Team Reflection</h4>
            ${reflection.hardest ? `<p><strong>Hardest decision:</strong> ${reflection.hardest}</p>` : ''}
            ${reflection.disagreement ? `<p><strong>Points of disagreement:</strong> ${reflection.disagreement}</p>` : ''}
            ${reflection.confidence ? `<p><strong>Confidence level:</strong> ${reflection.confidence}/5</p>` : ''}
        </div>
        `
        : '';

    summaryContent.innerHTML = `
        <div class="summary-scenario">
            <h3>Selected Scenario: ${scenarioObj.title}</h3>

            <div class="summary-section">
                <h4>Ethical Issues Identified</h4>
                <ul>
                    ${issues.map(issue => `<li>${issue}</li>`).join('')}
                </ul>
            </div>

            <div class="summary-section">
                <h4>Proposed Safeguards & Guidelines</h4>
                ${safeguardsHtml}
            </div>

            ${reflectionHtml}
        </div>
    `;

    // Save to Airtable
    saveToAirtable();
}

function exportResults() {
    const { scenarioObj, issues, safeguards, reflection } = gameState.selectedScenario;
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const safeguardsHtml = safeguards.map(sg => {
        const tags = sg.tags.length > 0
            ? `<div style="margin-bottom:4px">${sg.tags.map(t => `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px">${t}</span>`).join('')}</div>`
            : '';
        return `<li style="margin-bottom:10px">${tags}${sg.text}</li>`;
    }).join('');

    const reflectionHtml = reflection && (reflection.hardest || reflection.disagreement)
        ? `
        <h2 style="color:#4f46e5;border-bottom:2px solid #e0e7ff;padding-bottom:6px">Team Reflection</h2>
        ${reflection.hardest ? `<p><strong>Hardest decision:</strong> ${reflection.hardest}</p>` : ''}
        ${reflection.disagreement ? `<p><strong>Points of disagreement:</strong> ${reflection.disagreement}</p>` : ''}
        ${reflection.confidence ? `<p><strong>Confidence level:</strong> ${reflection.confidence} / 5</p>` : ''}
        `
        : '';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Future Ethics Report - ${gameState.teamName}</title>
<style>
  body { font-family: 'Segoe UI', system-ui, sans-serif; max-width: 700px; margin: 40px auto; padding: 0 24px; color: #1e293b; line-height: 1.6; }
  h1 { color: #1e1b4b; margin-bottom: 4px; }
  .meta { color: #64748b; margin-bottom: 32px; font-size: 14px; }
  h2 { color: #4f46e5; border-bottom: 2px solid #e0e7ff; padding-bottom: 6px; }
  ul { padding-left: 20px; }
  li { margin-bottom: 8px; }
  .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
  <h1>Future Ethics Roadmap</h1>
  <div class="meta">${gameState.teamName} &bull; ${date} &bull; Poynter Institute Workshop</div>

  <h2>Scenario: ${scenarioObj.title}</h2>
  <p>${scenarioObj.story}</p>

  <h2>Ethical Issues Identified</h2>
  <ul>${issues.map(i => `<li>${i}</li>`).join('')}</ul>

  <h2>Proposed Safeguards &amp; Guidelines</h2>
  <ul>${safeguardsHtml}</ul>

  ${reflectionHtml}

  <div class="footer">Exported from the Future Ethics Decision Game &bull; Poynter Institute</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `Future-Ethics-Report-${gameState.teamName.replace(/\s+/g, '-')}.html`;
    link.click();

    URL.revokeObjectURL(url);
}

function restartGame() {
    if (confirm('Start a new session? This will clear the current team\'s data.')) {
        gameState = {
            teamName: '',
            selectedScenario: null,
            scenarios: gameState.scenarios
        };

        localStorage.removeItem('futureEthicsGameState');
        document.getElementById('team-name').value = '';
        document.getElementById('start-btn').innerHTML = 'Begin Journey <span class="btn-arrow">→</span>';
        showScreen('welcome-screen');
    }
}

// ===================================
// Airtable Integration
// ===================================

async function saveToAirtable() {
    // Check if Airtable is configured
    if (!AIRTABLE_CONFIG.apiKey || AIRTABLE_CONFIG.apiKey === 'YOUR_AIRTABLE_API_KEY_HERE') {
        console.warn('Airtable not configured. Skipping save.');
        return;
    }

    showLoading(true);

    const { scenarioObj, issues, safeguards, reflection } = gameState.selectedScenario;

    // Format safeguards with tags
    const safeguardsFormatted = safeguards.map(sg => {
        const tagStr = sg.tags.length > 0 ? ` [${sg.tags.join(', ')}]` : '';
        return `${sg.text}${tagStr}`;
    }).join('\n\n');

    const record = {
        fields: {
            'Team Name': gameState.teamName.trim(),
            'Scenario': scenarioObj.title,
            'Ethical Issues': issues.map(i => i.trim()).join('\n'),
            'Safeguards': safeguardsFormatted,
            'Reflection Hardest': reflection?.hardest || '',
            'Reflection Disagreement': reflection?.disagreement || '',
            'Reflection Confidence': reflection?.confidence ? parseInt(reflection.confidence) : 3,
            'Timestamp': new Date().toISOString()
        }
    };


    try {
        const response = await fetch(AIRTABLE_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error?.message || `Error ${response.status}: ${response.statusText}`;
            throw new Error(errorMessage);
        }

        console.log('Successfully saved to Airtable');
        showAirtableSuccess();
    } catch (error) {
        console.error('Airtable save error:', error);
        showAirtableError(error.message);
    } finally {
        showLoading(false);
    }
}

function showAirtableSuccess() {
    const status = document.createElement('div');
    status.className = 'airtable-status-toast success';
    status.innerHTML = '✓ Saved to Airtable';
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 3000);
}

function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (show) {
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}

function showAirtableError(message) {
    // Create temporary error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(239, 68, 68, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        z-index: 2000;
        max-width: 400px;
    `;
    notification.innerHTML = `
        <strong>Airtable Error:</strong><br>
        ${message}<br>
        <small>Decision saved locally.</small>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===================================
// Local Storage (Backup)
// ===================================

function saveToLocalStorage() {
    try {
        localStorage.setItem('futureEthicsGameState', JSON.stringify(gameState));
        showSaveIndicator();
    } catch (error) {
        console.error('Failed to save to local storage:', error);
    }
}

function showSaveIndicator() {
    // Remove any existing indicator
    const existing = document.querySelector('.save-indicator');
    if (existing) existing.remove();

    const indicator = document.createElement('div');
    indicator.className = 'save-indicator';
    indicator.innerHTML = '✓ Saved';
    document.body.appendChild(indicator);

    // Trigger animation
    setTimeout(() => indicator.classList.add('show'), 10);

    // Remove after 2 seconds
    setTimeout(() => {
        indicator.classList.remove('show');
        setTimeout(() => indicator.remove(), 300);
    }, 2000);
}

function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('futureEthicsGameState');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Only restore if scenarios are loaded
            if (gameState.scenarios.length > 0) {
                gameState = {
                    ...parsed,
                    scenarios: gameState.scenarios
                };

                // Pre-fill welcome screen if team name exists
                if (gameState.teamName) {
                    const teamNameInput = document.getElementById('team-name');
                    const startBtn = document.getElementById('start-btn');
                    if (teamNameInput && startBtn) {
                        teamNameInput.value = gameState.teamName;
                        startBtn.disabled = false;

                        // Change button text to indicate resumption
                        startBtn.innerHTML = `Resume Journey <span class="btn-arrow">→</span>`;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Failed to load from local storage:', error);
    }
}
