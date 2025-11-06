# Cursor Implementation Guidelines – Plataforma Pegasus

> Estas diretrizes padronizam o desenvolvimento dentro do Cursor, garantindo consistência, performance e segurança em todo o ciclo de vida da Plataforma Pegasus.

---

## 🏗️ Estrutura do Projeto

### Padrão de Módulos
- Cada **Capability** definida no PRD corresponde a uma pasta dentro de `src/`.
- Cada **Feature** dentro dessa capability é implementada como um arquivo isolado (`feature.tsx` ou `feature.ts`).
- Cada módulo deve conter um `index.ts` que exporta apenas a interface pública.

**Exemplo:**
```
src/events/
├── createEvent.ts
├── getEvents.ts
├── updateEvent.ts
└── index.ts
```

### Convenções Gerais
- **Nomeação:** camelCase para funções, PascalCase para componentes React, kebab-case para arquivos.
- **Imports absolutos:** usar `@/` apontando para `/src/`.
- **Commit semântico:** `feat:`, `fix:`, `chore:`, `test:`.

---

## ⚛️ Next.js + React 19

- Utilizar **App Router** (`app/`), **Server Actions**, e **React Suspense** para otimizar SSR e streaming.
- Usar **async components** apenas quando necessário (para dados dinâmicos).
- Priorizar **componentes server-side** para performance.
- **Layouts:** definidos por tenant (tema, logo, cor primária).
- **SEO:** cada rota deve ter `generateMetadata()` com título, descrição e OpenGraph (seguir `seo.mdc`).

---

## 🎨 Tailwind v4 + Shadcn UI

- **Tokens centralizados** em `src/ui/theme.ts` (cores, tipografia, espaçamento).
- Não sobrescrever componentes Shadcn diretamente — criar variantes via `class-variance-authority`.
- Seguir as heurísticas de `nielsen-heuristics.mdc` para UX (consistência, feedback, prevenção de erros).
- Layouts responsivos devem usar grid e flex combinados, evitando media queries manuais.
- Garantir contraste AA mínimo.

---

## 🧠 Zustand + TanStack Query

### Zustand
- Criar um store por domínio (`useAuthStore`, `useEventStore`, `useRankingStore`).
- **Persistência:**
  - `sessionStorage` → Sessões e tokens (ex: Auth).
  - `localStorage` → Preferências (tema, idioma).
- Utilizar `devtools()` apenas em modo dev.
- Evitar dependências cíclicas entre stores.

### TanStack Query
- Query keys devem sempre incluir `tenantId`.
- Configurar `staleTime` ≥ 1 minuto e `refetchOnWindowFocus: false`.
- Usar **optimistic updates** para UX fluida.
- Queries globais (auth, user) devem ser cacheadas via `useQueryClient().setQueryData()`.

---

## 🗄️ Prisma + PostgreSQL

- Multi-tenant via coluna `tenantId` em todas as tabelas principais.
- `schema.prisma` deve conter `@@index([tenantId])` para todas as entidades.
- Migrations geradas com `npx prisma migrate dev` (sem alterações diretas).
- Seed inicial (`prisma/seed.ts`) deve criar tenant demo + usuários de teste.
- Evitar `include` aninhado; usar `select` para controle de performance.

---

## 🔐 Auth.js (NextAuth)

- Provedores: Google, Microsoft (OAuth 2.0).
- Persistência via Prisma Adapter.
- JWT assinado com `HS256` e rotacionado automaticamente.
- Sessões com expiração de 12h e refresh a cada 1h.
- Expor hook `useAuth()` que integra Zustand + NextAuth session.

---

## 💳 Stripe / LemonSqueezy Billing

- Cada tenant possui subscription independente.
- Webhooks tratados em `/api/billing/webhook` (resiliência via retry 3x).
- Guardar status em `billing_subscriptions` (active, canceled, trialing).
- Trial de 7 dias → auto downgrade para plano Free.
- Fallback manual em caso de falha API (flag `manual_payment`).

---

## 🧩 Observabilidade

### Sentry
- Capturar erros com escopo de tenant (`Sentry.setTag('tenantId', tenantId)`).
- Usar `beforeSend` para mascarar dados sensíveis.

### Loki + Grafana
- Logs estruturados (JSON) com `level`, `tenantId`, `context`, `message`.
- Dashboards por tenant configurados via tags.

---

## 🚀 Performance Guidelines

Baseado em `performance.mdc`:
- Ativar `React.useMemo` e `React.useCallback` em listas e handlers.
- Lazy-load em módulos não críticos (ex: gráficos, uploads).
- Cache estático em páginas públicas (`revalidate: 60`).
- Evitar `any` → preferir tipagem estática via TypeScript 5.x.
- Otimizar imagens com `<Image />` (Next.js) e compressão WebP/AVIF.

---

## 🧪 Testes

- Frameworks: **Vitest** (unit), **Testing Library** (integration), **Playwright** (E2E).
- **Cobertura mínima:** 80 % linhas, 70 % branches.
- **Estrutura:**
  ```
  tests/
  ├── unit/
  ├── integration/
  └── e2e/
  ```
- **Casos críticos:**
  - Login SSO multi-tenant.
  - Geração de chave de torneio.
  - Ranking e badges.
  - Fluxo de pagamento.

---

## 🧰 Segurança (security.mdc)

- Sanitizar inputs (Zod + escape-html).
- Variáveis de ambiente segregadas (.env.local, .env.prod).
- Tokens sempre armazenados em memória ou sessionStorage.
- Política de CORS restritiva (`allowedOrigins` por tenant).
- Headers de segurança via Next Middleware (CSP, X-Frame-Options).

---

## 🧭 Integração Cursor + Task-Master

- Cada fase do PRD (0–4) corresponde a um **branch temático** (`phase-0-foundation`, `phase-1-auth`, etc.).
- O Cursor deve abrir o PRD em paralelo para seguir o **dependency graph** topológico.
- A cada conclusão de módulo:
  1. Rodar `task-master validate-phase`.
  2. Executar testes automáticos.
  3. Comentar no PR o hash do commit finalizado.

---

## 🧩 Checklists de Revisão

**Antes do Commit:**
- [ ] Tipagem 100 % TypeScript.
- [ ] Validação Zod em payloads de API.
- [ ] Uso correto de hooks Zustand/TanStack.
- [ ] Componentes Shadcn sem CSS custom excessivo.
- [ ] Logs com contexto de tenant.

**Antes do Deploy:**
- [ ] Ambiente `.env` validado.
- [ ] Build otimizado (`next build` sem warnings).
- [ ] Testes 100 % passando.
- [ ] Sentry DSN configurado.
- [ ] Billing sandbox validado.

---

## 📚 Referências
- Next.js 15 Docs
- Prisma ORM Docs
- Zustand & TanStack Query Patterns
- Tailwind v4 & Shadcn UI Guide
- Stripe & LemonSqueezy API Docs
- Sentry, Loki, Grafana Docs
- Nielsen Heuristics & UX Best Practices
