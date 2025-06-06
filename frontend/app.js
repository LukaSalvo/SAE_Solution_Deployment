// Configuration et constantes
const CONFIG = {
    API_ENDPOINT: 'http://localhost:8080/upload',
    PREDEFINED_SENTENCES: [
        "Le soleil brille aujourd'hui.",
        "La lune éclaire la nuit.",
        "Les étoiles scintillent dans le ciel.",
        "Le vent souffle doucement.",
        "La rivière coule paisiblement.",
        "Les oiseaux chantent au matin.",
        "La forêt est pleine de vie.",
        "La montagne se dresse fièrement.",
        "L'océan est vaste et profond.",
        "Le désert s'étend à l'infini."
    ],
    VALIDATION: {
        AGE: { MIN: 1, MAX: 120 },
        SENTENCES: { MIN: 1, MAX: 10 }
    },
    TIMERS: {
        SUCCESS_MESSAGE: 1500,
        END_SESSION: 2000
    }
};

class DOMManager {
    constructor() {
        this.elements = this.initializeElements();
    }

    initializeElements() {
        const ids = [
            'form', 'age', 'gender', 'numSentences', 'consent',
            'startBtn', 'stopBtn', 'reRecordBtn', 'sendBtn', 'endSessionBtn',
            'current-sentence', 'instructions', 'status', 'recording-section'
        ];

        const elements = {};
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`Element with id '${id}' not found`);
                return;
            }
            elements[this.toCamelCase(id)] = element;
        });

        elements.formSection = document.querySelector('.form-section');
        return elements;
    }

    toCamelCase(str) {
        return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
    }

    show(element) {
        if (element) {
            element.classList.remove('hidden');
            element.classList.add('fade-in');
        }
    }

    hide(element) {
        if (element) {
            element.classList.add('hidden');
            element.classList.remove('fade-in');
        }
    }

    showError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    hideError(fieldName) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
    }

    setStatus(message, type = '') {
        if (this.elements.status) {
            this.elements.status.textContent = message;
            this.elements.status.className = `status ${type}`.trim();
            this.show(this.elements.status);
        }
    }

    hideStatus() {
        this.hide(this.elements.status);
    }

    setButtonState(button, disabled) {
        if (button) {
            button.disabled = disabled;
        }
    }
}

class FormValidator {
    constructor(domManager) {
        this.dom = domManager;
    }

    validateAge(age) {
        const ageNum = parseInt(age);
        if (isNaN(ageNum) || ageNum < CONFIG.VALIDATION.AGE.MIN || ageNum > CONFIG.VALIDATION.AGE.MAX) {
            this.dom.showError('age', `Veuillez entrer un âge entre ${CONFIG.VALIDATION.AGE.MIN} et ${CONFIG.VALIDATION.AGE.MAX}.`);
            return false;
        }
        this.dom.hideError('age');
        return true;
    }

    validateGender(gender) {
        if (!['male', 'female', 'other'].includes(gender)) {
            this.dom.showError('gender', 'Veuillez sélectionner un genre.');
            return false;
        }
        this.dom.hideError('gender');
        return true;
    }

    validateNumSentences(numSentences) {
        const num = parseInt(numSentences);
        if (isNaN(num) || num < CONFIG.VALIDATION.SENTENCES.MIN || num > CONFIG.VALIDATION.SENTENCES.MAX) {
            this.dom.showError('numSentences', `Veuillez entrer un nombre entre ${CONFIG.VALIDATION.SENTENCES.MIN} et ${CONFIG.VALIDATION.SENTENCES.MAX}.`);
            return false;
        }
        this.dom.hideError('numSentences');
        return true;
    }

    validateConsent(consent) {
        if (!consent) {
            this.dom.showError('consent', 'Le consentement est requis.');
            return false;
        }
        this.dom.hideError('consent');
        return true;
    }

    validateForm(formData) {
        const validations = [
            this.validateAge(formData.age),
            this.validateGender(formData.gender),
            this.validateNumSentences(formData.numSentences),
            this.validateConsent(formData.consent)
        ];
        return validations.every(isValid => isValid);
    }
}

class AudioRecorder {
    constructor(domManager) {
        this.dom = domManager;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.stream = null;
    }

