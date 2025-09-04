// TypeScript types
interface FormData {
    timestamp: string;
    fields: Record<string, any>;
    cofounders: CofounderData[];
}

interface CofounderData {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    linkedIn: string;
}

interface AppConfig {
    PASSWORD: string;
    STORAGE_KEY: string;
    SESSION_KEY: string;
    AUTO_SAVE_DELAY: number;
    SAVE_INDICATOR_DURATION: number;
    WORD_LIMITS: Record<string, number>;
}

declare global {
    interface Window {
        APP_CONFIG: AppConfig;
        checkPassword: () => void;
        logout: () => void;
        saveForm: () => void;
        addCofounder: (savedData?: CofounderData | null) => void;
        removeCofounder: (number: number) => void;
    }
}

// Get config from external file
const CONFIG = window.APP_CONFIG;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthentication();
    setupEventListeners();
    initializeWordCounters();
    loadSavedData();
});

// Password Protection with Vercel Backend
async function checkAuthentication(): Promise<void> {
    // Check for stored auth token
    const token = localStorage.getItem(CONFIG.AUTH_TOKEN_KEY);
    
    if (token) {
        // Verify token with backend
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', token })
            });
            
            const data = await response.json();
            if (data.valid) {
                showMainContent();
                return;
            }
        } catch (error) {
            console.error('Token verification failed:', error);
        }
        
        // Token invalid or expired
        localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    }
    
    // Show password modal
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'flex';
}

async function checkPassword(): Promise<void> {
    const input = (document.getElementById('passwordInput') as HTMLInputElement)?.value;
    const errorDiv = document.getElementById('passwordError');
    
    if (!input) {
        if (errorDiv) {
            errorDiv.textContent = 'Please enter a password.';
            errorDiv.style.display = 'block';
        }
        return;
    }
    
    try {
        // Show loading state
        const submitBtn = document.querySelector('.modal-content button') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.textContent = 'Checking...';
            submitBtn.disabled = true;
        }
        
        // Send password to backend
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'login', password: input })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Store token
            localStorage.setItem(CONFIG.AUTH_TOKEN_KEY, data.token);
            sessionStorage.setItem(CONFIG.SESSION_KEY, 'true');
            showMainContent();
        } else {
            if (errorDiv) {
                errorDiv.textContent = data.message || 'Incorrect password. Please try again.';
                errorDiv.style.display = 'block';
            }
            const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
            if (passwordInput) passwordInput.value = '';
        }
    } catch (error) {
        if (errorDiv) {
            errorDiv.textContent = 'Connection error. Please try again.';
            errorDiv.style.display = 'block';
        }
    } finally {
        // Reset button
        const submitBtn = document.querySelector('.modal-content button') as HTMLButtonElement;
        if (submitBtn) {
            submitBtn.textContent = 'Submit';
            submitBtn.disabled = false;
        }
    }
}

function showMainContent(): void {
    const modal = document.getElementById('passwordModal');
    const mainContent = document.getElementById('mainContent');
    if (modal) modal.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
}

function logout(): void {
    sessionStorage.removeItem(CONFIG.SESSION_KEY);
    localStorage.removeItem(CONFIG.AUTH_TOKEN_KEY);
    location.reload();
}

// Event Listeners Setup
function setupEventListeners(): void {
    // Password input enter key
    const passwordInput = document.getElementById('passwordInput');
    passwordInput?.addEventListener('keypress', function(e: KeyboardEvent) {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // Auto-save on all form inputs
    const form = document.getElementById('applicationForm') as HTMLFormElement;
    if (form) {
        // Text inputs, selects, and textareas
        form.querySelectorAll('input, select, textarea').forEach((element: Element) => {
            const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            el.addEventListener('change', autoSave);
            if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                if (el.type === 'text' || el.type === 'email' || el.type === 'tel' || 
                    el.type === 'url' || el.tagName === 'TEXTAREA') {
                    el.addEventListener('input', debounce(autoSave, CONFIG.AUTO_SAVE_DELAY));
                }
            }
        });

        // Radio buttons
        form.querySelectorAll('input[type="radio"]').forEach((radio: Element) => {
            radio.addEventListener('change', autoSave);
        });

        // Form submission
        form.addEventListener('submit', handleSubmit);
    }
}

// Auto-save Function
function autoSave(): void {
    const formData = collectFormData();
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(formData));
    showSaveIndicator();
}

function saveForm(): void {
    autoSave();
}

