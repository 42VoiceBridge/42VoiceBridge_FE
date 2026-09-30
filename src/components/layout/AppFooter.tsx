import { useState } from 'react';
import { X } from 'lucide-react';
import { BrandDialog } from '../common/BrandDialog';
import { termsOfServiceText } from '../../content/terms';
import { privacyPolicyText } from '../../content/privacy';

type LegalView = 'terms' | 'privacy' | null;

export const AppFooter = () => {
  const [legalView, setLegalView] = useState<LegalView>(null);
  return (
    <footer className="vb-theme vb-footer">
      <div className="vb-footer-inner">
        <strong>VOICE<span>BRIDGE</span></strong>
        <div className="vb-footer-links">
          <button type="button" onClick={() => setLegalView('terms')}>이용약관</button>
          <button type="button" onClick={() => setLegalView('privacy')}>개인정보처리방침</button>
        </div>
        <div className="vb-footer-meta"><span>© 2026 VoiceBridge.</span><span>Made by [Team Name]</span></div>
      </div>
      {legalView && <BrandDialog label={legalView === 'terms' ? '이용약관 안내' : '개인정보처리방침 안내'} className="vb-legal-dialog" onClose={() => setLegalView(null)}>
        <div className="vb-legal-panel">
          <div className="vb-drawer-top"><span className="vb-eyebrow">LEGAL / DOCUMENT</span>
            <button className="vb-icon-button" type="button" aria-label="안내 닫기" onClick={() => setLegalView(null)}><X size={24} /></button>
          </div>
          <p className="vb-eyebrow">{legalView === 'terms' ? 'TERMS OF SERVICE' : 'PRIVACY POLICY'}</p>
          <h2>{legalView === 'terms' ? '이용약관' : '개인정보처리방침'}</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: 'var(--text-sm)', color: 'var(--vb-ink)' }}>
            {legalView === 'terms' ? termsOfServiceText : privacyPolicyText}
          </div>
          <button className="vb-button" style={{ marginTop: '28px' }} type="button" onClick={() => setLegalView(null)}>확인</button>
        </div>
      </BrandDialog>}
    </footer>
  );
};

