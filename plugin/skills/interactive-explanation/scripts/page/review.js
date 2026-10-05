// Review map: hover a box on a screenshot or a group in the reading order, and
// both light up, so you see which file draws which part of the screen.
const ACTIVE_CLASS = 'review-map--active';

for (const element of document.querySelectorAll('[data-review]')) {
  const number = element.dataset.review;
  const partners = document.querySelectorAll(`[data-review="${number}"]`);

  element.addEventListener('mouseenter', () => partners.forEach((partner) => partner.classList.add(ACTIVE_CLASS)));
  element.addEventListener('mouseleave', () => partners.forEach((partner) => partner.classList.remove(ACTIVE_CLASS)));
}
