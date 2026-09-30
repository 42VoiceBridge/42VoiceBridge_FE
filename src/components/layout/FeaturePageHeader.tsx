import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useApp } from '../../context/AppContext';

interface FeaturePageHeaderProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  meta?: ReactNode;
}

export const FeaturePageHeader = ({ eyebrow, title, description, meta }: FeaturePageHeaderProps) => {
  const { goBack } = useApp();
  return (
    <header className="vb-page-header">
      <button className="vb-back-link" type="button" onClick={goBack}>
        <ArrowLeft size={20} /><span>BACK</span><span className="vb-back-korean">홈으로</span>
      </button>
      <div className="vb-page-kicker"><span>{eyebrow}</span>{meta && <span>{meta}</span>}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </header>
  );
};
