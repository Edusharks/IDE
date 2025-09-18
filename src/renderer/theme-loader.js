// This script's only job is to read the theme from localStorage
// and apply it to the <html> tag before the rest of the page loads.
const savedTheme = localStorage.getItem('blockIdeTheme') || 'light';
document.documentElement.setAttribute('data-theme', savedTheme);