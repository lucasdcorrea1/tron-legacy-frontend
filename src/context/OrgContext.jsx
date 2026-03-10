import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { orgs, subscription as subscriptionApi } from '../services/api';
import { useAuth } from './AuthContext';

const OrgContext = createContext(null);

// Feature → minimum plan mapping
const FEATURE_PLAN_MAP = {
  blog: 'free',
  posts: 'free',
  instagram: 'starter',
  meta_ads: 'starter',
  auto_boost: 'starter',
  cta_analytics: 'starter',
  email_marketing: 'pro',
};

const PLAN_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };

export function OrgProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [orgList, setOrgList] = useState([]);
  const [sub, setSub] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  // Load org list and restore last used org
  const init = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentOrg(null);
      setOrgList([]);
      setSub(null);
      setUsage(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await orgs.list();
      const list = res.organizations || [];
      setOrgList(list);

      if (list.length === 0) {
        setLoading(false);
        return;
      }

      // Try to restore last used org
      const lastOrgId = localStorage.getItem('lastOrgId');
      const target = list.find(o => o.id === lastOrgId) || list[0];

      await orgs.switch(target.id);
      localStorage.setItem('lastOrgId', target.id);

      // Load current org details + subscription
      const [orgData, subData, usageData] = await Promise.all([
        orgs.getCurrent(),
        subscriptionApi.get().catch(() => null),
        subscriptionApi.getUsage().catch(() => null),
      ]);

      setCurrentOrg(orgData);
      setSub(subData);
      setUsage(usageData);
    } catch {
      // If org loading fails, reset state
      setCurrentOrg(null);
      setSub(null);
      setUsage(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    init();
  }, [init]);

  const switchOrg = useCallback(async (orgId) => {
    try {
      setLoading(true);
      await orgs.switch(orgId);
      localStorage.setItem('lastOrgId', orgId);

      const [orgData, subData, usageData] = await Promise.all([
        orgs.getCurrent(),
        subscriptionApi.get().catch(() => null),
        subscriptionApi.getUsage().catch(() => null),
      ]);

      setCurrentOrg(orgData);
      setSub(subData);
      setUsage(usageData);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshOrg = useCallback(async () => {
    if (!currentOrg) return;
    try {
      const [orgData, listData] = await Promise.all([
        orgs.getCurrent(),
        orgs.list(),
      ]);
      setCurrentOrg(orgData);
      setOrgList(listData.organizations || []);
    } catch { /* ignore */ }
  }, [currentOrg]);

  const refreshUsage = useCallback(async () => {
    try {
      const [subData, usageData] = await Promise.all([
        subscriptionApi.get().catch(() => null),
        subscriptionApi.getUsage().catch(() => null),
      ]);
      setSub(subData);
      setUsage(usageData);
    } catch { /* ignore */ }
  }, []);

  const canUse = useCallback((feature) => {
    const minPlan = FEATURE_PLAN_MAP[feature];
    if (!minPlan) return true; // Unknown features are allowed
    const currentPlan = sub?.plan_id || 'free';
    return (PLAN_RANK[currentPlan] ?? 0) >= (PLAN_RANK[minPlan] ?? 0);
  }, [sub]);

  const isAtLimit = useCallback((resource) => {
    if (!usage) return false;
    const limit = usage.limits?.[`max_${resource}`];
    if (limit === -1) return false; // unlimited
    const current = usage.usage?.[resource];
    return current >= limit;
  }, [usage]);

  const hasOrgRole = useCallback((...roles) => {
    if (!currentOrg?.my_role) return false;
    return roles.flat().includes(currentOrg.my_role);
  }, [currentOrg]);

  const hasPermission = useCallback((perm) => {
    if (!currentOrg?.my_role) return false;
    // Owner and admin always have all permissions
    if (currentOrg.my_role === 'owner' || currentOrg.my_role === 'admin') return true;
    // Viewer never has permissions
    if (currentOrg.my_role === 'viewer') return false;
    // Member: check explicit permissions
    return (currentOrg.my_permissions || []).includes(perm);
  }, [currentOrg]);

  // Rerun init when authentication changes (login/logout)
  const prevAuth = useRef(isAuthenticated);
  useEffect(() => {
    if (prevAuth.current !== isAuthenticated) {
      prevAuth.current = isAuthenticated;
      initRef.current = false;
      init();
    }
  }, [isAuthenticated, init]);

  return (
    <OrgContext.Provider value={{
      currentOrg,
      orgs: orgList,
      subscription: sub,
      usage,
      loading,
      switchOrg,
      refreshOrg,
      refreshUsage,
      canUse,
      isAtLimit,
      hasOrgRole,
      hasPermission,
      setOrgList,
      setCurrentOrg,
      setSub,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within OrgProvider');
  }
  return context;
};
