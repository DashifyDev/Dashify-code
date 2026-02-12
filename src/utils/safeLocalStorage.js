/**
 * Shows a styled modal warning that localStorage quota is exceeded.
 * Injects a DOM modal matching the app's design (Tailwind-like inline styles).
 */
function showStorageFullModal() {
  // Prevent duplicate modals
  if (document.getElementById('storage-full-modal')) return;

  const overlay = document.createElement('div');
  overlay.id = 'storage-full-modal';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    zIndex: '10000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    transition: 'opacity 0.3s ease'
  });

  const modal = document.createElement('div');
  Object.assign(modal.style, {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    width: '100%',
    maxWidth: '400px',
    overflow: 'hidden',
    transform: 'scale(1)',
    transition: 'transform 0.3s ease'
  });

  // Icon + Header
  const header = document.createElement('div');
  Object.assign(header.style, {
    padding: '24px 24px 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  });

  const iconWrap = document.createElement('div');
  Object.assign(iconWrap.style, {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px'
  });
  iconWrap.innerHTML =
    '<svg width="28" height="28" fill="none" stroke="#d97706" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>';

  const title = document.createElement('h2');
  Object.assign(title.style, {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px'
  });
  title.textContent = 'Storage Full';

  header.appendChild(iconWrap);
  header.appendChild(title);

  // Body
  const body = document.createElement('div');
  Object.assign(body.style, {
    padding: '0 24px 24px',
    textAlign: 'center'
  });

  const message = document.createElement('p');
  Object.assign(message.style, {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: '0'
  });
  message.textContent =
    'Your local storage is full and changes cannot be saved. Create a free account to get unlimited storage and keep all your boards safe.';

  body.appendChild(message);

  // Footer with buttons
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px'
  });

  // "Close" button
  const closeBtn = document.createElement('button');
  Object.assign(closeBtn.style, {
    flex: '1',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '500',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#fff',
    color: '#374151',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  });
  closeBtn.textContent = 'Close';
  closeBtn.onmouseenter = () => {
    closeBtn.style.backgroundColor = '#f3f4f6';
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.backgroundColor = '#fff';
  };
  closeBtn.onclick = () => overlay.remove();

  // "Sign Up" button
  const signUpBtn = document.createElement('button');
  Object.assign(signUpBtn.style, {
    flex: '1',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: '600',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#63899e',
    color: '#fff',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  });
  signUpBtn.textContent = 'Sign Up Free';
  signUpBtn.onmouseenter = () => {
    signUpBtn.style.backgroundColor = '#4a6d7e';
  };
  signUpBtn.onmouseleave = () => {
    signUpBtn.style.backgroundColor = '#63899e';
  };
  signUpBtn.onclick = () => {
    overlay.remove();
    window.location.href = '/api/auth/login';
  };

  footer.appendChild(closeBtn);
  footer.appendChild(signUpBtn);

  // Assemble modal
  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  overlay.appendChild(modal);

  // Close on overlay click
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
}

/**
 * Safely sets an item in localStorage with QuotaExceededError handling.
 * By default silently fails on quota errors. Pass { showAlert: true } to show a modal.
 *
 * @param {string} key - The localStorage key
 * @param {string} value - The value to store
 * @param {object} [options] - Optional settings
 * @param {boolean} [options.showAlert=false] - Whether to show the storage-full modal
 * @returns {boolean} - true if saved successfully, false if quota exceeded
 */
export function safeSetItem(key, value, options = {}) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e.code === 22 ||
        e.code === 1014)
    ) {
      if (options.showAlert) {
        showStorageFullModal();
      }
      return false;
    }
    throw e;
  }
}
