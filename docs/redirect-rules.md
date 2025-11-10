# Regras de Redirecionamento - Proxy e Container

## 📋 Tabela de Regras de Redirecionamento

### **PROXY (Server-Side) - Ordem de Execução**

| # | Regra | Condições Necessárias | Ação | Prioridade |
|---|-------|----------------------|------|------------|
| **0** | **Rota Pública** | `!session?.user` AND `isPublicRoute` | ✅ Permitir acesso (limpar cookies) | **MÁXIMA** |
| **1** | **Não Autenticado → Login** | `!session?.user` AND `!isPublicRoute` AND `pathname.startsWith("/api/")` | 🔴 Retornar 401 | **ALTA** |
| **2** | **Não Autenticado → Login** | `!session?.user` AND `!isPublicRoute` AND `!pathname.startsWith("/api/")` | 🔴 Redirect → `/login` | **ALTA** |
| **3** | **Bloqueio PENDING/INACTIVE** | `shouldBlock = true` AND `!isPublicRoute` AND `!isAllowed` | 🔴 Redirect → `/onboarding/pending` | **ALTA** |
| **4** | **Bloquear /onboarding (Tenant Válido)** | `!shouldBlock` AND `pathname.startsWith("/onboarding")` AND `hasValidTenant = true` | 🔴 Redirect → `/dashboard` | **MÉDIA** |
| **5** | **Permitir /onboarding (Sem Tenant)** | `!shouldBlock` AND `pathname.startsWith("/onboarding")` AND `!dbUser?.tenantId` | ✅ Permitir acesso | **MÉDIA** |
| **6** | **Permitir /onboarding (Tenant Inválido)** | `!shouldBlock` AND `pathname.startsWith("/onboarding")` AND `dbUser?.tenantId` AND `!hasValidTenant` | ✅ Permitir acesso | **MÉDIA** |
| **7** | **Redirecionar para /onboarding** | `needsOnboarding = true` AND `!pathname.startsWith("/onboarding")` AND `!shouldBlock` | 🔴 Redirect → `/onboarding` | **MÉDIA** |
| **8** | **Permitir /onboarding (needsOnboarding)** | `needsOnboarding = true` AND `pathname.startsWith("/onboarding")` AND `!shouldBlock` | ✅ Permitir acesso | **MÉDIA** |
| **9** | **Bloquear /dashboard (PENDING)** | `shouldBlock = true` AND `!isPublicRoute` AND `pathname.startsWith("/dashboard")` | 🔴 Redirect → `/onboarding/pending` | **ALTA** |
| **10** | **Bloquear sem TenantId** | `!tenantId` AND `!isPublicRoute` AND `pathname.startsWith("/api/")` | 🔴 Retornar 403 | **MÉDIA** |
| **11** | **Bloquear sem TenantId** | `!tenantId` AND `!isPublicRoute` AND `!pathname.startsWith("/api/")` | 🔴 Redirect → `/login` | **MÉDIA** |

### **CONTAINER (Client-Side) - Ordem de Execução**

| # | Regra | Condições Necessárias | Ação | Prioridade |
|---|-------|----------------------|------|------------|
| **C1** | **Aguardar Sessão** | `isSessionPending = true` OR `!session?.user` | ⏳ Mostrar loading | **ALTA** |
| **C2** | **Redirecionar se não autenticado** | `!isSessionPending` AND `!session?.user` | 🔴 Redirect → `/login` | **ALTA** |
| **C3** | **Redirecionar se tem Tenant Válido** | `data.hasValidTenant = true` | 🔴 Redirect → `/dashboard` | **MÉDIA** |
| **C4** | **Redirecionar se PENDING** | `data.isPending = true` | 🔴 Redirect → `/onboarding/pending` | **MÉDIA** |
| **C5** | **Permitir Onboarding** | `!data.hasValidTenant` AND `!data.isPending` | ✅ Mostrar onboarding | **MÉDIA** |

---

## 🔍 Detalhamento das Condições

### **Variáveis Calculadas**

#### **shouldBlock**
```typescript
const userPending = dbUser?.approvalStatus === "PENDING";
const tenantPending = dbTenant?.approvalStatus === "PENDING";
const tenantInactive = dbTenant?.isActive === false;
const shouldBlock = userPending || tenantPending || tenantInactive;
```

**Condições:**
- ✅ `shouldBlock = true` se:
  - `user.approvalStatus === "PENDING"` OU
  - `tenant.approvalStatus === "PENDING"` OU
  - `tenant.isActive === false`
- ✅ `shouldBlock = false` se:
  - `user.approvalStatus !== "PENDING"` E
  - `tenant.approvalStatus !== "PENDING"` E
  - `tenant.isActive === true`

#### **hasValidTenant**
```typescript
const tenantApproved = dbTenant.approvalStatus === "APPROVED";
const tenantActive = dbTenant.isActive === true;
const isDefaultTenant = defaultTenant && dbUser.tenantId === defaultTenant.id;
const hasValidTenant = tenantApproved && tenantActive && !isDefaultTenant;
```

