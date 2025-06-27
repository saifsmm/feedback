// Initialize EmailJS with your public key
emailjs.init('mCmkV7zI5KN5WnY7G');

let selectedEmoji = '';

// Inactivity Timer Variables
let inactivityTimer = null;
let warningTimer = null;
let countdownTimer = null;
let countdownSeconds = 10;
let isWarningActive = false;
let isUserTyping = false;
let isSubmitting = false;
let lastTypingTime = 0;
let isAutoSubmitting = false;

// Activity events to monitor
const activityEvents = [
  'mousedown', 'mousemove', 'keypress', 'keydown', 'keyup',
  'scroll', 'touchstart', 'touchmove', 'click', 'focus', 'blur'
];

// Typing detection events
const typingEvents = ['keydown', 'keypress', 'keyup', 'input'];

// Play notification sound and vibration
function playNotificationAlert() {
  // Vibration for mobile devices
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }

  // Audio notification (using Web Audio API for better compatibility)
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (e) {
    // Fallback: try to play a simple beep
    console.log('Audio notification not supported');
  }
}

// Visual feedback for activity detection
function showActivityFeedback() {
  const form = document.getElementById('detailsForm');
  if (form && form.classList.contains('show')) {
    form.classList.remove('activity-pulse');
    // Force reflow to restart animation
    form.offsetHeight;
    form.classList.add('activity-pulse');

    setTimeout(() => {
      form.classList.remove('activity-pulse');
    }, 300);
  }
}

// Check if user is currently typing
function detectTyping(event) {
  const now = Date.now();
  lastTypingTime = now;

  if (typingEvents.includes(event.type)) {
    isUserTyping = true;

    // Clear typing flag after 3 seconds of no typing
    setTimeout(() => {
      if (Date.now() - lastTypingTime >= 3000) {
        isUserTyping = false;
      }
    }, 3000);
  }
}

function selectEmoji(emoji) {
  selectedEmoji = emoji;
  document.getElementById('main-question').style.display = 'none';
  document.getElementById('emojis').style.display = 'none';
  document.getElementById('detailsForm').classList.add('show');
  document.getElementById('subquestion').style.display = 'block';
  document.getElementById('backArrow').classList.add('show');
  checkSubmitButton(); // Check if submit should be enabled

  // Start inactivity tracking when form becomes visible
  setTimeout(startInactivityTracking, 100);
}

function goBack() {
  stopInactivityTracking();
  document.getElementById('main-question').style.display = 'block';
  document.getElementById('emojis').style.display = 'grid';
  document.getElementById('detailsForm').classList.remove('show');
  document.getElementById('subquestion').style.display = 'none';
  document.getElementById('backArrow').classList.remove('show');
}

function validateField(input, checkId, xId) {
  const value = input.value.trim();
  const checkElement = document.getElementById(checkId);
  const xElement = document.getElementById(xId);

  if (value === "") {
    // Field is empty - hide both indicators
    checkElement.style.display = "none";
    xElement.style.display = "none";
  } else {
    // Field has content - show checkmark, hide X
    checkElement.style.display = "inline";
    xElement.style.display = "none";
  }
}

