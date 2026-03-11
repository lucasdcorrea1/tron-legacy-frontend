import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../context/OrgContext';
import { instagram } from '../services/api';
import './OrgSwitcher.css';

export default function OrgSwitcher({ onClose }) {
  const { currentOrg, orgs, switchOrg, loading } = useOrg();
  const [open, setOpen] = useState(false);
  const [igMap, setIgMap] = useState({});
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Load IG profiles for all orgs → build orgId→username map
  useEffect(() => {
    instagram.listAllOrgProfiles()
      .then(data => {
        const profiles = data?.profiles || [];
        const map = {};
        for (const p of profiles) {
          if (p.org_id && p.username) map[p.org_id] = `@${p.username}`;
        }
        setIgMap(map);
      })
      .catch(() => {});
  }, []);

  const handleSwitch = async (orgId) => {
    if (orgId === currentOrg?.id) {
      setOpen(false);
      return;
    }
    await switchOrg(orgId);
    setOpen(false);
    onClose?.();
  };

  const handleCreateNew = () => {
    setOpen(false);
    onClose?.();
    navigate('/onboarding');
  };

  const getInitial = (name) => (name || '?')[0].toUpperCase();

  return (
    <div className="org-switcher" ref={ref}>
      <button
        className="org-switcher-trigger"
        onClick={() => setOpen(!open)}
        disabled={loading}
      >
        <span className="org-avatar">{getInitial(currentOrg?.name)}</span>
        <div className="org-info">
          <span className="org-name">{currentOrg?.name || 'Selecionar empresa'}</span>
          {igMap[currentOrg?.id]
            ? <span className="org-ig-handle">{igMap[currentOrg.id]}</span>
            : <span className="org-plan">{currentOrg?.my_role || ''}</span>
          }
        </div>
        <svg className={`org-chevron ${open ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="org-dropdown">
          <div className="org-dropdown-label">Suas empresas</div>
          {orgs.map((org) => (
            <button
              key={org.id}
              className={`org-dropdown-item ${org.id === currentOrg?.id ? 'active' : ''}`}
              onClick={() => handleSwitch(org.id)}
            >
              <span className="org-avatar-sm">{getInitial(org.name)}</span>
              <div className="org-dropdown-info">
                <span className="org-dropdown-name">{org.name}</span>
                {igMap[org.id]
                  ? <span className="org-dropdown-ig">{igMap[org.id]}</span>
                  : <span className="org-dropdown-role">{org.my_role}</span>
                }
              </div>
              {org.id === currentOrg?.id && (
                <svg className="org-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          ))}
          <div className="org-dropdown-divider" />
          <button className="org-dropdown-item org-create" onClick={handleCreateNew}>
            <span className="org-avatar-sm org-plus">+</span>
            <span className="org-dropdown-name">Criar nova empresa</span>
          </button>
        </div>
      )}
    </div>
  );
}