function showSaveIndicator(): void {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
        indicator.classList.add('show');
        setTimeout(() => {
            indicator.classList.remove('show');
        }, CONFIG.SAVE_INDICATOR_DURATION);
    }
}

// Collect Form Data
function collectFormData(): FormData {
    const form = document.getElementById('applicationForm') as HTMLFormElement;
    const data: FormData = {
        timestamp: new Date().toISOString(),
        fields: {},
        cofounders: []
    };

    // Collect all regular form fields
    form.querySelectorAll('input, select, textarea').forEach((element: Element) => {
        const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (el.name && !el.name.startsWith('cofounder')) {
            if (el instanceof HTMLInputElement) {
                if (el.type === 'radio') {
                    if (el.checked) {
                        data.fields[el.name] = el.value;
                    }
                } else if (el.type === 'checkbox') {
                    data.fields[el.name] = el.checked;
                } else if (el.type !== 'file') {
                    data.fields[el.name] = el.value;
                }
            } else {
                data.fields[el.name] = el.value;
            }
        }
    });

    // Collect cofounder data
    const cofounderCards = document.querySelectorAll('.cofounder-card');
    cofounderCards.forEach((card: Element, index: number) => {
        const cofounderData: any = {};
        card.querySelectorAll('input').forEach((input: HTMLInputElement) => {
            const fieldName = input.name.replace(`cofounder${index}_`, '');
            cofounderData[fieldName] = input.value;
        });
        data.cofounders.push(cofounderData);
    });

    return data;
}

