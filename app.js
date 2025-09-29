let questionnaireData = null;
let currentStep = null;
let userResponses = {};

const i18n = {
  en: {
    title: 'United Effort Benefit Navigator',
    subtitle: 'Answer a few quick questions to discover cash & housing assistance you may qualify for.'
  },
  es: {
    title: 'Navegador de Beneficios de United Effort',
    subtitle: 'Responda algunas preguntas rápidas para descubrir la asistencia en efectivo y vivienda para la que puede calificar.'
  },
  zh: {
    title: '联合努力福利导航',
    subtitle: '回答几个简单的问题，了解您可能有资格获得的现金和住房援助。'
  }
};

let currentLang = localStorage.getItem('ued-lang') || 'en';

function t(path) {
  const parts = path.split('.');
  let obj = i18n[currentLang] || i18n.en;
  for (const p of parts) obj = obj?.[p];
  return obj ?? path;
}

async function loadQuestionnaire() {
    try {
        const response = await fetch('questionnaire.json');
        if (!response.ok) throw new Error('Failed to load questionnaire');
        questionnaireData = await response.json();
        return true;
    } catch (error) {
        console.error('Error loading questionnaire:', error);
        showError('Failed to load questionnaire. Please refresh the page.');
        return false;
    }
}

function showError(message) {
    const container = document.getElementById('mainContent');
    if (container) {
        container.innerHTML = `
            <div class="question-card" style="text-align: center; color: #b91c1c;">
                <h2>⚠️ Error</h2>
                <p>${message}</p>
            </div>
        `;
    }
}

function renderStep(stepId) {
    const stepData = questionnaireData.steps[stepId];
    if (!stepData) {
        console.error(`Step ${stepId} not found in questionnaire data`);
        return;
    }

    const container = document.getElementById('mainContent');
    container.innerHTML = '';

    const stepDiv = document.createElement('div');
    stepDiv.className = 'questionnaire-step active';
    stepDiv.id = `step${stepId}`;

    let html = `<div class="question-card">`;
    html += `<h2 class="step-title">${stepData.title}</h2>`;

    if (stepData.questionText) {
        html += `<p class="question-text">${stepData.questionText}</p>`;
    }

    if (stepData.helpText) {
        html += `<p class="help-text">${stepData.helpText}</p>`;
    }

    switch (stepData.type) {
        case 'choice':
            html += renderChoiceStep(stepData);
            break;
        case 'info':
            html += renderInfoStep(stepData);
            break;
        case 'result':
            html += renderResultStep(stepData);
            break;
    }

    html += `</div>`;
    stepDiv.innerHTML = html;
    container.appendChild(stepDiv);

    attachStepListeners(stepId, stepData);
}

function renderChoiceStep(stepData) {
    let html = `<div class="answer-buttons">`;
    
    stepData.answers.forEach((answer, index) => {
        const cssClass = answer.cssClass || 'answer-btn';
        html += `
            <button class="answer-btn ${cssClass}" data-answer-index="${index}">
                ${answer.text}
            </button>
        `;
    });
    
    html += `</div>`;

    if (stepData.navigation) {
        html += renderNavigation(stepData.navigation);
    }

    return html;
}

function renderInfoStep(stepData) {
    let html = `<div class="info-box">`;
    
    if (stepData.infoBox) {
        html += `<p>${stepData.infoBox.text}</p>`;
        html += `
            <a href="${stepData.infoBox.linkUrl}" 
               class="external-link-btn" 
               target="${stepData.infoBox.linkTarget || '_self'}"
               rel="${stepData.infoBox.linkTarget === '_blank' ? 'noopener noreferrer' : ''}">
                ${stepData.infoBox.linkText}
            </a>
        `;
    }
    
    html += `</div>`;

    if (stepData.navigation) {
        html += renderNavigation(stepData.navigation);
    }

    return html;
}

function renderResultStep(stepData) {
    let html = `<div class="assistance-info">`;

    if (stepData.benefits && stepData.benefits.length > 0) {
        stepData.benefits.forEach((benefit, index) => {
            if (benefit.type === 'conditional') {
                html += renderConditionalBenefit(benefit, index);
            } else {
                html += renderBenefit(benefit);
            }
        });
    }

    if (stepData.contact) {
        html += renderContactBox(stepData.contact);
    }

    html += `</div>`;

    if (stepData.navigation) {
        html += renderNavigation(stepData.navigation);
    }

    return html;
}

function renderBenefit(benefit) {
    let html = `<div class="benefit-box">`;
    html += `<h3>${benefit.icon || ''} ${benefit.title}</h3>`;
    html += `<p>${benefit.description}</p>`;
    
    if (benefit.checklist && benefit.checklist.length > 0) {
        html += `<ul class="checklist">`;
        benefit.checklist.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += `</ul>`;
    }
    
    html += `</div>`;
    return html;
}

function renderConditionalBenefit(benefit, index) {
    let html = `<div class="benefit-box utilities-box">`;
    html += `<h3>${benefit.icon || ''} ${benefit.title}</h3>`;
    html += `<p class="question-text">${benefit.questionText}</p>`;
    html += `<div class="utility-buttons">`;
    
    benefit.answers.forEach((answer, answerIndex) => {
        const cssClass = answer.cssClass || 'utility-btn';
        html += `
            <button class="utility-btn ${cssClass}" data-benefit-index="${index}" data-answer-index="${answerIndex}">
                ${answer.text}
            </button>
        `;
    });
    
    html += `</div>`;
    html += `<div class="utility-info" id="utilityInfo${index}" style="display: none;"></div>`;
    html += `</div>`;
    return html;
}

