import { useState } from 'react';
import {
  ArrowUpRight,
  HelpCircle,
  LogIn,
  LogOut,
  Menu,
  UserRound,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  AlertTriangle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { NavTab } from '../../context/AppContext';
import { withdrawApi, AuthApiError } from '../../api/auth';
import { AccessibilityBar } from '../common/AccessibilityBar';
import { BrandDialog } from '../common/BrandDialog';
import { SeniorButton } from '../common/SeniorButton';
import { isConversationModeEnabled } from '../../utils/featureFlags';

const getNavItems = (): { id: NavTab; label: string; english: string }[] => {
  const items: { id: NavTab; label: string; english: string }[] = [
    { id: 'dashboard', label: '홈', english: 'Home' },
    { id: 'assist', label: '실시간 말하기', english: 'Voice Assist' },
    { id: 'phrases', label: '자주 쓰는 문구', english: 'Quick Phrases' },
  ];
  if (isConversationModeEnabled()) {
    items.push({ id: 'conversation', label: 'AI 대화', english: 'AI Conversation' });
  }
  items.push(
    { id: 'history', label: '기록', english: 'History' },
    { id: 'settings', label: '설정', english: 'Settings' }
  );
  return items;
};

const NOTICE_ITEM = {
  id: 1,
  category: '서비스 이용 안내',
  title: 'AI 기능 이용 시 유의사항',
  content: `말이음의 AI 기능은 사용자의 음성을 인식하고 원활한 의사소통을 돕기 위해 제공됩니다.

AI가 변환하거나 추천한 문장은 실제 말하려던 의도와 다를 수 있으므로, 상대방에게 전달하기 전에 내용을 확인해 주세요.

음성인식 및 AI 문장 추천 기능을 이용하는 과정에서 음성 또는 입력한 텍스트가 외부 AI 서비스로 전송될 수 있습니다.

특히 AI 대화 기능으로 상대방의 음성을 녹음할 때에는 녹음 및 서비스 이용 사실을 미리 알리고 동의를 구해 주세요.

민감한 개인정보는 가능한 한 입력하거나 녹음하지 않는 것을 권장합니다.`
};

const FAQ_ITEMS = [
  {
    id: 1,
    question: 'Q1. 말이음은 어떤 서비스인가요?',
    answer: '말이음은 발음이나 의사소통에 어려움을 겪는 사용자가 자신의 말을 텍스트로 확인하고, 또렷한 음성으로 전달할 수 있도록 돕는 서비스입니다. 자주 쓰는 문구와 AI 대화 기능도 이용할 수 있습니다.'
  },
  {
    id: 2,
    question: 'Q2. 음성인식이 잘되지 않아요.',
    answer: '먼저 브라우저에서 마이크 사용 권한이 허용되어 있는지 확인해 주세요. 주변 소음이 적은 곳에서 기기와 적절한 거리를 유지하며 말하면 도움이 될 수 있습니다. 인식 결과가 정확하지 않다면 다시 녹음해 주세요.'
  },
  {
    id: 3,
    question: 'Q3. 자주 쓰는 문구는 어떻게 등록하나요?',
    answer: '\'자주 쓰는 문구\' 화면에서 문구 추가 버튼을 누르고 카테고리와 문장을 입력하면 됩니다. AI 문장 추천 기능을 이용해 추천받은 문장을 선택하고 저장할 수도 있습니다.'
  },
  {
    id: 4,
    question: 'Q4. AI 문장 추천은 어떤 기능인가요?',
    answer: '전달하고 싶은 내용을 입력하면 AI가 상황에 어울리는 문장을 추천합니다. 추천된 문장을 확인하고 필요에 따라 수정한 뒤 자주 쓰는 문구로 저장할 수 있습니다.'
  },
  {
    id: 5,
    question: 'Q5. AI 대화는 어떻게 사용하나요?',
    answer: '상대방의 말을 녹음하면 AI가 들은 내용을 텍스트로 보여주고 답변 문장을 추천합니다. 원하는 답변을 선택하면 음성으로 전달할 수 있습니다. 추천 문장이 마음에 들지 않으면 직접 말하기 기능을 이용할 수 있습니다. 상대방의 음성을 녹음하기 전에는 녹음 사실을 알리고 동의를 구해 주세요.'
  },
  {
    id: 6,
    question: 'Q6. 음성이 재생되지 않아요.',
    answer: '먼저 기기의 음량과 음소거 상태를 확인해 주세요. 브라우저에서 소리 재생이 차단되지 않았는지도 확인하고, 재생 버튼을 다시 눌러 보세요. 문제가 계속되면 페이지를 새로고침한 뒤 다시 시도해 주세요.'
  },
  {
    id: 7,
    question: 'Q7. AI가 인식한 문장이 정확하지 않으면 어떻게 하나요?',
    answer: 'AI 음성인식 결과는 실제로 말한 내용과 다를 수 있습니다. 화면에 표시된 문장을 확인하고, 필요한 경우 수정하거나 다시 녹음한 뒤 상대방에게 전달해 주세요.'
  }
];

export const AppHeader = () => {
  const { user, currentTab, setCurrentTab, logout, completeWithdrawal, openOnboarding } = useApp();
  const [openPanel, setOpenPanel] = useState<'menu' | 'account' | null>(null);
  const [isClosing, setIsClosing] = useState<boolean>(false);

  // MY PAGE 내부 화면 전환 상태 ('main' | 'notice_list' | 'notice_detail' | 'faq')
  const [myPageView, setMyPageView] = useState<'main' | 'notice_list' | 'notice_detail' | 'faq'>('main');
  const [expandedFaqId, setExpandedFaqId] = useState<number | null>(null);

  // 회원 탈퇴 모달 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState<boolean>(false);
  const [withdrawPassword, setWithdrawPassword] = useState<string>('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const isKakaoUser =
    user?.provider === 'KAKAO' || (!user?.provider && user?.loginProvider === 'kakao');
  const userProvider: 'LOCAL' | 'KAKAO' = isKakaoUser ? 'KAKAO' : 'LOCAL';

  const openWithdrawModal = () => {
    setWithdrawPassword('');
    setWithdrawError(null);
    setIsWithdrawing(false);
    setShowWithdrawModal(true);
  };

  const closeWithdrawModal = () => {
    if (isWithdrawing) return;
    setShowWithdrawModal(false);
    setWithdrawPassword('');
    setWithdrawError(null);
  };

  const handleWithdraw = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isWithdrawing) return;

    if (!isKakaoUser && !withdrawPassword.trim()) {
      setWithdrawError('현재 비밀번호를 입력해 주세요.');
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);

    try {
      await withdrawApi(userProvider, isKakaoUser ? undefined : withdrawPassword);
      // HTTP 204 성공 후에만 패널/모달을 닫고 인증 상태 초기화 및 로그인 화면으로 이동
      setShowWithdrawModal(false);
      setWithdrawPassword('');
      setWithdrawError(null);
      setOpenPanel(null);
      setIsClosing(false);
      setMyPageView('main');
      setExpandedFaqId(null);
      completeWithdrawal();
    } catch (err: unknown) {
      if (err instanceof AuthApiError) {
        if (err.code === 'PASSWORD_MISMATCH') {
          setWithdrawError(err.message || '현재 비밀번호가 일치하지 않습니다. 비밀번호를 다시 확인해 주세요.');
        } else if (err.code === 'VALIDATION_FAILED') {
          setWithdrawError(err.message || '입력한 내용을 다시 확인해 주세요.');
        } else if (err.status === 401) {
          setWithdrawError(err.message || '인증이 만료되었습니다. 다시 로그인해 주세요.');
        } else {
          setWithdrawError(err.message || '회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
        }
      } else if (err instanceof Error) {
        setWithdrawError(err.message || '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      } else {
        setWithdrawError('회원 탈퇴 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setIsWithdrawing(false);
    }
  };

  const closePanel = (onClosed?: () => void) => {
    if (isClosing || isWithdrawing) return;
    setIsClosing(true);
    setTimeout(() => {
      setOpenPanel(null);
      setIsClosing(false);
      setMyPageView('main');
      setExpandedFaqId(null);
      setShowWithdrawModal(false);
      setWithdrawPassword('');
      setWithdrawError(null);
      if (onClosed) onClosed();
    }, 280);
  };

  const navigate = (tab: NavTab) => {
    closePanel(() => {
      setCurrentTab(tab);
    });
  };

  const toggleFaq = (id: number) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };


  return (
    <header className="vb-theme vb-header">
      {currentTab === 'dashboard' && <a className="vb-skip-link" href="#voicebridge-content">본문으로 이동</a>}
      <div className="vb-header-inner">
        <button
          className="vb-header-action vb-header-account"
          aria-label={user ? '마이페이지 열기' : '로그인하기'}
          aria-haspopup={user ? 'dialog' : undefined}
          aria-expanded={user ? openPanel === 'account' : undefined}
          onClick={() => {
            if (user) {
              setOpenPanel('account');
              setMyPageView('main');
            } else {
              sessionStorage.setItem('redirectTab', currentTab !== 'login' && currentTab !== 'register' ? currentTab : 'dashboard');
              navigate('login');
            }
          }}
        >
          <UserRound size={23} strokeWidth={1.5} />
          <span>{user ? 'MY PAGE' : 'LOGIN'}</span>
        </button>

        <button className="vb-wordmark" aria-label="VoiceBridge 홈" onClick={() => navigate('dashboard')}>
          VOICE<span>BRIDGE</span>
        </button>

        <button
          className="vb-header-action vb-header-menu"
          aria-label="메뉴 열기"
          aria-expanded={openPanel === 'menu'}
          aria-haspopup="dialog"
          onClick={() => setOpenPanel('menu')}
        >
          <span>MENU</span>
          <Menu size={24} strokeWidth={1.5} />
        </button>
      </div>

      {/* 1. MENU 서랍 패널 (슬라이드 애니메이션) */}
      {openPanel === 'menu' && (
        <BrandDialog
          label="전체 메뉴와 접근성 설정"
          className={`vb-menu-dialog ${isClosing ? 'is-closing' : ''}`}
          onClose={() => closePanel()}
        >
          <div className="vb-drawer">
            <div className="vb-drawer-top">
              <span className="vb-eyebrow">VOICEBRIDGE / MENU</span>
              <button className="vb-icon-button" aria-label="메뉴 닫기" onClick={() => closePanel()}>
                <X size={26} />
              </button>
            </div>

            <nav aria-label="주요 메뉴">
              {getNavItems().map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.id)}
                  aria-current={currentTab === item.id ? 'page' : undefined}
                >
                  <span className="vb-nav-index">0{index + 1}</span>
                  <span>{item.label}</span>
                  <small>{item.english}</small>
                  <ArrowUpRight size={22} />
                </button>
              ))}
            </nav>

            <section className="vb-drawer-access" aria-labelledby="vb-access-title">
              <h2 id="vb-access-title">편안하게 보기</h2>
              <AccessibilityBar />
            </section>

            <div style={{ paddingBlock: '18px', borderBottom: '1px solid var(--vb-line)' }}>
              <button
                type="button"
                className="vb-text-link"
                onClick={() => {
                  closePanel(() => {
                    openOnboarding();
                  });
                }}
                style={{ width: '100%', justifyContent: 'space-between', borderBottom: 'none' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-base)' }}>
                  <HelpCircle size={20} color="var(--vb-green)" />
                  이용 방법 다시 보기
                </span>
                <ArrowUpRight size={20} />
              </button>
            </div>

            {!user && (
              <div className="vb-drawer-account">
                <button
                  className="vb-text-link"
                  onClick={() => {
                    closePanel(() => {
                      sessionStorage.setItem('redirectTab', currentTab !== 'login' && currentTab !== 'register' ? currentTab : 'dashboard');
                      setCurrentTab('login');
                    });
                  }}
                >
                  <LogIn size={20} />
                  로그인하기
                  <ArrowUpRight size={20} />
                </button>
              </div>
            )}

            <p className="vb-drawer-note">Every voice deserves to be heard.</p>
          </div>
        </BrandDialog>
      )}

      {/* 2. MY PAGE 서랍 패널 (슬라이드 애니메이션 & 서브뷰 지원) */}
      {openPanel === 'account' && user && (
        <BrandDialog
          label="내 계정 정보"
          className={`vb-account-dialog ${isClosing ? 'is-closing' : ''}`}
          onClose={() => closePanel()}
        >
          <div className="vb-drawer vb-account-drawer" style={{ display: 'flex', flexDirection: 'column' }}>
            {/* 서브뷰 1: 메인 MY PAGE */}
            {myPageView === 'main' && (
              <>
                <div className="vb-drawer-top">
                  <span className="vb-eyebrow">VOICEBRIDGE / MY PAGE</span>
                  <button className="vb-icon-button" aria-label="마이페이지 닫기" onClick={() => closePanel()}>
                    <X size={26} />
                  </button>
                </div>

                {/* 1. PROFILE (원형 사용자 아이콘 + 닉네임) */}
                <section className="vb-profile-section" aria-labelledby="vb-profile-title">
                  <p className="vb-eyebrow" id="vb-profile-title" style={{ marginBottom: '10px' }}>PROFILE</p>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px 20px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid var(--vb-line)',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                    }}
                  >
                    <div
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '50%',
                        backgroundColor: '#eef4ed',
                        border: '1.5px solid #d3e2d1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--vb-green)',
                        flexShrink: 0,
                      }}
                      aria-hidden="true"
                    >
                      <UserRound size={28} strokeWidth={1.8} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--vb-muted)', fontWeight: 600 }}>
                        사용자
                      </span>
                      <strong
                        style={{
                          fontSize: 'var(--text-xl)',
                          fontWeight: 700,
                          color: 'var(--vb-ink)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {user.name || '사용자'}
                      </strong>
                    </div>
                  </div>
                </section>

                {/* 2. SUPPORT (공지사항 ↗, 자주 묻는 질문 ↗) */}
                <section className="vb-account-section" aria-labelledby="vb-support-title">
                  <p className="vb-eyebrow" id="vb-support-title" style={{ marginBottom: '10px' }}>SUPPORT</p>
                  <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid var(--vb-line)' }}>
                    <button
                      type="button"
                      onClick={() => setMyPageView('notice_list')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '15px 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--vb-line)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 'var(--text-base)',
                        color: 'var(--vb-ink)'
                      }}
                    >
                      <span>공지사항</span>
                      <ArrowUpRight size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setMyPageView('faq')}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%',
                        padding: '15px 0',
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--vb-line)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: 'var(--text-base)',
                        color: 'var(--vb-ink)'
                      }}
                    >
                      <span>자주 묻는 질문</span>
                      <ArrowUpRight size={20} />
                    </button>
                  </div>
                </section>

                {/* 3. 하단 계정 액션: 회원 탈퇴 → 로그아웃 나란히 배치 */}
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '20px',
                    borderTop: '1px solid var(--vb-line)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    type="button"
                    onClick={openWithdrawModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '8px 2px',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--vb-muted)',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      textUnderlineOffset: '4px',
                      transition: 'color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-danger, #c84040)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--vb-muted)')}
                  >
                    회원 탈퇴
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      closePanel(() => {
                        logout();
                      });
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'none',
                      border: '1px solid var(--vb-line)',
                      borderRadius: '8px',
                      padding: '10px 18px',
                      fontSize: 'var(--text-base)',
                      fontWeight: 600,
                      color: 'var(--vb-ink)',
                      cursor: 'pointer',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>로그아웃</span>
                    <LogOut size={18} />
                  </button>
                </div>
              </>
            )}

            {/* 서브뷰 2: 공지사항 목록 */}
            {myPageView === 'notice_list' && (
              <>
                <div className="vb-subview-top">
                  <button
                    type="button"
                    className="vb-back-btn"
                    onClick={() => setMyPageView('main')}
                    aria-label="마이페이지 메인으로 돌아가기"
                  >
                    <ChevronLeft size={20} />
                    <span>돌아가기</span>
                  </button>
                  <span className="vb-eyebrow">NOTICE</span>
                  <button className="vb-icon-button" aria-label="닫기" onClick={() => closePanel()}>
                    <X size={26} />
                  </button>
                </div>

                <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '20px' }}>공지사항</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    className="vb-notice-card"
                    onClick={() => setMyPageView('notice_detail')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          backgroundColor: '#e6ede6',
                          color: '#1a3c2c'
                        }}
                      >
                        {NOTICE_ITEM.category}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 'var(--text-lg)', color: 'var(--vb-ink)' }}>
                        {NOTICE_ITEM.title}
                      </strong>
                      <ArrowUpRight size={20} color="var(--vb-muted)" />
                    </div>
                  </button>
                </div>
              </>
            )}

            {/* 서브뷰 3: 공지사항 상세 */}
            {myPageView === 'notice_detail' && (
              <>
                <div className="vb-subview-top">
                  <button
                    type="button"
                    className="vb-back-btn"
                    onClick={() => setMyPageView('notice_list')}
                    aria-label="공지사항 목록으로 돌아가기"
                  >
                    <ChevronLeft size={20} />
                    <span>목록으로</span>
                  </button>
                  <span className="vb-eyebrow">NOTICE DETAIL</span>
                  <button className="vb-icon-button" aria-label="닫기" onClick={() => closePanel()}>
                    <X size={26} />
                  </button>
                </div>

                <article style={{ background: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid var(--vb-line)' }}>
                  <div style={{ marginBottom: '14px' }}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e6ede6',
                        color: '#1a3c2c'
                      }}
                    >
                      {NOTICE_ITEM.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '20px', lineHeight: 1.4 }}>
                    {NOTICE_ITEM.title}
                  </h3>

                  <div
                    style={{
                      fontSize: 'var(--text-base)',
                      lineHeight: '1.75',
                      color: '#2a3b31',
                      whiteSpace: 'pre-line',
                      wordBreak: 'keep-all'
                    }}
                  >
                    {NOTICE_ITEM.content}
                  </div>
                </article>
              </>
            )}

            {/* 서브뷰 4: 자주 묻는 질문(FAQ) */}
            {myPageView === 'faq' && (
              <>
                <div className="vb-subview-top">
                  <button
                    type="button"
                    className="vb-back-btn"
                    onClick={() => setMyPageView('main')}
                    aria-label="마이페이지 메인으로 돌아가기"
                  >
                    <ChevronLeft size={20} />
                    <span>돌아가기</span>
                  </button>
                  <span className="vb-eyebrow">FAQ</span>
                  <button className="vb-icon-button" aria-label="닫기" onClick={() => closePanel()}>
                    <X size={26} />
                  </button>
                </div>

                <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, marginBottom: '16px' }}>자주 묻는 질문</h3>

                <div style={{ borderTop: '1px solid var(--vb-line)' }}>
                  {FAQ_ITEMS.map((faq) => {
                    const isOpen = expandedFaqId === faq.id;
                    return (
                      <div key={faq.id} className="vb-faq-item">
                        <button
                          type="button"
                          className="vb-faq-header"
                          onClick={() => toggleFaq(faq.id)}
                          aria-expanded={isOpen}
                        >
                          <span style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp size={20} color="var(--vb-green)" style={{ flexShrink: 0 }} />
                          ) : (
                            <ChevronDown size={20} color="var(--vb-muted)" style={{ flexShrink: 0 }} />
                          )}
                        </button>
                        {isOpen && (
                          <div className="vb-faq-body">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </BrandDialog>
      )}

      {/* 회원 탈퇴 확인 모달 */}
      {showWithdrawModal && (
        <BrandDialog
          label="회원 탈퇴 확인"
          className="vb-dialog-add-phrase"
          onClose={closeWithdrawModal}
        >
          <form
            className="vb-modal-panel"
            onSubmit={handleWithdraw}
            style={{
              maxWidth: '480px',
              padding: '32px 28px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
              margin: 'auto'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c',
                  flexShrink: 0
                }}
              >
                <AlertTriangle size={24} />
              </div>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 0, color: '#1a2721' }}>
                정말 회원 탈퇴하시겠어요?
              </h3>
            </div>

            <p style={{ fontSize: 'var(--text-base)', color: '#374151', lineHeight: '1.6', marginBottom: '12px' }}>
              회원 탈퇴 시 계정과 저장된 음성인식 기록, 직접 추가한 문구 및 관련 음성 파일이 삭제됩니다.
            </p>

            <div
              style={{
                backgroundColor: '#f8faf8',
                border: '1px solid var(--vb-line, #e2e8e0)',
                borderRadius: '8px',
                padding: '12px 14px',
                fontSize: 'var(--text-sm)',
                color: '#4b5563',
                lineHeight: '1.55',
                marginBottom: isKakaoUser ? '12px' : '20px'
              }}
            >
              일부 임시 데이터는 최대 10분 후 삭제되며, 백업 데이터는 별도 보존 기간에 따라 처리될 수 있습니다.
            </div>

            {isKakaoUser ? (
              <div
                style={{
                  backgroundColor: '#fef9c3',
                  border: '1px solid #fde047',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  fontSize: 'var(--text-sm)',
                  color: '#713f12',
                  lineHeight: '1.55',
                  marginBottom: withdrawError ? '14px' : '24px'
                }}
              >
                서비스 탈퇴 시 말이음 계정과 이용 기록만 삭제되며, 카카오 계정 자체의 삭제나 카카오 연결 해제는 자동으로 처리되지 않습니다.
              </div>
            ) : (
              <div style={{ marginBottom: '22px' }}>
                <label
                  htmlFor="withdraw-password-input"
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    color: '#1a2721',
                    marginBottom: '8px'
                  }}
                >
                  현재 비밀번호 확인
                </label>
                <input
                  id="withdraw-password-input"
                  type="password"
                  value={withdrawPassword}
                  onChange={(e) => {
                    setWithdrawPassword(e.target.value);
                    if (withdrawError) setWithdrawError(null);
                  }}
                  placeholder="현재 비밀번호를 입력해 주세요"
                  disabled={isWithdrawing}
                  autoComplete="current-password"
                  aria-invalid={Boolean(withdrawError)}
                  aria-describedby={withdrawError ? 'withdraw-error-msg' : undefined}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 'var(--text-base)',
                    borderRadius: '8px',
                    border: withdrawError ? '1.5px solid #dc2626' : '1px solid var(--vb-line, #d1d5db)',
                    backgroundColor: '#ffffff',
                    color: 'var(--vb-ink, #111827)',
                    boxSizing: 'border-box'
                  }}
                />
                {withdrawError && (
                  <p
                    id="withdraw-error-msg"
                    role="alert"
                    style={{
                      marginTop: '8px',
                      marginBottom: 0,
                      fontSize: 'var(--text-sm)',
                      color: '#dc2626',
                      fontWeight: 600,
                      lineHeight: 1.4
                    }}
                  >
                    {withdrawError}
                  </p>
                )}
              </div>
            )}

            {isKakaoUser && withdrawError && (
              <p
                role="alert"
                style={{
                  marginTop: 0,
                  marginBottom: '20px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  fontSize: 'var(--text-sm)',
                  color: '#dc2626',
                  fontWeight: 600,
                  lineHeight: 1.4
                }}
              >
                {withdrawError}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <SeniorButton
                type="button"
                variant="outline"
                size="normal"
                disabled={isWithdrawing}
                onClick={closeWithdrawModal}
              >
                취소
              </SeniorButton>
              <SeniorButton
                type="submit"
                variant="danger"
                size="normal"
                disabled={isWithdrawing}
              >
                {isWithdrawing ? '탈퇴 처리 중...' : '회원 탈퇴'}
              </SeniorButton>
            </div>
          </form>
        </BrandDialog>
      )}
    </header>
  );
};
