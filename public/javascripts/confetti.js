function createConfetti() {
  const colors = ['#FFD8D1', '#F9AFB1', '#99B7C6', '#978Ec4', '#9AB59D', '#F4B092', '#CE325B'];
  const confettiCount = 50;
  
  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-piece';
    confetti.style.cssText = `
      position: fixed;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background-color: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${Math.random() * 100}vw;
      top: -10px;
      opacity: ${Math.random() * 0.7 + 0.3};
      transform: rotate(${Math.random() * 360}deg);
      animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 5000);
  }
}

if (!document.querySelector('#confetti-styles')) {
  const style = document.createElement('style');
  style.id = 'confetti-styles';
  style.textContent = `
    @keyframes confetti-fall {
      0% {
        top: -10px;
        transform: translateY(0) rotate(0deg);
      }
      100% {
        top: 100vh;
        transform: translateY(0) rotate(${Math.random() > 0.5 ? '' : '-'}720deg);
      }
    }
  `;
  document.head.appendChild(style);
}

document.addEventListener('DOMContentLoaded', function() {
  const userName = document.querySelector('.user-name-confetti');
  if (userName) {
    createConfetti();
    
    userName.style.position = 'relative';
    userName.style.display = 'inline-block';
    userName.style.animation = 'confetti-celebration 0.6s ease-in-out';
    
    if (!document.querySelector('#celebration-styles')) {
      const celebrationStyle = document.createElement('style');
      celebrationStyle.id = 'celebration-styles';
      celebrationStyle.textContent = `
        @keyframes confetti-celebration {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `;
      document.head.appendChild(celebrationStyle);
    }
  }
});