function renderContactBox(contact) {
    let html = `<div class="contact-box">`;
    html += `<h3>${contact.title}</h3>`;
    html += `<p>${contact.description}</p>`;
    html += `<div class="contact-info" aria-label="Contact information">`;
    html += `<p><strong>${contact.organizationName}</strong></p>`;
    html += `<p><a href="mailto:${contact.email}">${contact.email}</a></p>`;
    html += `<p><a href="tel:${contact.phone.replace(/\s/g, '')}">${contact.phone}</a></p>`;
    
    if (contact.address) {
        html += `<address>`;
        if (contact.address.line1) html += `${contact.address.line1}<br>`;
        if (contact.address.line2) html += `${contact.address.line2}<br>`;
        if (contact.address.line3) html += `${contact.address.line3}`;
        html += `</address>`;
    }
    
    html += `</div></div>`;
    return html;
}

function renderNavigation(nav) {
    let html = `<div class="navigation-buttons">`;
    
    if (nav.showBack) {
        html += `
            <button class="nav-btn back-btn" data-back-step="${nav.backStep}">
                ← Back
            </button>
        `;
    }
    
    if (nav.showContinue) {
        html += `
            <button class="nav-btn continue-btn" data-continue-step="${nav.continueStep}">
                ${nav.continueText || 'Continue →'}
            </button>
        `;
    }
    
    if (nav.showRestart) {
        html += `
            <button class="nav-btn restart-btn" data-restart="true">
                Start Over
            </button>
        `;
    }
    
    html += `</div>`;
    return html;
}

function attachStepListeners(stepId, stepData) {
    document.querySelectorAll('.answer-btn[data-answer-index]').forEach(button => {
        button.addEventListener('click', () => {
            const answerIndex = parseInt(button.dataset.answerIndex);
            const answer = stepData.answers[answerIndex];
            userResponses[stepId] = answer.value;
            if (answer.nextStep) {
                goToStep(answer.nextStep);
            }
        });
    });

    document.querySelectorAll('.utility-btn[data-benefit-index]').forEach(button => {
        button.addEventListener('click', () => {
            const benefitIndex = parseInt(button.dataset.benefitIndex);
            const answerIndex = parseInt(button.dataset.answerIndex);
            const benefit = stepData.benefits[benefitIndex];
            const answer = benefit.answers[answerIndex];
            
            const infoDiv = document.getElementById(`utilityInfo${benefitIndex}`);
            if (answer.showInfo && answer.infoText) {
                infoDiv.innerHTML = `<p>${answer.infoText}</p>`;
                infoDiv.style.display = 'block';
                infoDiv.style.animation = 'fadeInUp 0.3s ease';
            } else {
                infoDiv.style.display = 'none';
            }
            
            userResponses[`${stepId}_benefit_${benefitIndex}`] = answer.value;
        });
    });

    document.querySelectorAll('.nav-btn[data-back-step]').forEach(button => {
        button.addEventListener('click', () => {
            goToStep(button.dataset.backStep);
        });
    });

    document.querySelectorAll('.nav-btn[data-continue-step]').forEach(button => {
        button.addEventListener('click', () => {
            goToStep(button.dataset.continueStep);
        });
    });

    document.querySelectorAll('.nav-btn[data-restart]').forEach(button => {
        button.addEventListener('click', () => {
            userResponses = {};
            goToStep(questionnaireData.settings.startStep);
        });
    });
}

function updateStepIndicator() {
    const indicator = document.getElementById('stepIndicator');
    if (!indicator || !questionnaireData) return;
    
    const stepId = String(currentStep);
    let logicalStep = 1;
    
    if (stepId.startsWith('4')) {
        logicalStep = 4;
    } else {
        logicalStep = parseInt(stepId) || 1;
    }
    
    const totalSteps = questionnaireData.settings.totalSteps || 4;
    indicator.textContent = `Step ${logicalStep} of ${totalSteps}`;
}

function adjustHeaderForStep(stepNumber) {
    const headerEl = document.querySelector('.site-header');
    const isIntroStep = stepNumber === 1 || stepNumber === '1';
    if (headerEl) {
        headerEl.classList.toggle('compact', !isIntroStep);
    }
}

function focusFirstHeading(stepEl) {
    if (!stepEl) return;
    const h2 = stepEl.querySelector('h2, .step-title');
    if (h2) {
        h2.setAttribute('tabindex', '-1');
        h2.focus({ preventScroll: true });
    }
}

function goToStep(stepNumber) {
    if (!questionnaireData) {
        console.error('Questionnaire data not loaded');
        return;
    }

    currentStep = stepNumber;
    renderStep(stepNumber);
    updateStepIndicator();
    adjustHeaderForStep(stepNumber);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
        const stepEl = document.querySelector('.questionnaire-step.active');
        focusFirstHeading(stepEl);
    }, 220);
}

function applyStaticTranslations() {
    const titleEl = document.getElementById('titleText');
    const subEl = document.getElementById('subtitleText');

    if (titleEl) titleEl.textContent = t('title');
    if (subEl) subEl.textContent = t('subtitle');
}

window.addEventListener('DOMContentLoaded', async () => {
    const loaded = await loadQuestionnaire();
    if (!loaded) return;

    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', () => {
            currentLang = langSelect.value;
            localStorage.setItem('ued-lang', currentLang);
            applyStaticTranslations();
        });
    }

    applyStaticTranslations();
    
    const startStep = questionnaireData.settings.startStep || '1';
    goToStep(startStep);
});
