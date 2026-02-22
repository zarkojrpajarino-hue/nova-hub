/**
 * 🎉 Simple Confetti Utility
 * Lightweight confetti animation without external dependencies
 */

export function triggerConfetti() {
  // Create confetti container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '9999';
  document.body.appendChild(container);

  // Create multiple confetti pieces
  const colors = ['#9333ea', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const confettiCount = 50;

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'absolute';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.top = '-10px';
    confetti.style.opacity = '1';
    confetti.style.transform = 'rotate(0deg)';
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';

    container.appendChild(confetti);

    // Animate confetti
    const duration = 2000 + Math.random() * 1000;
    const xMovement = (Math.random() - 0.5) * 200;
    const rotation = Math.random() * 720;

    confetti.animate([
      {
        transform: 'translateY(0) translateX(0) rotate(0deg)',
        opacity: 1
      },
      {
        transform: `translateY(${window.innerHeight + 10}px) translateX(${xMovement}px) rotate(${rotation}deg)`,
        opacity: 0
      }
    ], {
      duration,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    });
  }

  // Remove container after animation
  setTimeout(() => {
    document.body.removeChild(container);
  }, 4000);
}

// Confetti object with similar API to canvas-confetti
export const confetti = (_options?: { particleCount?: number; spread?: number; origin?: { y?: number } }) => {
  triggerConfetti();
};

export default confetti;
