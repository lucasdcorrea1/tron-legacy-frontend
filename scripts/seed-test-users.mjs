/**
 * Seed: users + empresas + membros com roles variados.
 *
 * Usage:  node scripts/seed-test-users.mjs
 *         node scripts/seed-test-users.mjs --api http://localhost:8088
 */

const API_URL = process.argv.includes('--api')
  ? process.argv[process.argv.indexOf('--api') + 1]
  : 'http://localhost:8088';

const PASSWORD = 'teste123';

// ── Users ──────────────────────────────────────────────────────────
const testUsers = [
  { name: 'Ana Silva',          email: 'ana@teste.com' },
  { name: 'Bruno Costa',        email: 'bruno@teste.com' },
  { name: 'Carla Mendes',       email: 'carla@teste.com' },
  { name: 'Diego Oliveira',     email: 'diego@teste.com' },
  { name: 'Elena Ferreira',     email: 'elena@teste.com' },
  { name: 'Felipe Santos',      email: 'felipe@teste.com' },
  { name: 'Gabriela Lima',      email: 'gabriela@teste.com' },
  { name: 'Hugo Martins',       email: 'hugo@teste.com' },
  { name: 'Isabela Rocha',      email: 'isabela@teste.com' },
  { name: 'João Almeida',       email: 'joao@teste.com' },
  { name: 'Karina Barbosa',     email: 'karina@teste.com' },
  { name: 'Leonardo Souza',     email: 'leonardo@teste.com' },
  { name: 'Marina Cardoso',     email: 'marina@teste.com' },
  { name: 'Nathan Pereira',     email: 'nathan@teste.com' },
  { name: 'Olivia Nascimento',  email: 'olivia@teste.com' },
];

// ── Empresas + membros ─────────────────────────────────────────────
// O primeiro email de cada empresa é o owner (quem cria).
// Os outros são convidados com a role indicada.
const companies = [
  {
    name: 'Agência Digital Flow',
    owner: 'ana@teste.com',
    members: [
      { email: 'bruno@teste.com',    role: 'admin' },
      { email: 'carla@teste.com',    role: 'member' },
      { email: 'diego@teste.com',    role: 'viewer' },
    ],
  },
  {
    name: 'Studio Criativo Pixel',
    owner: 'felipe@teste.com',
    members: [
      { email: 'gabriela@teste.com', role: 'admin' },
      { email: 'hugo@teste.com',     role: 'member' },
      { email: 'ana@teste.com',      role: 'member' },
    ],
  },
  {
    name: 'Marketing Pro BR',
    owner: 'isabela@teste.com',
    members: [
      { email: 'joao@teste.com',     role: 'admin' },
      { email: 'karina@teste.com',   role: 'member' },
      { email: 'leonardo@teste.com', role: 'member' },
      { email: 'bruno@teste.com',    role: 'viewer' },
    ],
  },
  {
    name: 'TechStart Soluções',
    owner: 'marina@teste.com',
    members: [
      { email: 'nathan@teste.com',   role: 'admin' },
      { email: 'olivia@teste.com',   role: 'member' },
      { email: 'felipe@teste.com',   role: 'viewer' },
      { email: 'carla@teste.com',    role: 'admin' },
    ],
  },
  {
    name: 'Conecta Social Media',
    owner: 'elena@teste.com',
    members: [
      { email: 'diego@teste.com',    role: 'admin' },
      { email: 'hugo@teste.com',     role: 'member' },
      { email: 'joao@teste.com',     role: 'viewer' },
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────
const tokens = {}; // email → jwt

async function api(endpoint, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }
  return { ok: res.ok, status: res.status, data };
}

async function registerUser(user) {
  const { ok, status, data } = await api('/api/v1/auth/register', {
    method: 'POST',
    body: { name: user.name, email: user.email, password: PASSWORD },
  });
  if (ok) {
    tokens[user.email] = data.token;
    console.log(`  [+] ${user.name} (${user.email})`);
    return true;
  }
  if (status === 409) {
    // Already exists, login to get token
    const login = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email: user.email, password: PASSWORD },
    });
    if (login.ok) {
      tokens[user.email] = login.data.token;
      console.log(`  [=] ${user.name} (${user.email}) já existe`);
      return true;
    }
    console.log(`  [!] ${user.email} existe mas não conseguiu login`);
    return false;
  }
  console.log(`  [x] ${user.email} → ${data.message || status}`);
  return false;
}