function checkSubmitButton() {
  const name = document.getElementById('name').value.trim();
  const comments = document.getElementById('comments').value.trim();
  const submitBtn = document.getElementById('submitBtn');

  // Enable submit button if either name OR comments is filled
  if (name !== '' || comments !== '') {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
}

// Character count function for textarea
function updateCharCount(textarea) {
  const charCount = document.getElementById('char-count');
  const currentLength = textarea.value.length;
  const maxLength = textarea.maxLength;

  charCount.textContent = `${currentLength}/${maxLength}`;

  // Change color based on character count
  charCount.classList.remove('warning', 'danger');
  if (currentLength > maxLength * 0.8) {
    charCount.classList.add('warning');
  }
  if (currentLength > maxLength * 0.95) {
    charCount.classList.add('danger');
  }
}

// Helper function to get employee name from office code
function getEmployeeName(officeCode) {
  const employeeMap = {
    'office1': 'Abdulla Al Makhdoum',
    'office2': 'Abdullah Al Balooshi',
    'office3': 'Yousuf',
    'office4': 'Ahmed',
    'office5': 'Saad',
    'office6': 'Sunqar',
    'office7': 'Nawaf',
    'office8': 'Mohsen'
  };
  return employeeMap[officeCode] || 'Unknown Employee';
}

// Helper function to get rating text
function getRatingText(emoji) {
  const ratingMap = {
    '😡': 'Bad',
    '😞': 'Poor',
    '😐': 'Okay',
    '😄': 'Good',
    '🥰': 'Excellent'
  };
  return ratingMap[emoji] || 'Unknown';
}

// Function to send email alert using EmailJS
async function sendAlert(name, comments, isAutoSubmit = false) {
  try {
    const office = new URLSearchParams(window.location.search).get('office') || 'unknown';
    const employee = getEmployeeName(office);
    const rating = getRatingText(selectedEmoji);
    const isUrgent = selectedEmoji === '😡' || selectedEmoji === '😞';

    const submissionType = isAutoSubmit ? 'Auto-submitted due to inactivity' : 'Manual submission';

    const templateParams = {
      subject: `${isUrgent ? '🚨 URGENT' : '📊 INFO'}${isAutoSubmit ? ' (AUTO)' : ''}: ${rating} Rating - ${office}`,
      message: `Customer Feedback Alert

Office: ${office}
Employee: ${employee}
Rating: ${selectedEmoji} ${rating}
Time: ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}
Customer: ${name || 'Anonymous'}
Contact: ${document.getElementById('contact').value.trim() || 'Not provided'}
Comments: ${comments || 'No comments provided'}
Submission Type: ${submissionType}

${isUrgent ? '⚠️ IMMEDIATE FOLLOW-UP REQUIRED!' : '✅ For your information.'}

---
Dorchester Customer Satisfaction System`,
      name: name || 'Customer Feedback System',
      email: 'noreply@dorchester.com'
    };

    console.log('Sending email via EmailJS...');

    const response = await emailjs.send(
      'service_477chem',
      'template_lppas35',
      templateParams
    );

    console.log('Email sent successfully:', response);
    return true;
  } catch (error) {
    console.error('Email failed:', error);
    return false;
  }
}

function skipSubmit() {
  isSubmitting = true; // Prevent inactivity warning during submission
  stopInactivityTracking();
  const skipBtn = document.querySelector('.skip-btn');
  const loader = document.getElementById('loader');

  // Show loading state
  skipBtn.disabled = true;
  skipBtn.textContent = 'Submitting...';
  loader.style.display = 'block';

  const office = new URLSearchParams(window.location.search).get('office') || 'unknown';

  // Send email alert (manual skip)
  sendAlert('', '', false);

  const data = {
    data: {
      Emoji: selectedEmoji,
      Name: '',
      Contact: '',
      Comments: '',
      Office: office
    }
  };

  fetch('https://hook.eu2.make.com/tsq65nwqz30nr7tmkrf8h4z5lrpckq2d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return;
    })
    .then(() => {
      document.getElementById('detailsForm').classList.remove('show');
      document.getElementById('subquestion').style.display = 'none';
      document.getElementById('thankyou').style.display = 'block';
      document.getElementById('backArrow').classList.remove('show');
      setTimeout(() => location.reload(), 3000);
    })
    .catch((error) => {
      alert("Something went wrong. Please try again.");
      // Reset button state on error
      skipBtn.disabled = false;
      skipBtn.textContent = 'Skip and Submit';
      loader.style.display = 'none';
      isSubmitting = false; // Re-enable inactivity tracking
    });
}