**Condições:**
- ✅ `hasValidTenant = true` se:
  - `tenant.approvalStatus === "APPROVED"` E
  - `tenant.isActive === true` E
  - `tenant.slug !== "default"`
- ✅ `hasValidTenant = false` se:
  - `tenant.approvalStatus !== "APPROVED"` OU
  - `tenant.isActive !== true` OU
  - `tenant.slug === "default"` OU
  - `!dbUser?.tenantId` OU
  - `!dbTenant`

#### **needsOnboarding**
```typescript
let needsOnboarding = false;

if (dbUser && !shouldBlock) {
  const isDefaultTenant = defaultTenant && dbUser.tenantId === defaultTenant.id;
  
  if (!dbUser.tenantId) {
    needsOnboarding = true;
  } else if (isDefaultTenant && dbUser.role === "ATHLETE") {
    needsOnboarding = true;
  } else {
    needsOnboarding = false;
  }
}
```

**Condições:**
- ✅ `needsOnboarding = true` se:
  - `!dbUser?.tenantId` OU
  - (`dbUser.tenantId === defaultTenant.id` E `dbUser.role === "ATHLETE"`)
- ✅ `needsOnboarding = false` se:
  - `dbUser.tenantId` existe E
  - (`dbUser.tenantId !== defaultTenant.id` OU `dbUser.role !== "ATHLETE"`)

#### **isPublicRoute**
```typescript
const publicRoutes = ["/login", "/", "/api/auth", "/api/webhooks"];
const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
```

**Condições:**
- ✅ `isPublicRoute = true` se:
  - `pathname.startsWith("/login")` OU
  - `pathname === "/"` OU
  - `pathname.startsWith("/api/auth")` OU
  - `pathname.startsWith("/api/webhooks")`

#### **isAllowed (para PENDING)**
```typescript
const allowedRoutes = ["/onboarding/pending", "/api/onboarding", "/api/auth"];
const isAllowed = allowedRoutes.some((route) => pathname.startsWith(route));
```

**Condições:**
- ✅ `isAllowed = true` se:
  - `pathname.startsWith("/onboarding/pending")` OU
  - `pathname.startsWith("/api/onboarding")` OU
  - `pathname.startsWith("/api/auth")`

---

## 🎯 Fluxo de Decisão (Diagrama Lógico)

```
INÍCIO
  ↓
Tem sessão? → NÃO → É rota pública? → SIM → ✅ Permitir
              ↓                        ↓
             NÃO                    NÃO → 🔴 Redirect /login
              ↓
             SIM
              ↓
Buscar dados do banco (dbUser, dbTenant, defaultTenant)
              ↓
Calcular shouldBlock
              ↓
shouldBlock = true? → SIM → É rota permitida? → SIM → ✅ Permitir
              ↓                        ↓
             NÃO                    NÃO → 🔴 Redirect /onboarding/pending
              ↓
             SIM
              ↓
Está em /onboarding? → SIM → Tem tenantId? → NÃO → ✅ Permitir
              ↓                        ↓
             NÃO                    SIM → Tem tenant válido? → SIM → 🔴 Redirect /dashboard
              ↓                                                    ↓
             SIM                                                  NÃO → ✅ Permitir
              ↓
Calcular needsOnboarding
              ↓
needsOnboarding = true? → SIM → Está em /onboarding? → NÃO → 🔴 Redirect /onboarding
              ↓                                    ↓
             NÃO                                  SIM → ✅ Permitir
              ↓
             SIM
              ↓
Tem tenantId? → NÃO → É rota pública? → NÃO → 🔴 Redirect /login
              ↓
             SIM
              ↓
✅ Permitir acesso
```

---

## 🐛 Problemas Identificados

### **Problema 1: Race Condition no Container**
O container faz uma verificação client-side que pode entrar em conflito com o proxy server-side. Se o proxy redireciona para `/dashboard` antes do container verificar, o usuário é redirecionado incorretamente.

**Solução:** O proxy deve ser a fonte única de verdade. O container deve apenas verificar se o usuário já completou o onboarding, não bloquear acesso.

### **Problema 2: Verificação 2 pode ser pulada**
Se `dbUser.tenantId` existe mas `dbTenant` é `null`, a verificação 2 é pulada e o usuário pode acessar `/onboarding` mesmo tendo um tenant.

**Solução:** Adicionar verificação adicional para garantir que se `dbUser.tenantId` existe, `dbTenant` também deve existir.

### **Problema 3: needsOnboarding calculado apenas se !shouldBlock**
Se `shouldBlock = true`, `needsOnboarding` não é calculado, mas isso pode causar problemas se o usuário não estiver bloqueado mas ainda precisar de onboarding.

**Solução:** Calcular `needsOnboarding` sempre, mas respeitar `shouldBlock` nas verificações.

---

## ✅ Recomendações

1. **Remover verificação C3 do Container** - Deixar apenas o proxy decidir
2. **Adicionar verificação de consistência** - Se `dbUser.tenantId` existe, `dbTenant` deve existir
3. **Simplificar lógica** - Reduzir número de verificações sobrepostas
4. **Adicionar cache** - Evitar múltiplas queries ao banco na mesma requisição

