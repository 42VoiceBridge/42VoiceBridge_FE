import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { VoiceGraphic } from './VoiceGraphic';

const slides = [
  { word: 'SPEAK', title: '하고 싶은 말을, 편하게.', description: '당신의 속도에 맞춰 목소리를 듣습니다.' },
  { word: 'UNDERSTAND', title: '말 속에 담긴 뜻을 이해합니다.', description: 'AI가 발화를 이해하고 전달할 문장을 찾습니다.' },
  { word: 'DELIVER', title: '당신의 말이, 더 또렷하게.', description: '확인한 문장을 글자와 음성으로 전달합니다.' },
];

export const HeroSlider = () => {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const playing = !paused && !hovered && !focused && !hidden && !reducedMotion;
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(media.matches);
    const visibility = () => setHidden(document.hidden);
    media.addEventListener('change', change);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      media.removeEventListener('change', change);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 5500);
    return () => window.clearInterval(timer);
  }, [playing]);
  const select = (index: number) => { setPaused(true); setActive((index + slides.length) % slides.length); };
  return (
    <div className="vb-slider" role="region" aria-roledescription="캐러셀" aria-label="VoiceBridge의 세 단계"
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
      onTouchStart={event => { touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
      onTouchEnd={event => {
        if (!touch.current) return;
        const dx = event.changedTouches[0].clientX - touch.current.x;
        const dy = event.changedTouches[0].clientY - touch.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(active + (dx < 0 ? 1 : -1));
        touch.current = null;
      }} onTouchCancel={() => { touch.current = null; }}>
      <div className={`vb-slider-art ${playing ? 'is-playing' : ''}`}><VoiceGraphic /></div>
      <div className="vb-slides" aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
        {slides.map((slide, index) => (
          <div key={slide.word} className={`vb-slide ${active === index ? 'is-active' : ''}`}
            aria-hidden={active !== index} role="group" aria-roledescription="슬라이드" aria-label={`${index + 1} / 3`}>
            <p className="vb-eyebrow">0{index + 1} — {slide.word}</p>
            <h2>{slide.title}</h2><p>{slide.description}</p>
          </div>
        ))}
      </div>
      <div className="vb-slider-controls">
        <div className="vb-slider-dots" aria-label="슬라이드 선택">
          {slides.map((slide,index) => <button key={slide.word} type="button" aria-label={`${index + 1}번 슬라이드: ${slide.word}`}
            aria-current={index === active ? 'true' : undefined} onClick={() => select(index)}><span /></button>)}
        </div>
        <div className="vb-slider-arrows">
          <button className="vb-icon-button" type="button" aria-label="이전 슬라이드" onClick={() => select(active - 1)}><ArrowLeft size={20} /></button>
          <button className="vb-icon-button" type="button" aria-label="다음 슬라이드" onClick={() => select(active + 1)}><ArrowRight size={20} /></button>
          {!reducedMotion && <button className="vb-icon-button" type="button" aria-label={paused ? '자동 전환 재생' : '자동 전환 일시정지'}
            onClick={() => setPaused(value => !value)}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>}
        </div>
      </div>
    </div>
  );
};