function submitForm(e) {
  e.preventDefault();
  isSubmitting = true; // Prevent inactivity warning during submission
  stopInactivityTracking();
  const btn = document.getElementById('submitBtn');
  const loader = document.getElementById('loader');
  const name = document.getElementById('name').value.trim();
  const comments = document.getElementById('comments').value.trim();

  // Check if at least name OR comments is filled
  if (name === '' && comments === '') {
    alert('Please fill in your name or add a comment before submitting.');
    isSubmitting = false; // Re-enable inactivity tracking
    return;
  }

  btn.disabled = true;
  loader.style.display = 'block';

  const contact = document.getElementById('contact').value.trim();
  const office = new URLSearchParams(window.location.search).get('office') || 'unknown';

  // Send email alert (manual submission)
  sendAlert(name, comments, false);

  const data = {
    data: {
      Emoji: selectedEmoji,
      Name: name,
      Contact: contact,
      Comments: comments,
      Office: office,
      SubmissionType: 'Manual submission'
    }
  };

  fetch('https://hook.eu2.make.com/tsq65nwqz30nr7tmkrf8h4z5lrpckq2d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return;
    })
    .then(() => {
      if (name) document.getElementById('check-name').classList.add('show-check');
      if (contact) document.getElementById('check-contact').classList.add('show-check');
      if (comments) document.getElementById('check-comments').classList.add('show-check');

      setTimeout(() => {
        document.getElementById('detailsForm').reset();
        document.getElementById('detailsForm').classList.remove('show');
        document.getElementById('subquestion').style.display = 'none';
        document.getElementById('thankyou').style.display = 'block';
        btn.disabled = false;
        loader.style.display = 'none';
        document.getElementById('check-name').classList.remove('show-check');
        document.getElementById('check-contact').classList.remove('show-check');
        document.getElementById('check-comments').classList.remove('show-check');
        document.getElementById('backArrow').classList.remove('show');
        setTimeout(() => location.reload(), 3000);
      }, 1500);
    })
    .catch((error) => {
      alert("Something went wrong. Please try again.");
      btn.disabled = false;
      loader.style.display = 'none';
      isSubmitting = false; // Re-enable inactivity tracking
    });
}

// Inactivity tracking functions
function startInactivityTracking() {
  if (!document.getElementById('detailsForm').classList.contains('show') || isSubmitting) {
    return;
  }

  clearInactivityTimers();

  inactivityTimer = setTimeout(() => {
    // Don't show warning if user is actively typing or submitting
    if (!isUserTyping && !isSubmitting) {
      showInactivityWarning();
    } else {
      // If user was typing, wait a bit more and check again
      setTimeout(() => {
        if (!isUserTyping && !isSubmitting) {
          showInactivityWarning();
        } else {
          // Restart timer if still typing
          startInactivityTracking();
        }
      }, 3000);
    }
  }, 15000);
}

function stopInactivityTracking() {
  clearInactivityTimers();
  hideInactivityWarning();
}

