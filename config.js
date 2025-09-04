// Configuration file for Speedrun Application Form
// Password is now handled by Vercel backend - not stored here!

const CONFIG = {
    // API endpoint for authentication
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/auth'
        : '/api/auth',
    
    // Storage keys
    STORAGE_KEY: 'speedrunFormData',
    SESSION_KEY: 'speedrunAuthenticated',
    
    // Form settings
    AUTO_SAVE_DELAY: 500,
    SAVE_INDICATOR_DURATION: 2000,
    
    // Word limits
    WORD_LIMITS: {
        oneLiner: 10,
        description: 100,
        additionalInfo: 100,
        teamExperience: 100
    },
    
    // Token storage key
    AUTH_TOKEN_KEY: 'speedrunAuthToken'
};

window.APP_CONFIG = CONFIG;