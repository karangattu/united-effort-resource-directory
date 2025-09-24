// GA Assistance Questionnaire Application
let currentStep = 1;
let userResponses = {
    knowsAboutGA: null,
    housingStatus: null,
    paysUtilities: null
};

// i18n - Simplified for questionnaire
const i18n = {
  en: {
    title: 'The United Effort Resource Directory',
    subtitle: 'Let\'s help you find the right assistance'
  },
  es: {
    title: 'Directorio de Recursos de United Effort',
    subtitle: 'Te ayudamos a encontrar la asistencia correcta'
  },
  zh: {
    title: '联合努力资源目录',
    subtitle: '让我们帮您找到合适的援助'
  }
};

let currentLang = localStorage.getItem('ued-lang') || 'en';

function t(path) {
  const parts = path.split('.');
  let obj = i18n[currentLang] || i18n.en;
  for (const p of parts) obj = obj?.[p];
  return obj ?? path;
}

// Questionnaire Functions
function handleGAResponse(knowsGA) {
    userResponses.knowsAboutGA = knowsGA;
    
    if (knowsGA) {
        // User knows about GA, go to housing question
        goToStep(3);
    } else {
        // User doesn't know about GA, show benefits checker
        goToStep(2);
    }
}

function handleHousingStatus(status) {
    userResponses.housingStatus = status;
    
    if (status === 'unhoused') {
        goToStep('4-unhoused');
    } else if (status === 'housed') {
        goToStep('4-housed');
    }
}

function showUtilityHelp(paysUtilities) {
    userResponses.paysUtilities = paysUtilities;
    const utilityInfo = document.getElementById('utilityInfo');
    
    if (paysUtilities) {
        utilityInfo.style.display = 'block';
        utilityInfo.style.animation = 'fadeInUp 0.3s ease';
    } else {
        utilityInfo.style.display = 'none';
    }
}

function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.questionnaire-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
        
        // Scroll to top smoothly
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Theme and Language Functions
function applyStaticTranslations() {
    const titleEl = document.getElementById('titleText');
    const subEl = document.getElementById('subtitleText');

    if (titleEl) titleEl.textContent = t('title');
    if (subEl) subEl.textContent = t('subtitle');
}

function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
        body.classList.add('theme-dark');
        document.getElementById('themeToggle').textContent = '☀️';
    } else {
        body.classList.remove('theme-dark');
        document.getElementById('themeToggle').textContent = '🌙';
    }
}

function initTheme() {
    const saved = localStorage.getItem('ued-theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
}

// Initialize Application
window.addEventListener('DOMContentLoaded', () => {
    // Language switch
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', () => {
            currentLang = langSelect.value;
            localStorage.setItem('ued-lang', currentLang);
            applyStaticTranslations();
        });
    }

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('theme-dark');
        localStorage.setItem('ued-theme', isDark ? 'dark' : 'light');
        document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
    });

    // Initialize theme and translations
    initTheme();
    applyStaticTranslations();
    
    // Start with step 1
    goToStep(1);
});
