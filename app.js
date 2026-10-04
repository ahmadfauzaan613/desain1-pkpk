const root = document.documentElement;
const langButtons = document.querySelectorAll('[data-lang-set]');

// Swaps the attributes CSS cannot reach (title, aria-label, alt) and remembers the choice.
function setLanguage(lang) {
  const key = lang === 'en' ? 'En' : 'Id';
  root.lang = lang;
  if (root.dataset[`title${key}`]) document.title = root.dataset[`title${key}`];
  document.querySelectorAll('[data-label-id]').forEach((el) => el.setAttribute('aria-label', el.dataset[`label${key}`]));
  document.querySelectorAll('[data-alt-id]').forEach((el) => { el.alt = el.dataset[`alt${key}`]; });
  langButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.langSet === lang)));
  try { localStorage.setItem('pkpk-lang', lang); } catch (error) { /* storage blocked: the choice lasts for this page only */ }
}

langButtons.forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.langSet)));
setLanguage(root.lang === 'en' ? 'en' : 'id');

const menuButton = document.querySelector('[data-menu-button]');
const menu = document.querySelector('[data-menu]');

function setMenuOpen(open) {
  menu?.classList.toggle('is-open', open);
  menuButton?.setAttribute('aria-expanded', String(open));
}

menuButton?.addEventListener('click', () => {
  setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
});

document.querySelectorAll('[data-menu-link]').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenuOpen(false);
    menuButton.focus();
  }
});

document.addEventListener('click', (event) => {
  if (menuButton?.getAttribute('aria-expanded') === 'true' && !menu?.contains(event.target) && !menuButton.contains(event.target)) {
    setMenuOpen(false);
  }
});
