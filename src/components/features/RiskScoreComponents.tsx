/**
 * RiskScoreGauge – Circular gauge for the global risk score (0-100).
 * Color-coded: green (low risk) → red (critical).
 */

interface RiskScoreGaugeProps {
  score: number;
  size?: number;
  label?: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return '#059669'; // emerald-600
  if (score >= 50) return '#d97706'; // amber-600
  if (score >= 25) return '#ea580c'; // orange-600
  return '#dc2626'; // red-600
}

function getScoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  if (score >= 25) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

function getScoreLabel(score: number): string {
  if (score >= 75) return 'Risque faible';
  if (score >= 50) return 'Risque modéré';
  if (score >= 25) return 'Risque élevé';
  return 'Risque critique';
}

export function RiskScoreGauge({ score, size = 160, label }: RiskScoreGaugeProps) {
  const color = getScoreColor(score);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={8}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={8}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-xs text-slate-500">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>
        {label || getScoreLabel(score)}
      </span>
    </div>
  );
}

/* ─── Risk Category Badge ─── */

interface RiskBadgeProps {
  categorie: string;
}

export function RiskBadge({ categorie }: RiskBadgeProps) {
  const config: Record<string, { bg: string; text: string; dot: string }> = {
    FAIBLE: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    MODÉRÉ: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
    ÉLEVÉ: { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    CRITIQUE: { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  };

  const c = config[categorie] || config.MODÉRÉ;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      {categorie}
    </span>
  );
}

/* ─── Mini Score Bar ─── */

interface MiniScoreBarProps {
  score: number;
  label: string;
  icon: React.ReactNode;
}

export function MiniScoreBar({ score, label, icon }: MiniScoreBarProps) {
  const color = getScoreColor(score);

  return (
    <div className={`p-4 rounded-xl border ${getScoreBg(score)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-bold" style={{ color }}>
          {score}/100
        </span>
      </div>
      <div className="h-2 bg-white/60 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/* ─── Risk Detail Card ─── */

interface RiskDetailCardProps {
  title: string;
  icon: React.ReactNode;
  score: number;
  children: React.ReactNode;
}

export function RiskDetailCard({ title, icon, score, children }: RiskDetailCardProps) {
  const color = getScoreColor(score);

  return (
    <div className={`rounded-xl border p-5 ${getScoreBg(score)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
            <span className="text-xs font-bold" style={{ color }}>{score}</span>
          </div>
        </div>
      </div>
      <div className="text-sm text-slate-700 space-y-2">
        {children}
      </div>
    </div>
  );
}
