import { useOrg } from '../context/OrgContext';
import UpgradeBanner from './UpgradeBanner';

export default function FeatureGate({ feature, fallback, children }) {
  const { canUse } = useOrg();

  if (!canUse(feature)) {
    return fallback || <UpgradeBanner feature={feature} />;
  }

  return children;
}
