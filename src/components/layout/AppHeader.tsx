import { useState } from 'react';
import { ArrowUpRight, LogIn, LogOut, Menu, UserRound, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../../context/AppContext';
import { AccessibilityBar } from '../common/AccessibilityBar';
import { BrandDialog } from '../common/BrandDialog';

const navItems: { id: NavTab; label: string; english: string }[] = [
  { id: 'dashboard', label: '홈', english: 'Home' },
  { id: 'assist', label: '실시간 대화', english: 'Voice Assist' },
  { id: 'personalization', label: 'AI 학습', english: 'Your AI' },
  { id: 'diagnosis', label: '발음 분석', english: 'Speech' },
  { id: 'history', label: '기록', english: 'History' },
  { id: 'settings', label: '설정', english: 'Settings' },
];

export const AppHeader = () => {
  const { user, currentTab, setCurrentTab, logout } = useApp();
  const [openPanel, setOpenPanel] = useState<'menu' | 'account' | null>(null);
  const navigate = (tab: NavTab) => { setCurrentTab(tab); setOpenPanel(null); };
  if (!user) {
    return (
      <header className="vb-theme vb-header">
        <div className="vb-header-inner" style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="vb-wordmark" aria-label="VoiceBridge 홈" style={{ pointerEvents: 'none' }}>
            VOICE<span>BRIDGE</span><i aria-hidden="true">∿</i>
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="vb-theme vb-header">
      {currentTab === 'dashboard' && <a className="vb-skip-link" href="#voicebridge-content">본문으로 이동</a>}
      <div className="vb-header-inner">
        <button className="vb-header-action" aria-label="메뉴 열기" aria-expanded={openPanel === 'menu'} aria-haspopup="dialog" onClick={() => setOpenPanel('menu')}>
          <Menu size={24} strokeWidth={1.5} /><span>MENU</span>
        </button>
        <button className="vb-wordmark" aria-label="VoiceBridge 홈" onClick={() => navigate('dashboard')}>VOICE<span>BRIDGE</span><i aria-hidden="true">∿</i></button>
        <button className="vb-header-action vb-header-account" aria-label={user ? '마이페이지 열기' : '로그인하기'}
          aria-haspopup={user ? 'dialog' : undefined} aria-expanded={user ? openPanel === 'account' : undefined}
          onClick={() => user ? setOpenPanel('account') : navigate('login')}>
          <span>{user ? 'MY PAGE' : 'LOGIN'}</span><UserRound size={23} strokeWidth={1.5} />
        </button>
      </div>
      {openPanel === 'menu' && <BrandDialog label="전체 메뉴와 접근성 설정" className="vb-menu-dialog" onClose={() => setOpenPanel(null)}>
        <div className="vb-drawer">
          <div className="vb-drawer-top"><span className="vb-eyebrow">VOICEBRIDGE / MENU</span>
            <button className="vb-icon-button" aria-label="메뉴 닫기" onClick={() => setOpenPanel(null)}><X size={26} /></button>
          </div>
          {user && <nav aria-label="주요 메뉴">
            {navItems.map((item,index) => <button key={item.id} onClick={() => navigate(item.id)}
              aria-current={currentTab === item.id || (item.id === 'diagnosis' && currentTab === 'practice') ? 'page' : undefined}>
              <span className="vb-nav-index">0{index + 1}</span><span>{item.label}</span><small>{item.english}</small><ArrowUpRight size={22} />
            </button>)}
          </nav>}
          <section className="vb-drawer-access" aria-labelledby="vb-access-title">
            <h2 id="vb-access-title">편안하게 보기</h2><AccessibilityBar />
          </section>
          {!user && <div className="vb-drawer-account"><button className="vb-text-link" onClick={() => navigate('login')}><LogIn size={20} />로그인하기<ArrowUpRight size={20} /></button></div>}
          <p className="vb-drawer-note">Every voice deserves to be heard.</p>
        </div>
      </BrandDialog>}
      {openPanel === 'account' && user && <BrandDialog label="내 계정 정보" className="vb-account-dialog" onClose={() => setOpenPanel(null)}>
        <div className="vb-drawer vb-account-drawer">
          <div className="vb-drawer-top"><span className="vb-eyebrow">VOICEBRIDGE / MY PAGE</span>
            <button className="vb-icon-button" aria-label="마이페이지 닫기" onClick={() => setOpenPanel(null)}><X size={26} /></button>
          </div>
          <section className="vb-profile-section" aria-labelledby="vb-profile-title">
            <p className="vb-eyebrow" id="vb-profile-title">PROFILE</p>
            <dl><div><dt>닉네임</dt><dd>{user.name}</dd></div><div><dt>이메일</dt><dd>{user.email}</dd></div></dl>
          </section>
          <section className="vb-account-section" aria-labelledby="vb-account-title">
            <p className="vb-eyebrow" id="vb-account-title">ACCOUNT</p>
            <button type="button" disabled><span>이메일 변경</span><small>준비 중</small></button>
            <button type="button" disabled><span>비밀번호 변경</span><small>준비 중</small></button>
          </section>
          <button className="vb-account-logout" type="button" onClick={() => { logout(); setOpenPanel(null); }}><span>LOG OUT</span><LogOut size={22} /></button>
          <p className="vb-drawer-note">계정 정보는 현재 로그인된 프로필을 기준으로 표시됩니다.</p>
        </div>
      </BrandDialog>}
    </header>
  );
};