function clearInactivityTimers() {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  if (warningTimer) {
    clearTimeout(warningTimer);
    warningTimer = null;
  }
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function showInactivityWarning() {
  if (isWarningActive || isSubmitting) return;

  isWarningActive = true;
  countdownSeconds = 10;

  const warning = document.getElementById('inactivityWarning');
  const countdown = document.getElementById('countdownDisplay');
  const card = document.querySelector('.card');
  const form = document.getElementById('detailsForm');
  const backArrow = document.getElementById('backArrow');

  // Play notification sound and vibration
  playNotificationAlert();

  // Hide back arrow during warning
  backArrow.classList.add('hidden-for-warning');

  // Add blur effect and disable interactions
  card.classList.add('blurred');
  form.classList.add('form-disabled');

  warning.classList.add('show');
  countdown.textContent = countdownSeconds;

  countdownTimer = setInterval(() => {
    countdownSeconds--;
    countdown.textContent = countdownSeconds;

    if (countdownSeconds <= 0) {
      autoSubmitFeedback();
    }
  }, 1000);
}

function hideInactivityWarning() {
  const warning = document.getElementById('inactivityWarning');
  const card = document.querySelector('.card');
  const form = document.getElementById('detailsForm');
  const backArrow = document.getElementById('backArrow');

  // Show visual feedback for activity detection
  showActivityFeedback();

  // Show back arrow again
  backArrow.classList.remove('hidden-for-warning');

  // Remove blur effect
  card.classList.remove('blurred');

  warning.classList.remove('show');
  isWarningActive = false;

  // Re-enable form interactions after a short delay to prevent accidental clicks
  setTimeout(() => {
    form.classList.remove('form-disabled');
  }, 800);

  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function continueSession() {
  hideInactivityWarning();
  startInactivityTracking(); // Restart the timer
}

function submitNow() {
  hideInactivityWarning();
  manualSubmitForm();
}

function autoSubmitFeedback() {
  hideInactivityWarning();
  isAutoSubmitting = true;

  // Show submitting message
  const warning = document.getElementById('inactivityWarning');
  const modal = warning.querySelector('.warning-modal');

  modal.innerHTML = `
    <h2>📤 Submitting your feedback...</h2>
    <p>Thank you for your rating!<br>
       <span class="arabic">شكراً لتقييمك!</span></p>
    <div class="loader" style="display: block; margin: 1rem auto;"></div>
  `;

  warning.classList.add('show');

  setTimeout(() => {
    performSubmission(true); // true indicates auto-submission
  }, 1500);
}

function manualSubmitForm() {
  performSubmission(false); // false indicates manual submission
}

function performSubmission(isAutoSubmit) {
  stopInactivityTracking();
  isSubmitting = true;

  const name = document.getElementById('name').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const comments = document.getElementById('comments').value.trim();
  const office = new URLSearchParams(window.location.search).get('office') || 'unknown';

  // Send email alert with auto-submit flag
  sendAlert(name, comments, isAutoSubmit);

  const data = {
    data: {
      Emoji: selectedEmoji,
      Name: name,
      Contact: contact,
      Comments: comments,
      Office: office,
      SubmissionType: isAutoSubmit ? 'Auto-submitted due to inactivity' : 'Manual submission'
    }
  };

  fetch('https://hook.eu2.make.com/tsq65nwqz30nr7tmkrf8h4z5lrpckq2d', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (!response.ok) throw new Error('Network error');
      return;
    })
    .then(() => {
      // Hide warning modal if it's showing
      const warning = document.getElementById('inactivityWarning');
      warning.classList.remove('show');

      // Show thank you page
      document.getElementById('detailsForm').classList.remove('show');
      document.getElementById('subquestion').style.display = 'none';
      document.getElementById('thankyou').style.display = 'block';
      document.getElementById('backArrow').classList.remove('show');

      // Remove blur effect
      const card = document.querySelector('.card');
      card.classList.remove('blurred');

      setTimeout(() => location.reload(), 3000);
    })
    .catch((error) => {
      alert("Something went wrong. Please try again.");
      isSubmitting = false;
      isAutoSubmitting = false;

      // Reset warning modal if auto-submit failed
      if (isAutoSubmit) {
        restartSession();
      }
    });
}

// Reset inactivity timer on any activity
function resetInactivityTimer(event) {
  // Detect typing activity
  if (event) {
    detectTyping(event);
  }

  // If warning is active, hide it immediately on any activity
  if (isWarningActive) {
    hideInactivityWarning();
    startInactivityTracking(); // Restart the timer
    return;
  }

  if (document.getElementById('detailsForm').classList.contains('show') && !isWarningActive && !isSubmitting) {
    startInactivityTracking();
  }
}

// Add event listeners for activity detection
function initializeActivityListeners() {
  const formContainer = document.getElementById('detailsForm');
  const warningModal = document.querySelector('.warning-modal');

  // Add listeners to form container
  activityEvents.forEach(event => {
    formContainer.addEventListener(event, resetInactivityTimer, true);

    // Also add listeners to the entire document to catch activity when modal is shown
    // But exclude the warning modal area to prevent accidental dismissal
    document.addEventListener(event, function (e) {
      // Don't reset timer if clicking inside the warning modal
      if (isWarningActive && warningModal && warningModal.contains(e.target)) {
        return;
      }
      resetInactivityTimer(e);
    }, true);
  });

  // Also listen on input fields specifically for typing detection
  ['name', 'contact', 'comments'].forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      field.addEventListener('input', (e) => {
        detectTyping(e);
        resetInactivityTimer(e);
      });
      field.addEventListener('focus', resetInactivityTimer);
      field.addEventListener('blur', resetInactivityTimer);

      // Add specific typing event listeners
      typingEvents.forEach(eventType => {
        field.addEventListener(eventType, resetInactivityTimer);
      });
    }
  });

  // Prevent event bubbling on warning modal buttons
  const warningButtons = document.querySelectorAll('.warning-btn');
  warningButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
    });
  });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
  initializeActivityListeners();
});
