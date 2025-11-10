# Arquitetura de Middleware/Proxy

## 📁 Estrutura de Arquivos

```
pegasus-platform/
├── proxy.ts                          # Entry point (raiz) - re-exporta de src/
└── src/
    ├── proxy.ts                      # Proxy principal - orquestra tudo
    └── lib/
        └── middleware/
            ├── index.ts              # Barrel export
            ├── auth.ts               # Módulo de autenticação
            └── routing.ts            # Módulo de roteamento
```

## 🎯 Separação de Responsabilidades

### **1. `src/lib/middleware/auth.ts`** - Autenticação

**Responsabilidades:**

- ✅ Verificação de sessão (`getSession`)
- ✅ Validação de rotas públicas (`isPublicRoute`)
- ✅ Sincronização de cookies básicos (`syncUserCookies`, `syncEssentialCookies`)
- ✅ Limpeza de cookies (`clearAuthCookies`)
- ✅ Processamento de autenticação (`processAuthentication`)
- ✅ Tratamento de usuários não autenticados (`handleUnauthenticated`)

**Funções Principais:**

```typescript
- isPublicRoute(pathname: string): boolean
- getSession(request: NextRequest)
- clearAuthCookies(response: NextResponse): void
- syncUserCookies(response, user): void
- syncEssentialCookies(response, user): void
- processAuthentication(request): Promise<AuthResult>
- handleUnauthenticated(request, pathname, response): NextResponse | null
```

---

### **2. `src/lib/middleware/routing.ts`** - Roteamento

**Responsabilidades:**

- ✅ Busca de dados do banco (`fetchUserData`, `createRoutingContext`)
- ✅ Cálculo de status de bloqueio (`calculateBlockStatus`)
- ✅ Cálculo de needsOnboarding (`calculateNeedsOnboarding`)
- ✅ Verificação de tenant válido (`calculateValidTenant`)
- ✅ Sincronização de cookies do banco (`syncDatabaseCookies`)
- ✅ Utilitários de redirecionamento (`createRedirectResponse`, `copyCookies`)

**Funções Principais:**

```typescript
- fetchUserData(userId: string): Promise<{ dbUser, dbTenant, defaultTenant }>
- calculateBlockStatus(dbUser, dbTenant): { userPending, tenantPending, tenantInactive, shouldBlock }
- calculateNeedsOnboarding(dbUser, defaultTenant, shouldBlock): boolean
- calculateValidTenant(dbTenant, dbUser, defaultTenant): { hasValidTenant, isDefaultTenant, ... }
- createRoutingContext(userId): Promise<RoutingContext>
- syncDatabaseCookies(response, dbUser, needsOnboarding): void
- createRedirectResponse(url, request, sourceResponse): NextResponse
```

---

### **3. `src/proxy.ts`** - Orquestração

**Responsabilidades:**

- ✅ Orquestra autenticação e roteamento
- ✅ Aplica regras de negócio em ordem de prioridade
- ✅ Executa redirecionamentos condicionais
- ✅ Adiciona headers para APIs (x-tenant-id)

**Fluxo de Execução:**

1. Processa autenticação básica
2. Busca dados do banco e cria contexto de roteamento
3. Verifica bloqueios (PENDING/INACTIVE)
4. Verifica acesso a /onboarding
5. Redireciona para onboarding se necessário
6. Bloqueia dashboard se PENDING
7. Verifica tenantId
8. Adiciona headers para APIs

---

### **4. `proxy.ts` (raiz)** - Entry Point

**Responsabilidades:**

- ✅ Re-exporta o proxy de `src/proxy.ts`
- ✅ Garante compatibilidade com Next.js 16 que procura `proxy.ts` na raiz

---

## 🔄 Fluxo de Execução

```
Requisição HTTP
    ↓
proxy.ts (raiz) → re-exporta
    ↓
src/proxy.ts → orquestra
    ↓
┌─────────────────┬─────────────────┐
│                 │                 │
auth.ts          routing.ts
│                 │
├─ getSession    ├─ fetchUserData
├─ isPublicRoute ├─ calculateBlockStatus
├─ syncCookies   ├─ calculateNeedsOnboarding
└─ handleAuth    └─ createRedirectResponse
│                 │
└─────────────────┴─────────────────┘
    ↓
Aplicar regras de negócio
    ↓
Retornar NextResponse
```

---

## 📊 Interfaces e Tipos

### **AuthResult**

```typescript
interface AuthResult {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
  user: {
    id?: string;
    email?: string;
    name?: string | null;
    image?: string | null;
    tenantId?: string;
    role?: string;
    needsOnboarding?: boolean;
  } | null;
  isAuthenticated: boolean;
}
```

### **RoutingContext**

```typescript
interface RoutingContext {
  dbUser: DatabaseUser | null;
  dbTenant: DatabaseTenant | null;
  defaultTenant: { id: string } | null;
  userPending: boolean;
  tenantPending: boolean;
  tenantInactive: boolean;
  shouldBlock: boolean;
  needsOnboarding: boolean;
  hasValidTenant: boolean;
  isDefaultTenant: boolean;
}
```

---

## ✅ Benefícios da Separação

1. **Testabilidade**: Cada módulo pode ser testado independentemente
2. **Manutenibilidade**: Responsabilidades claras e separadas
3. **Reusabilidade**: Funções podem ser reutilizadas em outros contextos
4. **Legibilidade**: Código mais limpo e fácil de entender
5. **Extensibilidade**: Fácil adicionar novas regras de roteamento

---

## 🔧 Como Usar

### Importar funções de autenticação

```typescript
import { getSession, syncUserCookies, isPublicRoute } from "@/lib/middleware/auth";
```

### Importar funções de roteamento

```typescript
import { createRoutingContext, calculateNeedsOnboarding } from "@/lib/middleware/routing";
```

### Importar tudo

```typescript
import { getSession, createRoutingContext } from "@/lib/middleware";
```

---

## 📝 Notas Importantes

- **Runtime**: `nodejs` é obrigatório para usar Prisma
- **Location**: `proxy.ts` na raiz re-exporta de `src/proxy.ts` para compatibilidade
- **Matcher**: Configurado para excluir arquivos estáticos automaticamente
- **Cookies**: Todos os cookies são `httpOnly: false` para acesso no cliente
- **Logs**: Usa `console.error` para garantir visibilidade em produção
