import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { orgs, subscription as subscriptionApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';

const OrgContext = createContext(null);

// ── Color utilities for brand color derivation ──
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null;
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function shiftColor(hex, amount) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const r = clamp(rgb.r + amount);
  const g = clamp(rgb.g + amount);
  const b = clamp(rgb.b + amount);
  return `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`;
}

// Feature → minimum plan mapping
const FEATURE_PLAN_MAP = {
  blog: 'free',
  posts: 'free',
  instagram: 'starter',
  meta_ads: 'starter',
  auto_boost: 'starter',
  cta_analytics: 'starter',
  email_marketing: 'pro',
  contabil: 'starter',
};

const PLAN_RANK = { free: 0, starter: 1, pro: 2, enterprise: 3 };

export function OrgProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
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
    // Treat non-active subscriptions as free (canceled, past_due, pending)
    const isActive = sub?.status === 'active';
    const currentPlan = isActive ? (sub?.plan_id || 'free') : 'free';
    return (PLAN_RANK[currentPlan] ?? 0) >= (PLAN_RANK[minPlan] ?? 0);
  }, [sub]);

  const isAtLimit = useCallback((resource) => {
    if (!usage) return false;
    // Non-active subscriptions use free plan limits
    const isActive = sub?.status === 'active';
    if (!isActive) return true; // block everything if not active
    const limit = usage.limits?.[`max_${resource}`];
    if (limit === -1) return false; // unlimited
    const current = usage.usage?.[resource];
    return current >= limit;
  }, [usage, sub]);

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

  // ── Apply org brand colors as CSS custom-property overrides ──
  useEffect(() => {
    const brand = theme === 'light'
      ? currentOrg?.settings?.brand_colors_light
      : currentOrg?.settings?.brand_colors_dark;
    let styleEl = document.getElementById('org-brand-colors');

    const hasAny = brand && Object.values(brand).some(v => v);
    if (!hasAny) {
      if (styleEl) styleEl.remove();
      return;
    }

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'org-brand-colors';
      document.head.appendChild(styleEl);
    }

    const vars = [];

    // Accent / primary
    if (brand.primary_color) {
      const p = brand.primary_color;
      const rgb = hexToRgb(p);
      if (rgb) {
        vars.push(`--admin-accent: ${p}`);
        vars.push(`--admin-accent-hover: ${shiftColor(p, -15)}`);
        vars.push(`--admin-accent-subtle: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)`);
        vars.push(`--admin-accent-text: ${shiftColor(p, 30)}`);
        vars.push(`--admin-accent-glow: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`);
        vars.push(`--admin-input-focus: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`);
        vars.push(`--admin-badge-bg: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`);
        vars.push(`--admin-badge-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);
        vars.push(`--admin-badge-text: ${shiftColor(p, 20)}`);
        vars.push(`--admin-nav-active-icon: ${shiftColor(p, 30)}`);
        vars.push(`--admin-nav-active-bar: linear-gradient(180deg, ${shiftColor(p, 20)} 0%, ${p} 100%)`);
      }
    }

    // Sidebar
    if (brand.sidebar_start || brand.sidebar_end) {
      const start = brand.sidebar_start || brand.sidebar_end;
      const end = brand.sidebar_end || brand.sidebar_start;
      vars.push(`--admin-sidebar-bg: linear-gradient(180deg, ${start} 0%, ${end} 100%)`);
      const rgb = hexToRgb(start);
      if (rgb) {
        vars.push(`--admin-sidebar-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`);
      }
    }

    // Backgrounds
    if (brand.bg_color) {
      vars.push(`--admin-bg: ${brand.bg_color}`);
      vars.push(`--admin-topbar-bg: ${brand.bg_color}e8`);
    }
    if (brand.bg_elevated) {
      vars.push(`--admin-bg-elevated: ${brand.bg_elevated}`);
      vars.push(`--admin-card-bg: ${brand.bg_elevated}`);
      vars.push(`--admin-input-bg: ${brand.bg_elevated}`);
      vars.push(`--admin-dropdown-bg: ${brand.bg_elevated}`);
    }

    // Text
    if (brand.text_color) {
      vars.push(`--admin-text: ${brand.text_color}`);
      const rgb = hexToRgb(brand.text_color);
      if (rgb) {
        vars.push(`--admin-text-secondary: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.7)`);
        vars.push(`--admin-text-muted: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.45)`);
      }
    }
    if (brand.text_heading) {
      vars.push(`--admin-text-heading: ${brand.text_heading}`);
    }

    // Status colors
    if (brand.success_color) {
      vars.push(`--admin-success: ${brand.success_color}`);
    }
    if (brand.danger_color) {
      vars.push(`--admin-danger: ${brand.danger_color}`);
      const rgb = hexToRgb(brand.danger_color);
      if (rgb) {
        vars.push(`--admin-danger-hover: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1)`);
        vars.push(`--admin-danger-border: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`);
        vars.push(`--admin-danger-text: ${shiftColor(brand.danger_color, 20)}`);
      }
    }
    if (brand.warning_color) {
      vars.push(`--admin-warning: ${brand.warning_color}`);
    }

    styleEl.textContent = `[data-admin-theme] .admin-layout { ${vars.join('; ')} }`;

    return () => {
      const el = document.getElementById('org-brand-colors');
      if (el) el.remove();
    };
  }, [currentOrg, theme]);

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
