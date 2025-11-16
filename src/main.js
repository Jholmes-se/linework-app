// Main entry point for the Linework application

import { LineworkApp } from './core/app.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.lineworkApp = new LineworkApp();
});
