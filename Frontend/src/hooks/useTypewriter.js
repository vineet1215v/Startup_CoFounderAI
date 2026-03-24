import { useState, useCallback, useEffect } from 'react';

export const useTypewriter = (text, options = {}) => {
  const {
    delay = 30,
    pauseAtEnd = 1000,
    onComplete,
    cursor = '|',
    cursorBlink = true
  } = options;

  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  const startTyping = useCallback(() => {
    setIsTyping(true);
    setDisplayText('');
    let i = 0;
    const timer = setInterval(() => {
      setDisplayText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, pauseAtEnd);
      }
    }, delay);
    return timer;
  }, [text, delay, pauseAtEnd, onComplete]);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);
    return () => clearInterval(blinkInterval);
  }, [cursorBlink]);

  return {
    displayText: displayText + (isTyping || cursorBlink ? cursor : ''),
    isTyping,
    startTyping,
    cursorVisible
  };
};

