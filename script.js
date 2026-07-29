/* ==========================================================================
   Vespa 50 (V5A1T) — Verkaufsseite
   Reines Vanilla-JavaScript, keine Abhängigkeiten. Aufgeteilt in vier
   unabhängige Bereiche: Theme-Umschalter, Bild-Fallback, Scroll-Reveal,
   Galerie-Lightbox und Kontaktformular.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {
  initThemeToggle();
  initImageFallback();
  initScrollReveal();
  initLightbox();
  initContactForm();
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

/* --------------------------------------------------------------------------
   Heller / dunkler Modus
   Das Attribut data-theme wird bereits im <head> von index.html gesetzt
   (verhindert ein Aufblitzen des falschen Farbschemas). Hier wird nur noch
   der Klick auf den Umschalter behandelt und die Wahl in localStorage
   gespeichert.
   -------------------------------------------------------------------------- */
function initThemeToggle() {
  var toggle = document.getElementById('theme-toggle');
  var root = document.documentElement;

  updateToggleState();

  toggle.addEventListener('click', function () {
    var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateToggleState();
  });

  function updateToggleState() {
    var isDark = root.getAttribute('data-theme') === 'dark';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute(
      'aria-label',
      isDark ? 'Hellen Modus aktivieren' : 'Dunklen Modus aktivieren'
    );
  }
}

/* --------------------------------------------------------------------------
   Platzhalter-Bilder: Solange platzhalter-1.jpg … platzhalter-8.jpg noch
   nicht durch echte Fotos ersetzt sind, zeigt jedes <img> stattdessen
   seinen Alternativtext auf einer schlichten Fläche an, statt eines
   kaputten Bild-Icons.
   -------------------------------------------------------------------------- */
function initImageFallback() {
  document.querySelectorAll('img').forEach(function (img) {
    // Bild ist zum Zeitpunkt des Skript-Starts bereits fehlgeschlagen
    // (z. B. schnelle 404-Antwort, bevor der error-Listener registriert wurde)
    if (img.complete && img.naturalWidth === 0) {
      markAsMissing(img);
    }
    img.addEventListener('error', function () {
      markAsMissing(img);
    });
  });

  function markAsMissing(img) {
    if (img.classList.contains('img-missing')) return;
    img.classList.add('img-missing');
    img.setAttribute('aria-label', img.alt);
  }
}

/* --------------------------------------------------------------------------
   Sanftes Einblenden von Inhalten beim Scrollen
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  // Bewusst ohne IntersectionObserver: Bei einem großen Scroll-Sprung (Klick
  // auf einen Anker-Link, schnelles Wischen auf dem Trackpad) kann ein
  // Element den Sichtbereich überspringen, ohne dass dessen Sichtbarkeits-
  // Schwelle je gekreuzt wird — der Observer-Callback feuert dann nie, und
  // das Element bliebe dauerhaft unsichtbar. Eine direkte Prüfung der
  // aktuellen Position auf jedem Scroll/Resize umgeht dieses Problem.
  var elements = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var ticking = false;

  function revealVisible() {
    var viewportHeight = window.innerHeight;
    elements = elements.filter(function (el) {
      var rect = el.getBoundingClientRect();
      var hasEnteredView = rect.top < viewportHeight - 40;
      if (hasEnteredView) {
        el.classList.add('is-visible');
        return false; // aus der Beobachtungsliste entfernen
      }
      return true;
    });
    ticking = false;
  }

  function requestReveal() {
    if (!ticking) {
      window.requestAnimationFrame(revealVisible);
      ticking = true;
    }
  }

  revealVisible();
  window.addEventListener('scroll', requestReveal, { passive: true });
  window.addEventListener('resize', requestReveal);
}

/* --------------------------------------------------------------------------
   Galerie-Lightbox: Klick oder Enter/Leertaste auf ein Galerie-Bild öffnet
   eine vergrößerte Ansicht. Schließen per Klick, Escape-Taste oder Klick
   auf den Schließen-Button. Der Fokus kehrt beim Schließen zum auslösenden
   Element zurück.
   -------------------------------------------------------------------------- */
function initLightbox() {
  var lightbox = document.getElementById('lightbox');
  var lightboxImage = document.getElementById('lightbox-image');
  var closeButton = document.getElementById('lightbox-close');
  var galleryItems = document.querySelectorAll('.gallery-item');
  var lastFocusedElement = null;

  galleryItems.forEach(function (item) {
    item.addEventListener('click', function () {
      openLightbox(item);
    });
  });

  closeButton.addEventListener('click', closeLightbox);

  lightbox.addEventListener('click', function (event) {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !lightbox.hidden) {
      closeLightbox();
    }
  });

  function openLightbox(item) {
    lastFocusedElement = item;
    lightboxImage.src = item.dataset.full;
    lightboxImage.alt = item.dataset.alt || '';
    lightbox.hidden = false;
    closeButton.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImage.src = '';
    if (lastFocusedElement) {
      lastFocusedElement.focus();
    }
  }
}

/* --------------------------------------------------------------------------
   Kontaktformular: einfache Client-seitige Validierung, anschließend
   Versand per fetch() an Formspree, ohne die Seite neu zu laden.
   -------------------------------------------------------------------------- */
function initContactForm() {
  var form = document.getElementById('contact-form');
  var submitButton = document.getElementById('submit-button');
  var statusEl = document.getElementById('form-status');
  var successEl = document.getElementById('form-success');

  var fields = {
    name: {
      input: document.getElementById('name'),
      error: document.getElementById('name-error'),
      validate: function (value) {
        return value.trim().length > 0 ? '' : 'Bitte geben Sie Ihren Namen ein.';
      },
    },
    email: {
      input: document.getElementById('email'),
      error: document.getElementById('email-error'),
      validate: function (value) {
        var pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value.trim().length === 0) return 'Bitte geben Sie Ihre E-Mail-Adresse ein.';
        if (!pattern.test(value.trim())) return 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        return '';
      },
    },
    message: {
      input: document.getElementById('message'),
      error: document.getElementById('message-error'),
      validate: function (value) {
        return value.trim().length > 0 ? '' : 'Bitte geben Sie eine Nachricht ein.';
      },
    },
  };

  Object.keys(fields).forEach(function (key) {
    fields[key].input.addEventListener('blur', function () {
      validateField(key);
    });
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    var isValid = Object.keys(fields)
      .map(validateField)
      .every(Boolean);

    if (!isValid) {
      statusEl.textContent = 'Bitte überprüfen Sie Ihre Angaben.';
      return;
    }

    submitButton.disabled = true;
    statusEl.textContent = 'Wird gesendet …';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    })
      .then(function (response) {
        if (response.ok) {
          form.hidden = true;
          statusEl.textContent = '';
          successEl.hidden = false;
          successEl.focus();
        } else {
          return response.json().then(function (data) {
            throw new Error(
              data && data.errors
                ? data.errors.map(function (e) { return e.message; }).join(', ')
                : 'Beim Senden ist ein Fehler aufgetreten.'
            );
          });
        }
      })
      .catch(function (error) {
        statusEl.textContent =
          error.message || 'Beim Senden ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.';
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });

  function validateField(key) {
    var field = fields[key];
    var message = field.validate(field.input.value);
    field.error.textContent = message;
    field.input.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  }
}
