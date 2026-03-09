import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orgs } from '../services/api';
import { useOrg } from '../context/OrgContext';
import './Onboarding.css';

export default function Onboarding() {
  const navigate = useNavigate();
  const { setCurrentOrg, setOrgList, setSub, switchOrg } = useOrg();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError('Digite o nome da empresa');

    setLoading(true);
    setError('');

    try {
      const created = await orgs.create({ name: name.trim() });
      const orgId = created.id || created.organization?.id;

      // Switch to the new org to get a JWT with org_id
      await switchOrg(orgId);

      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Erro ao criar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1>Crie sua empresa</h1>
        <p className="onboarding-subtitle">
          Para começar a usar a plataforma, crie sua primeira empresa.
        </p>

        <form onSubmit={handleSubmit} className="onboarding-form">
          <div className="form-group">
            <label htmlFor="orgName">Nome da empresa</label>
            <input
              id="orgName"
              type="text"
              placeholder="Ex: Minha Agência Digital"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              disabled={loading}
            />
          </div>

          {error && <div className="onboarding-error">{error}</div>}

          <button type="submit" className="onboarding-button" disabled={loading || !name.trim()}>
            {loading ? 'Criando...' : 'Criar empresa e começar'}
          </button>
        </form>

        <p className="onboarding-hint">
          Você poderá convidar membros e personalizar depois.
        </p>
      </div>
    </div>
  );
}
