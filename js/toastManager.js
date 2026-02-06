(function() {
  let activeToasts = 0;

  window.showToast = function(message, type) {
    type = type || 'points';
    var container = document.querySelector('.game-area');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    toast.textContent = message;

    var offset = activeToasts * 34;
    toast.style.top = 'calc(45% - ' + offset + 'px)';
    activeToasts++;

    container.appendChild(toast);

    toast.addEventListener('animationend', function() {
      toast.remove();
      activeToasts = Math.max(0, activeToasts - 1);
    });
  };

  window._toastMilestones = {};

  window.resetToastMilestones = function() {
    window._toastMilestones = {};
  };
})();
