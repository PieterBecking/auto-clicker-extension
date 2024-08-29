let recording = false;
let actions = [];
let startTime;

// Listen for keyboard commands
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'o') {
    event.preventDefault();
    if (!recording) {
      startRecording();
    } else {
      stopRecording();
    }
  } else if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'p') {
    event.preventDefault();
    replayActions();
  }
});

function startRecording() {
  if (recording) return; // Prevent multiple recordings
  recording = true;
  actions = [];
  startTime = Date.now();
  document.addEventListener('mousemove', recordMouseMove);
  document.addEventListener('click', recordClick);
  console.log('Recording started');
}

function stopRecording() {
  if (!recording) return; // Prevent stopping if not recording
  recording = false;
  document.removeEventListener('mousemove', recordMouseMove);
  document.removeEventListener('click', recordClick);
  chrome.storage.local.set({ actions: actions }, () => {
    console.log('Recording stopped and actions saved');
  });
}

function recordMouseMove(event) {
  if (!recording) return;
  actions.push({
    type: 'mousemove',
    time: Date.now() - startTime,
    x: event.clientX,
    y: event.clientY
  });
}

function recordClick(event) {
  if (!recording) return;
  actions.push({
    type: 'click',
    time: Date.now() - startTime,
    x: event.clientX,
    y: event.clientY
  });
}

function replayActions() {
  chrome.storage.local.get(['actions'], (result) => {
    if (!result.actions || result.actions.length === 0) {
      console.log('No actions to replay');
      return;
    }

    console.log('Replaying actions');
    let startTime = Date.now();
    result.actions.forEach(action => {
      setTimeout(() => {
        const simulatedEvent = new MouseEvent(action.type, {
          clientX: action.x,
          clientY: action.y,
          bubbles: true,
          cancelable: true,
          view: window
        });
        try {
          document.elementFromPoint(action.x, action.y)?.dispatchEvent(simulatedEvent);
        } catch (error) {
          console.error('Error dispatching event:', error);
        }
      }, action.time);
    });
  });
}

// Handle context invalidation (if extension is reloaded or tab is refreshed)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === 'contextInvalidated') {
    recording = false;
    actions = [];
    console.log('Extension context invalidated. Actions cleared.');
  }
});
