import { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Copy, Maximize2, Mic, Volume2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { speakText } from '../../utils/audioUtils';
import { BrandDialog } from '../../components/common/BrandDialog';
import { HeroSlider } from '../../components/home/HeroSlider';
import { VoiceGraphic } from '../../components/home/VoiceGraphic';
import { Reveal } from '../../components/home/Reveal';

export const DashboardPage = () => {
  const { user, assistMessages, setCurrentTab } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [bigViewText, setBigViewText] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeakAloud = async (text: string) => {
    if (speakingId) return;
    try {
      await speakText(text, 0.9);
    } catch (error: any) {
      console.error('TTS error:', error);
      alert('음성 재생 기능 준비 중입니다.');
    } finally {
      setSpeakingId(null);
    }
  };

  return (
    <div className="vb-theme vb-home" id="voicebridge-content" tabIndex={-1}>
      <section className="vb-hero vb-container" aria-labelledby="vb-hero-title">
        <div className="vb-hero-topline"><p className="vb-eyebrow">A BRIDGE FOR EVERY VOICE</p><span>01 / CONNECTION</span></div>
        <div className="vb-hero-layout">
          <div className="vb-hero-copy">
            <h1 id="vb-hero-title" className="vb-display" aria-label="Voice Bridge"><span>VOICE</span><span>BRIDGE<span className="vb-title-dot" aria-hidden="true">.</span></span></h1>
            <p className="vb-hero-statement">말이 조금 달라도,<br />소통은 자연스럽게 이어지도록.</p>
            <p className="vb-hero-description">구음장애 사용자의 발화를 AI가 이해하고<br className="vb-desktop-break" /> 더 명확한 문장과 음성으로 전달합니다.</p>
            <button className="vb-button" onClick={() => setCurrentTab('assist')}><Mic size={21} strokeWidth={1.7} /><span>말해서 전달하기</span><ArrowUpRight size={24} /></button>
          </div>
          <HeroSlider />
        </div>
        <div className="vb-hero-bottom"><span>당신의 목소리, 그 안에 담긴 이야기.</span><a href="#vb-intro" className="vb-text-link">서비스 알아보기<ArrowDown size={18} /></a></div>
      </section>

      <section id="vb-intro" className="vb-intro" aria-labelledby="vb-intro-title">
        <Reveal className="vb-container vb-editorial-grid">
          <div className="vb-section-copy">
            <p className="vb-eyebrow">02 / BEYOND THE WORDS</p>
            <h2 id="vb-intro-title">말을 이해하고,<br />마음을 잇습니다.</h2>
            <p>중요한 건 완벽한 발음보다,<br />전하고 싶은 당신의 이야기니까요.</p>
            <p className="vb-muted">VoiceBridge는 발화에 담긴 뜻을 이해하고<br className="vb-desktop-break" /> 읽기 쉬운 문장과 또렷한 음성으로 연결합니다.<br className="vb-desktop-break" /> 일상의 대화가 조금 더 편안해지도록.</p>
            <a className="vb-text-link" href="#vb-process">어떻게 전달되나요?<ArrowDown size={20} /></a>
          </div>
          <div className="vb-intro-visual"><VoiceGraphic variant="conversation" /><div className="vb-visual-caption"><span>YOUR VOICE</span><span className="vb-caption-line" /><span>OUR CONNECTION</span></div></div>
        </Reveal>
      </section>

      <section className="vb-process" id="vb-process" aria-labelledby="vb-process-title">
        <Reveal className="vb-container">
          <div className="vb-section-heading"><p className="vb-eyebrow">03 / HOW IT WORKS</p><span>목소리에서, 소통으로.</span></div>
          <h2 id="vb-process-title">말하고. 이해하고.<br /><span>또렷하게 전합니다.</span></h2>
          <ol className="vb-process-flow">
            <li><div className="vb-process-label"><span>01</span><ArrowRight size={28} /></div><h3>SPEAK</h3><p>편하게 말해주세요.</p><span>익숙한 속도와 목소리 그대로.</span></li>
            <li><div className="vb-process-label"><span>02</span><ArrowRight size={28} /></div><h3>UNDERSTAND</h3><p>뜻을 담은 문장으로.</p><span>AI가 발화를 이해합니다.</span></li>
            <li><div className="vb-process-label"><span>03</span><Volume2 size={28} strokeWidth={1.5} /></div><h3>DELIVER</h3><p>확인하고, 전달하세요.</p><span>전할 문장을 확인한 뒤 음성으로.</span></li>
          </ol>
          <button className="vb-button vb-button--light" onClick={() => setCurrentTab('assist')}><span>말해서 전달하기</span><ArrowUpRight size={24} /></button>
        </Reveal>
      </section>

      <section className="vb-personal vb-container" aria-labelledby="vb-personal-title">
        <Reveal>
          <p className="vb-eyebrow">04 / MADE FOR YOUR VOICE</p>
          <div className="vb-personal-grid">
            <div><h2 id="vb-personal-title" className="vb-personal-title">YOUR VOICE,<br /><span>YOUR AI.</span></h2><div className="vb-personal-lines" aria-hidden="true">{Array.from({ length: 7 }, (_,i) => <span key={i} />)}</div></div>
            <div className="vb-section-copy"><h3>나의 목소리를,<br />조금 더 잘 이해하도록.</h3><p className="vb-muted">저마다 다른 발화의 리듬과 습관.<br />개인화 학습과 발음 관리로<br />나에게 맞는 소통을 준비합니다.</p>
              <button className="vb-feature-link" onClick={() => setCurrentTab('personalization')}><span><small>PERSONALIZATION</small>나의 AI 학습</span><ArrowUpRight size={26} /></button>
              <button className="vb-feature-link" onClick={() => setCurrentTab('diagnosis')}><span><small>SPEECH CARE</small>발음 관리 시작하기</span><ArrowUpRight size={26} /></button>
            </div>
          </div>
        </Reveal>
      </section>

      {assistMessages.length > 0 && <section className="vb-recent vb-container" aria-label="최근 대화 결과">
        <details><summary><span>{user?.name}님의 최근 대화</span><span className="vb-recent-hint">대화 결과 보기 <ArrowDown size={20} /></span></summary>
          <div className="vb-recent-list">{assistMessages.slice(0, 2).map(msg => <article key={msg.id}>
            <p className="vb-eyebrow">{msg.timestamp} · 개인 모델 정확도 {msg.confidence}%</p><p className="vb-recent-text">“{msg.correctedText}”</p>
            <div className="vb-recent-actions">
              <button className="vb-text-link" onClick={() => handleSpeakAloud(msg.correctedText)}><Volume2 size={20} />{speakingId === msg.id ? '듣는 중...' : '또렷하게 들려주기'}</button>
              <button className="vb-text-link" onClick={() => setBigViewText(msg.correctedText)}><Maximize2 size={20} />화면 가득 보여주기</button>
              <button className="vb-text-link" onClick={() => handleCopy(msg.id, msg.correctedText)}>{copiedId === msg.id ? <Check size={20} /> : <Copy size={20} />}{copiedId === msg.id ? '복사됨!' : '글자 복사'}</button>
            </div>
          </article>)}</div>
        </details>
        <button className="vb-text-link" onClick={() => setCurrentTab('history')}>전체 기록 보기<ArrowUpRight size={20} /></button>
      </section>}

      <div className="vb-home-signoff vb-container"><span>VOICEBRIDGE</span><p>Every voice deserves<br />to be heard.</p></div>

      {bigViewText && <BrandDialog label="대화 문장 크게 보기" className="vb-reading-dialog" onClose={() => setBigViewText(null)}>
        <div className="vb-reading-panel">
          <div className="vb-reading-top"><button className="vb-text-link" onClick={() => setBigViewText(null)}><X size={24} />화면 닫기</button></div>
          <p>대화 상대방에게 이 화면을 보여주세요</p><div className="vb-reading-text">“{bigViewText}”</div>
          <button className="vb-button" onClick={() => handleSpeakAloud(bigViewText)}><Volume2 size={24} />{speakingId === 'big-view' ? '듣는 중...' : '소리로 읽어주기'}</button>
        </div>
      </BrandDialog>}
    </div>
  );
};
