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

// Utility: update step indicator text
function updateStepIndicator() {
    const indicator = document.getElementById('stepIndicator');
    if (!indicator) return;
    // Map step ids to a linear sequence (4 total logical steps)
    // Steps: 1 (awareness), 2 (eligibility checker), 3 (housing choice), 4 (result)
    let logicalStep = 1;
    if (String(currentStep).startsWith('4')) logicalStep = 4; else logicalStep = Number(currentStep) || 1;
    indicator.textContent = `Step ${logicalStep} of 4`;
}

function adjustHeaderForStep(stepNumber) {
    const headerEl = document.querySelector('.site-header');
    const isIntroStep = stepNumber === 1 || stepNumber === '1';
    if (headerEl) {
        headerEl.classList.toggle('compact', !isIntroStep);
    }
}

// Focus helper for accessibility
function focusFirstHeading(stepEl) {
    if (!stepEl) return;
    const h2 = stepEl.querySelector('h2, .step-title');
    if (h2) {
        h2.setAttribute('tabindex', '-1');
        h2.focus({ preventScroll: true });
    }
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
        updateStepIndicator();
        adjustHeaderForStep(stepNumber);
        // Scroll then focus for screen readers
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => focusFirstHeading(targetStep), 220);
    }
}

// Language Helpers
function applyStaticTranslations() {
    const titleEl = document.getElementById('titleText');
    const subEl = document.getElementById('subtitleText');

    if (titleEl) titleEl.textContent = t('title');
    if (subEl) subEl.textContent = t('subtitle');
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

    // Initialize translations
    applyStaticTranslations();
    
    // Start with step 1 and setup indicator
    updateStepIndicator();
    goToStep(1);
});