// Load Saved Data
function loadSavedData(): void {
    const savedData = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (savedData) {
        try {
            const data: FormData = JSON.parse(savedData);
            
            // Load regular fields
            Object.keys(data.fields).forEach(fieldName => {
                const element = document.querySelector(`[name="${fieldName}"]`);
                if (element) {
                    if (element instanceof HTMLInputElement) {
                        if (element.type === 'radio') {
                            const radio = document.querySelector(`[name="${fieldName}"][value="${data.fields[fieldName]}"]`) as HTMLInputElement;
                            if (radio) radio.checked = true;
                        } else if (element.type === 'checkbox') {
                            element.checked = data.fields[fieldName];
                        } else {
                            element.value = data.fields[fieldName];
                        }
                    } else if (element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement) {
                        element.value = data.fields[fieldName];
                    }
                }
            });

            // Load cofounders
            if (data.cofounders && data.cofounders.length > 0) {
                data.cofounders.forEach((cofounderData: CofounderData) => {
                    addCofounder(cofounderData);
                });
            }

            // Update word counters
            updateAllWordCounters();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Co-founder Management
let cofounderCount = 0;

function addCofounder(savedData: CofounderData | null = null): void {
    const container = document.getElementById('cofoundersContainer');
    if (!container) return;
    
    const cofounderNumber = ++cofounderCount;
    
    const cofounderHTML = `
        <div class="founder-card cofounder-card" data-cofounder="${cofounderNumber}">
            <h3>Co-Founder ${cofounderNumber}</h3>
            <button type="button" class="remove-cofounder-btn" onclick="removeCofounder(${cofounderNumber})">Remove</button>
            <div class="founder-grid">
                <div class="form-group">
                    <label for="cofounder${cofounderNumber}_firstName">First Name *</label>
                    <input type="text" id="cofounder${cofounderNumber}_firstName" name="cofounder${cofounderNumber}_firstName" required>
                </div>
                <div class="form-group">
                    <label for="cofounder${cofounderNumber}_lastName">Last Name *</label>
                    <input type="text" id="cofounder${cofounderNumber}_lastName" name="cofounder${cofounderNumber}_lastName" required>
                </div>
                <div class="form-group">
                    <label for="cofounder${cofounderNumber}_email">Email *</label>
                    <input type="email" id="cofounder${cofounderNumber}_email" name="cofounder${cofounderNumber}_email" required>
                </div>
                <div class="form-group">
                    <label for="cofounder${cofounderNumber}_phone">Phone Number</label>
                    <input type="tel" id="cofounder${cofounderNumber}_phone" name="cofounder${cofounderNumber}_phone">
                </div>
                <div class="form-group">
                    <label for="cofounder${cofounderNumber}_linkedIn">LinkedIn URL *</label>
                    <input type="url" id="cofounder${cofounderNumber}_linkedIn" name="cofounder${cofounderNumber}_linkedIn" required>
                </div>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', cofounderHTML);
    
    // Add event listeners to new fields
    const newCard = container.lastElementChild;
    if (newCard) {
        newCard.querySelectorAll('input').forEach((element: Element) => {
            const input = element as HTMLInputElement;
            input.addEventListener('change', autoSave);
            if (input.type === 'text' || input.type === 'email' || input.type === 'tel' || input.type === 'url') {
                input.addEventListener('input', debounce(autoSave, CONFIG.AUTO_SAVE_DELAY));
            }
        });
        
        // Load saved data if provided
        if (savedData) {
            Object.keys(savedData).forEach(key => {
                const input = newCard.querySelector(`[name="cofounder${cofounderNumber}_${key}"]`) as HTMLInputElement;
                if (input) {
                    input.value = (savedData as any)[key];
                }
            });
        }
    }
    
    autoSave();
}

function removeCofounder(number: number): void {
    const card = document.querySelector(`[data-cofounder="${number}"]`);
    if (card && confirm('Are you sure you want to remove this co-founder?')) {
        card.remove();
        renumberCofounders();
        autoSave();
    }
}

function renumberCofounders(): void {
    const cards = document.querySelectorAll('.cofounder-card');
    cofounderCount = 0;
    
    cards.forEach((card: Element) => {
        const newNumber = ++cofounderCount;
        card.setAttribute('data-cofounder', newNumber.toString());
        const h3 = card.querySelector('h3');
        if (h3) h3.textContent = `Co-Founder ${newNumber}`;
        
        // Update remove button
        const removeBtn = card.querySelector('.remove-cofounder-btn') as HTMLButtonElement;
        if (removeBtn) {
            removeBtn.setAttribute('onclick', `removeCofounder(${newNumber})`);
        }
        
        // Update all input names and IDs
        card.querySelectorAll('input').forEach((input: HTMLInputElement) => {
            const oldName = input.name;
            const fieldName = oldName.substring(oldName.indexOf('_') + 1);
            input.name = `cofounder${newNumber}_${fieldName}`;
            input.id = `cofounder${newNumber}_${fieldName}`;
            
            // Update label
            const label = card.querySelector(`label[for="${oldName.replace('name', 'id')}"]`);
            if (label) {
                label.setAttribute('for', input.id);
            }
        });
    });
}

// Word Counter
function initializeWordCounters(): void {
    document.querySelectorAll('.word-counter').forEach((counter: Element) => {
        const el = counter as HTMLElement;
        const fieldId = el.dataset.field;
        const limit = parseInt(el.dataset.limit || '100');
        const field = document.getElementById(fieldId || '');
        
        if (field) {
            field.addEventListener('input', () => updateWordCounter(fieldId || '', limit));
            updateWordCounter(fieldId || '', limit);
        }
    });
}

function updateWordCounter(fieldId: string, limit: number): void {
    const field = document.getElementById(fieldId) as HTMLInputElement | HTMLTextAreaElement;
    const counter = document.querySelector(`.word-counter[data-field="${fieldId}"]`);
    
    if (field && counter) {
        const text = field.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        
        counter.textContent = `${words}/${limit} words`;
        
        // Update styling based on word count
        counter.classList.remove('warning', 'error');
        if (words > limit) {
            counter.classList.add('error');
        } else if (words > limit * 0.8) {
            counter.classList.add('warning');
        }
    }
}

function updateAllWordCounters(): void {
    document.querySelectorAll('.word-counter').forEach((counter: Element) => {
        const el = counter as HTMLElement;
        const fieldId = el.dataset.field;
        const limit = parseInt(el.dataset.limit || '100');
        if (fieldId) {
            updateWordCounter(fieldId, limit);
        }
    });
}

// Form Submission
function handleSubmit(e: Event): void {
    e.preventDefault();
    
    // Validate required fields
    const form = e.target as HTMLFormElement;
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Collect and save data
    const formData = collectFormData();
    
    // Here you would normally send the data to a server
    // For now, we'll just save it and show a confirmation
    localStorage.setItem(CONFIG.STORAGE_KEY + '_submitted', JSON.stringify({
        ...formData,
        submittedAt: new Date().toISOString()
    }));
    
    alert('Application submitted successfully! Your data has been saved.');
    
    // Optionally clear the form
    if (confirm('Would you like to clear the form for a new application?')) {
        form.reset();
        const container = document.getElementById('cofoundersContainer');
        if (container) container.innerHTML = '';
        cofounderCount = 0;
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        updateAllWordCounters();
    }
}

// Utility Functions
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    } as T;
}

// Expose functions to window for HTML onclick handlers
window.checkPassword = checkPassword;
window.logout = logout;
window.saveForm = saveForm;
window.addCofounder = addCofounder;
window.removeCofounder = removeCofounder;