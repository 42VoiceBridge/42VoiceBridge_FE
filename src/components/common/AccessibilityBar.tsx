import { Eye } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { FontSizeLevel } from '../../types';

export const AccessibilityBar = () => {
  const { fontSize, setFontSize, highContrast, setHighContrast } = useApp();
  const fontOptions: { level: FontSizeLevel; label: string }[] = [
    { level: 'normal', label: '보통' },
    { level: 'large', label: '크게' },
    { level: 'xlarge', label: '아주 크게' },
  ];
  return <div className="vb-accessibility">
    <div role="group" aria-label="글자 크기">
      <p>글자 크기</p>
      <div className="vb-font-options">{fontOptions.map(opt => <button key={opt.level} onClick={() => setFontSize(opt.level)} aria-pressed={fontSize === opt.level}>{opt.label}</button>)}</div>
    </div>
    <button className="vb-contrast-toggle" onClick={() => setHighContrast(!highContrast)} aria-pressed={highContrast}>
      <Eye size={20} /><span>고대비 보기</span><span>{highContrast ? '켜짐' : '꺼짐'}</span>
    </button>
  </div>;
};
