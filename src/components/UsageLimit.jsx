import { useOrg } from '../context/OrgContext';

export default function UsageLimit({ resource, onLimit, children }) {
  const { isAtLimit } = useOrg();

  if (isAtLimit(resource)) {
    return onLimit || (
      <div style={{
        padding: '0.75rem 1rem',
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        borderRadius: '8px',
        color: '#f59e0b',
        fontSize: '0.8125rem',
        textAlign: 'center',
      }}>
        Limite atingido. Faça upgrade para continuar.
      </div>
    );
  }

  return children;
}