    async startRecording() {
        if (this.isRecording) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(this.stream);
            this.audioChunks = [];

            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    this.audioChunks.push(e.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.stopStream();
                this.onRecordingComplete();
            };

            this.mediaRecorder.onerror = (e) => {
                console.error('MediaRecorder error:', e);
                this.dom.setStatus("Erreur lors de l'enregistrement", 'error');
                this.stopStream();
            };

            this.mediaRecorder.start();
            this.isRecording = true;
            this.updateUIForRecording();
        } catch (error) {
            console.error('Error accessing microphone:', error);
            this.dom.setStatus(`Erreur d'accès au microphone : ${error.message}`, 'error');
        }
    }

    stopRecording() {
        if (!this.isRecording || !this.mediaRecorder) return;
        try {
            this.mediaRecorder.stop();
            this.isRecording = false;
        } catch (error) {
            console.error('Error stopping recording:', error);
            this.dom.setStatus("Erreur lors de l'arrêt de l'enregistrement", 'error');
        }
    }

    stopStream() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }

    updateUIForRecording() {
        this.dom.setButtonState(this.dom.elements.startBtn, true);
        this.dom.setButtonState(this.dom.elements.stopBtn, false);
        this.dom.elements.instructions.textContent = "Enregistrement en cours... Parlez maintenant.";
        this.dom.hideStatus();
    }

    onRecordingComplete() {
        this.dom.setButtonState(this.dom.elements.stopBtn, true);
        this.dom.setButtonState(this.dom.elements.reRecordBtn, false);
        this.dom.setButtonState(this.dom.elements.sendBtn, false);
        this.dom.elements.instructions.textContent = "Enregistrement terminé. Vous pouvez réenregistrer ou envoyer.";
    }

    resetRecording() {
        this.audioChunks = [];
        this.stopStream();
        this.isRecording = false;

        this.dom.setButtonState(this.dom.elements.startBtn, false);
        this.dom.setButtonState(this.dom.elements.stopBtn, true);
        this.dom.setButtonState(this.dom.elements.reRecordBtn, true);
        this.dom.setButtonState(this.dom.elements.sendBtn, true);
        this.dom.elements.instructions.textContent = "Veuillez lire la phrase à voix haute.";
        this.dom.hideStatus();
    }

    getAudioBlob() {
        if (this.audioChunks.length === 0) {
            throw new Error('Aucun enregistrement disponible');
        }
        return new Blob(this.audioChunks, { type: "audio/webm" });
    }

    hasRecording() {
        return this.audioChunks.length > 0;
    }
}

class SentenceManager {
    constructor(domManager) {
        this.dom = domManager;
        this.sentences = [];
        this.currentIndex = 0;
        this.totalSentences = 0;
    }

    initialize(numSentences) {
        this.totalSentences = Math.min(numSentences, CONFIG.PREDEFINED_SENTENCES.length);
        this.sentences = CONFIG.PREDEFINED_SENTENCES.slice(0, this.totalSentences);
        this.currentIndex = 0;
    }

    displayCurrentSentence() {
        if (this.currentIndex < this.totalSentences) {
            this.dom.elements.currentSentence.textContent = this.sentences[this.currentIndex];
            this.dom.elements.instructions.textContent =
                `Phrase ${this.currentIndex + 1} sur ${this.totalSentences} : Veuillez lire la phrase à voix haute.`;
            this.dom.hideStatus();
            this.resetButtons();
            return true;
        }
        return false;
    }

    resetButtons() {
        this.dom.setButtonState(this.dom.elements.startBtn, false);
        this.dom.setButtonState(this.dom.elements.stopBtn, true);
        this.dom.setButtonState(this.dom.elements.reRecordBtn, true);
        this.dom.setButtonState(this.dom.elements.sendBtn, true);
    }

    getCurrentSentence() {
        return this.sentences[this.currentIndex] || '';
    }

    nextSentence() {
        this.currentIndex++;
        return this.displayCurrentSentence();
    }

    hasMoreSentences() {
        return this.currentIndex < this.totalSentences;
    }

    getCurrentIndex() {
        return this.currentIndex;
    }

    getProgress() {
        return {
            current: this.currentIndex + 1,
            total: this.totalSentences,
            percentage: Math.round(((this.currentIndex + 1) / this.totalSentences) * 100)
        };
    }
}

class APIManager {
    constructor() {
        this.endpoint = CONFIG.API_ENDPOINT;
    }

    async uploadRecording(audioBlob, userData, sentence, sentenceIndex) {
        const formData = new FormData();
        formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
        formData.append("age", userData.age);
        formData.append("gender", userData.gender);
        formData.append("consent", userData.consent);
        formData.append("sentence", sentence);
        formData.append("sentenceIndex", sentenceIndex.toString());

        try {
            const response = await fetch(this.endpoint, {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur serveur (${response.status}): ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
            }
            throw error;
        }
    }
}

class VoiceCollectionApp {
    constructor() {
        this.dom = new DOMManager();
        this.validator = new FormValidator(this.dom);
        this.recorder = new AudioRecorder(this.dom);
        this.sentenceManager = new SentenceManager(this.dom);
        this.apiManager = new APIManager();
        this.userData = {};

        this.initializeEventListeners();
        this.checkBrowserSupport();
    }

    checkBrowserSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.dom.setStatus("Votre navigateur ne supporte pas l'enregistrement audio.", 'error');
            this.dom.setButtonState(this.dom.elements.startBtn, true);
        }
    }

    initializeEventListeners() {
        const e = this.dom.elements;
        e.form?.addEventListener('submit', (evt) => this.handleFormSubmit(evt));
        e.startBtn?.addEventListener('click', () => this.handleStartRecording());
        e.stopBtn?.addEventListener('click', () => this.handleStopRecording());
        e.reRecordBtn?.addEventListener('click', () => this.handleReRecord());
        e.sendBtn?.addEventListener('click', () => this.handleSendRecording());
        e.endSessionBtn?.addEventListener('click', () => this.handleEndSession());
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const formData = {
            age: this.dom.elements.age?.value || '',
            gender: this.dom.elements.gender?.value || '',
            numSentences: this.dom.elements.numSentences?.value || '',
            consent: this.dom.elements.consent?.checked || false
        };

        if (!this.validator.validateForm(formData)) return;

        this.userData = {
            age: formData.age,
            gender: formData.gender,
            consent: formData.consent.toString()
        };

        this.startRecordingSession(parseInt(formData.numSentences));
    }

    startRecordingSession(numSentences) {
        this.sentenceManager.initialize(numSentences);
        this.dom.hide(this.dom.elements.formSection);
        this.dom.show(this.dom.elements.recordingSection);
        this.sentenceManager.displayCurrentSentence();
    }

    async handleStartRecording() {
        try {
            await this.recorder.startRecording();
        } catch (error) {
            console.error('Error starting recording:', error);
            this.dom.setStatus("Erreur lors du démarrage de l'enregistrement", 'error');
        }
    }

    handleStopRecording() {
        this.recorder.stopRecording();
    }

    handleReRecord() {
        this.recorder.resetRecording();
    }

    async handleSendRecording() {
        if (!this.recorder.hasRecording()) {
            this.dom.setStatus('Aucun enregistrement à envoyer', 'error');
            return;
        }

        try {
            this.dom.setButtonState(this.dom.elements.sendBtn, true);
            this.dom.setStatus('Envoi en cours...', '');

            const audioBlob = this.recorder.getAudioBlob();
            const sentence = this.sentenceManager.getCurrentSentence();
            const sentenceIndex = this.sentenceManager.getCurrentIndex();

            await this.apiManager.uploadRecording(audioBlob, this.userData, sentence, sentenceIndex);

            const progress = this.sentenceManager.getProgress();
            this.dom.setStatus(
                `✅ Enregistrement ${progress.current} envoyé avec succès ! Passage à la phrase suivante...`,
                'success'
            );

            setTimeout(() => {
                if (!this.sentenceManager.nextSentence()) {
                    this.endSession();
                } else {
                    this.recorder.resetRecording();
                }
            }, CONFIG.TIMERS.SUCCESS_MESSAGE);

        } catch (error) {
            console.error('Error sending recording:', error);
            this.dom.setStatus(`Erreur lors de l'envoi : ${error.message}`, 'error');
            this.dom.setButtonState(this.dom.elements.sendBtn, false);
        }
    }

    handleEndSession() {
        this.endSession();
    }

    endSession() {
        this.recorder.stopStream();
        this.dom.setStatus("Session terminée. Merci pour votre participation !", 'success');

        Object.values(this.dom.elements).forEach(element => {
            if (element && element.tagName === 'BUTTON' && element.id !== 'endSessionBtn') {
                this.dom.setButtonState(element, true);
            }
        });

        setTimeout(() => {
            if (confirm('Voulez-vous commencer une nouvelle session ?')) {
                window.location.reload();
            }
        }, CONFIG.TIMERS.END_SESSION);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    try {
        new VoiceCollectionApp();
    } catch (error) {
        console.error('Error initializing app:', error);
        document.body.innerHTML =
            `<div style="text-align: center; padding: 2rem; color: #d32f2f;">
                <h1>Erreur</h1>
                <p>Une erreur est survenue lors du chargement de l'application.</p>
                <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem;">
                    Recharger la page
                </button>
            </div>`;
    }
});