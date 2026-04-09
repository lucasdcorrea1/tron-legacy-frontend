import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { orgs } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOrg } from '../context/OrgContext';
import { useToast } from '../components/Toast';
import PaymentForm from '../components/PaymentForm';
import './Signup.css';

const PLANS = {
  starter: {
    name: 'Starter',
    price: { monthly: 49, yearly: 39 },
    features: [
      '3 membros da equipe',
      '50 posts agendados',
      'Instagram + Meta Ads',
      '10 regras auto-resposta',
      'Auto-Boost',
      'CTA Analytics',
    ],
  },
  pro: {
    name: 'Pro',
    price: { monthly: 149, yearly: 119 },
    popular: true,
    features: [
      '10 membros da equipe',
      'Posts e campanhas ilimitados',
      'Instagram + Meta Ads',
      'Email Marketing completo',
      'Tudo ilimitado',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: { monthly: 399, yearly: 319 },
    features: [
      'Membros ilimitados',
      'Tudo do Pro incluso',
      'Suporte prioritario',
      'SLA dedicado',
    ],
  },
};

const STEPS = [
  { num: 1, label: 'Conta' },
  { num: 2, label: 'Empresa' },
  { num: 3, label: 'Pagamento' },
];

const formatCpfCnpj = (value) => {
  const d = value.replace(/\D/g, '');
  if (d.length <= 11) {
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d.replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

export default function Signup() {
  const { plan: planId } = useParams();
  const navigate = useNavigate();
  const { register } = useAuth();
  const { refreshUsage } = useOrg();
  const toast = useToast();
  const plan = PLANS[planId];

  // If already logged in with org, skip to dashboard
  const alreadyLoggedIn = useRef(!!localStorage.getItem('token'));
  useEffect(() => {
    if (alreadyLoggedIn.current) navigate('/admin', { replace: true });
  }, [navigate]);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [cycle, setCycle] = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1 fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 2 fields
  const [orgName, setOrgName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');

  // Track completed data
  const cpfRaw = useRef('');

  const goToStep = (n) => {
    setDirection(n > step ? 'forward' : 'backward');
    setStep(n);
    setError('');
  };

  // ── Step 1: Create account ─────────────────────────────

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      toast.success('Conta criada!');
      goToStep(2);
    } catch (err) {
      const msg = err?.message || '';
      if (msg.includes('cadastrado') || msg.includes('already exists') || msg.includes('already registered')) {
        setError('Este email ja esta cadastrado. Faca login pelo painel.');
      } else {
        setError(msg || 'Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Update company name (org already created during register) ──

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Org was already created during registration — just rename it
      await orgs.update({ name: orgName.trim() });

      toast.success('Empresa configurada!');
      goToStep(3);
    } catch (err) {
      setError(err?.message || 'Erro ao configurar empresa. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Payment success ────────────────────────────

  const handlePaymentSuccess = async () => {
    try { await refreshUsage(); } catch {}
    navigate('/admin', { replace: true });
  };

  // ── Plan not found ─────────────────────────────────────

  if (!plan) {
    return (
      <div className="ob">
        <div className="ob-bg" />
        <div className="ob-card" style={{ textAlign: 'center' }}>
          <div className="ob-lost-icon">?</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem' }}>Plano nao encontrado</h2>
          <p style={{ color: 'var(--ob-muted)', marginBottom: 24 }}>Escolha um plano valido na nossa pagina inicial.</p>
          <Link to="/" className="ob-btn">Voltar para Home</Link>
        </div>
      </div>
    );
  }

  const price = plan.price[cycle];

  return (
    <div className="ob">
      <Helmet>
        <title>Assinar {plan.name} - Whodo</title>
        <meta name="description" content={`Crie sua conta e assine o plano ${plan.name} do Whodo.`} />
      </Helmet>

      <div className="ob-bg" />
      <div className="ob-noise" />

      {/* Top bar */}
      <div className="ob-topbar">
        <Link to="/" className="ob-logo">W</Link>
      </div>

      <div className="ob-card">
        {/* Plan pill */}
        <div className="ob-plan-pill">
          <span className="ob-plan-name">
            {plan.popular && <span className="ob-popular-dot" />}
            {plan.name}
          </span>
          <div className="ob-cycle-toggle">
            <button
              type="button"
              className={cycle === 'monthly' ? 'active' : ''}
              onClick={() => setCycle('monthly')}
            >
              Mensal
            </button>
            <button
              type="button"
              className={cycle === 'yearly' ? 'active' : ''}
              onClick={() => setCycle('yearly')}
            >
              Anual
              <span className="ob-save-tag">-20%</span>
            </button>
          </div>
          <span className="ob-plan-price">
            R${price}<small>/{cycle === 'monthly' ? 'mes' : 'mes'}</small>
          </span>
        </div>

        {/* Step indicator */}
        <div className="ob-steps">
          {STEPS.map((s, i) => (
            <div key={s.num} className="ob-step-item">
              {i > 0 && <div className={`ob-step-line ${step > s.num - 1 ? 'done' : ''}`} />}
              <div className={`ob-step-circle ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>
                {step > s.num ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : s.num}
              </div>
              <span className={`ob-step-label ${step === s.num ? 'active' : ''} ${step > s.num ? 'done' : ''}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="ob-body">
          {/* ── STEP 1: Account ────────────────────────── */}
          {step === 1 && (
            <div className={`ob-step-content ${direction === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
              <div className="ob-step-header">
                <h2>Crie sua conta</h2>
                <p>Rapido e sem burocracia. Menos de 1 minuto.</p>
              </div>

              <form onSubmit={handleCreateAccount} className="ob-form">
                <div className="ob-field">
                  <label htmlFor="ob-name">Nome completo</label>
                  <input id="ob-name" type="text" placeholder="Como voce se chama?" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" autoFocus />
                </div>

                <div className="ob-field">
                  <label htmlFor="ob-email">Email</label>
                  <input id="ob-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>

                <div className="ob-field">
                  <label htmlFor="ob-pass">Senha</label>
                  <input id="ob-pass" type="password" placeholder="Minimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                </div>

                {error && <div className="ob-error">{error}</div>}

                <button type="submit" className="ob-btn" disabled={loading || !name.trim() || !email.trim() || !password}>
                  {loading ? <><span className="ob-spinner" /> Criando...</> : 'Criar conta'}
                  {!loading && <span className="ob-btn-arrow">&rarr;</span>}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 2: Company ────────────────────────── */}
          {step === 2 && (
            <div className={`ob-step-content ${direction === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
              <div className="ob-step-header">
                <div className="ob-step-success-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Conta criada
                </div>
                <h2>Sua empresa</h2>
                <p>Como se chama o seu negocio?</p>
              </div>

              <form onSubmit={handleCreateCompany} className="ob-form">
                <div className="ob-field">
                  <label htmlFor="ob-org">Nome da empresa</label>
                  <input id="ob-org" type="text" placeholder="Ex: Minha Agencia Digital" value={orgName} onChange={e => setOrgName(e.target.value)} required autoFocus />
                </div>

                <div className="ob-field">
                  <label htmlFor="ob-cpf">CPF ou CNPJ</label>
                  <input
                    id="ob-cpf"
                    type="text"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={e => {
                      const d = e.target.value.replace(/\D/g, '');
                      if (d.length > 14) return;
                      setCpfCnpj(formatCpfCnpj(e.target.value));
                      cpfRaw.current = d;
                    }}
                  />
                  <span className="ob-field-hint">Necessario para emitir cobran&ccedil;as</span>
                </div>

                {error && <div className="ob-error">{error}</div>}

                <button type="submit" className="ob-btn" disabled={loading || !orgName.trim()}>
                  {loading ? <><span className="ob-spinner" /> Criando...</> : 'Continuar'}
                  {!loading && <span className="ob-btn-arrow">&rarr;</span>}
                </button>
              </form>
            </div>
          )}

          {/* ── STEP 3: Payment ────────────────────────── */}
          {step === 3 && (
            <div className={`ob-step-content ${direction === 'forward' ? 'slide-in' : 'slide-in-back'}`}>
              <div className="ob-step-header">
                <div className="ob-step-success-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Empresa criada
                </div>
                <h2>Pagamento</h2>
                <p>Escolha como prefere pagar. Cancele quando quiser.</p>
              </div>

              <PaymentForm
                planId={planId}
                billingCycle={cycle}
                cpfCnpj={cpfRaw.current}
                userEmail={email}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>

        {/* Trust bar */}
        <div className="ob-trust">
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Dados seguros
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Sem fidelidade
          </span>
          <span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Cancele quando quiser
          </span>
        </div>
      </div>
    </div>
  );
}