async function createCompany(company) {
  const ownerToken = tokens[company.owner];
  if (!ownerToken) {
    console.log(`  [x] ${company.name} → owner ${company.owner} sem token`);
    return;
  }

  // Try to create org, or find existing
  const { ok, status, data } = await api('/api/v1/orgs', {
    method: 'POST',
    body: { name: company.name },
    token: ownerToken,
  });

  let orgId;
  if (ok) {
    orgId = data.id;
    console.log(`  [+] ${company.name} (owner: ${company.owner})`);
  } else if (status === 409) {
    // Company exists, find it in owner's org list
    const ownerOrgs = await api('/api/v1/orgs', { token: ownerToken });
    const existing = (ownerOrgs.data?.organizations || []).find(o => o.name === company.name);
    if (existing) {
      orgId = existing.id;
      console.log(`  [=] ${company.name} já existe, adicionando membros...`);
    } else {
      console.log(`  [=] ${company.name} já existe mas owner não é membro, pulando...`);
      return;
    }
  } else {
    console.log(`  [x] ${company.name} → ${data.message || status}`);
    return;
  }

  // Switch owner to new org
  const sw = await api(`/api/v1/orgs/switch/${orgId}`, {
    method: 'POST',
    token: ownerToken,
  });
  if (!sw.ok) {
    console.log(`      [x] switch falhou para ${company.name}`);
    return;
  }
  const orgToken = sw.data.token;

  // Invite members
  for (const m of company.members) {
    const inv = await api('/api/v1/orgs/current/invitations', {
      method: 'POST',
      body: { email: m.email, org_role: m.role },
      token: orgToken,
    });
    if (inv.ok) {
      console.log(`      [+] convidou ${m.email} como ${m.role}`);

      // Auto-accept invitation
      const invToken = inv.data.token;
      const memberJwt = tokens[m.email];
      if (memberJwt && invToken) {
        const accept = await api(`/api/v1/invitations/${invToken}/accept`, {
          method: 'POST',
          token: memberJwt,
        });
        if (accept.ok) {
          console.log(`      [v] ${m.email} aceitou o convite`);
        } else {
          console.log(`      [!] ${m.email} não aceitou → ${accept.data.message || accept.status}`);
        }
      }
    } else {
      console.log(`      [!] convite ${m.email} → ${inv.data.message || inv.status}`);
    }
  }
}

// Upgrade an org's plan via platform API (needs superuser token)
async function upgradePlan(orgId, planId, suToken) {
  const { ok } = await api(`/api/v1/platform/orgs/${orgId}/plan`, {
    method: 'PUT',
    body: { plan_id: planId },
    token: suToken,
  });
  return ok;
}

// ── Main ────────────────────────────────────────────────────────────
console.log(`\n=== Seed de teste em ${API_URL} ===\n`);

// Step 0: Get superuser token (login with your main account)
const SU_EMAIL = process.env.SU_EMAIL || 'lucasdamascorrea@gmail.com';
const SU_PASS  = process.env.SU_PASS  || '123456';

console.log('0. Login superuser...\n');
const suLogin = await api('/api/v1/auth/login', {
  method: 'POST',
  body: { email: SU_EMAIL, password: SU_PASS },
});
let suToken = null;
if (suLogin.ok) {
  suToken = suLogin.data.token;
  console.log(`  [v] logado como ${SU_EMAIL}\n`);
} else {
  console.log(`  [!] não conseguiu logar superuser (${SU_EMAIL}), upgrades de plano serão pulados\n`);
}

console.log('1. Criando usuários...\n');
for (const u of testUsers) {
  await registerUser(u);
}

console.log('\n2. Criando empresas e vinculando membros...\n');
for (const c of companies) {
  await createCompany(c);
  console.log('');
}

// Step 3: Upgrade all test companies to "pro" so members fit
if (suToken) {
  console.log('3. Upgrading empresas para plano Pro...\n');
  const orgsRes = await api('/api/v1/platform/orgs-with-members', { token: suToken });
  if (orgsRes.ok) {
    const testOrgNames = companies.map(c => c.name);
    for (const org of orgsRes.data.organizations || []) {
      if (testOrgNames.includes(org.name)) {
        const ok = await upgradePlan(org.id, 'pro', suToken);
        console.log(`  ${ok ? '[v]' : '[x]'} ${org.name} → pro`);
      }
    }
  }

  // Step 4: Now re-invite members that failed due to plan limit
  console.log('\n4. Re-enviando convites...\n');
  for (const c of companies) {
    const ownerToken = tokens[c.owner];
    if (!ownerToken) continue;

    // List owner's orgs to find the right one
    const ownerOrgs = await api('/api/v1/orgs', { token: ownerToken });
    if (!ownerOrgs.ok) continue;

    const org = (ownerOrgs.data.organizations || []).find(o => o.name === c.name);
    if (!org) continue;

    // Switch to this org
    const sw = await api(`/api/v1/orgs/switch/${org.id}`, { method: 'POST', token: ownerToken });
    if (!sw.ok) continue;
    const orgToken = sw.data.token;

    for (const m of c.members) {
      const inv = await api('/api/v1/orgs/current/invitations', {
        method: 'POST',
        body: { email: m.email, org_role: m.role },
        token: orgToken,
      });
      if (inv.ok) {
        const memberJwt = tokens[m.email];
        if (memberJwt && inv.data.token) {
          const accept = await api(`/api/v1/invitations/${inv.data.token}/accept`, {
            method: 'POST',
            token: memberJwt,
          });
          if (accept.ok) {
            console.log(`  [v] ${c.name}: ${m.email} → ${m.role}`);
          } else {
            console.log(`  [!] ${c.name}: ${m.email} não aceitou → ${accept.data.message}`);
          }
        }
      } else if (inv.status === 409) {
        console.log(`  [=] ${c.name}: ${m.email} já é membro`);
      } else {
        console.log(`  [!] ${c.name}: ${m.email} → ${inv.data.message || inv.status}`);
      }
    }
  }
}

console.log('\n=== Pronto! ===');
console.log(`Senha de todos: ${PASSWORD}`);
console.log(`${testUsers.length} users, ${companies.length} empresas\n`);
