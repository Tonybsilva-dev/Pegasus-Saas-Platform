[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="#">
    <img src="./assets/logo.png" alt="Logo" width="150" height="150">
  </a>

  <h3 align="center">Pegasus Platform</h3>

  <p align="center">
    Plataforma Multi-tenant para Gerenciamento de Eventos Esportivos e Torneios.
    <br />
    <a href="#"><strong>Explore a documentação »</strong></a>
    <br />
    <br />
    <a href="#">Ver Demo</a>
    ·
    <a href="https://github.com/your-username/pegasus-platform/issues">Reportar Bug / Solicitar Feature</a>
    ·
    <a href="#">Status da Aplicação</a>
  </p>
</p>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Índice</summary>
  <ol>
    <li>
      <a href="#sobre-o-projeto">Sobre o Projeto</a>
      <ul>
        <li><a href="#tecnologias">Tecnologias</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#configuração-de-variáveis-de-ambiente">Configuração de Variáveis de Ambiente</a></li>
        <li><a href="#configuração-do-banco-de-dados">Configuração do Banco de Dados</a></li>
        <li><a href="#configuração-do-redis">Configuração do Redis</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#executando-o-worker">Executando o Worker</a></li>
    <li><a href="#deploy">Deploy</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contribuindo">Contribuindo</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contato">Contato</a></li>
  </ol>
</details>

<!-- ABOUT THE PROJECT -->

## Sobre o Projeto

Pegasus Platform é uma plataforma multi-tenant completa para gerenciamento de eventos esportivos, torneios e competições. A aplicação permite criar eventos, gerenciar modalidades, times, jogadores e gerar chaves de torneio automaticamente.

### Tecnologias

- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Prisma** - ORM para PostgreSQL
- **NextAuth.js v5** - Autenticação SSO (Google, Microsoft)
- **Zustand** - Gerenciamento de estado global
- **TanStack Query** - Cache e sincronização de dados
- **Tailwind CSS v4** - Estilização
- **Shadcn UI** - Componentes UI
- **BullMQ** - Processamento de jobs em background
- **Redis** - Cache e filas de jobs
- **Resend** - Envio de emails transacionais
- **Vitest** - Framework de testes
- **ESLint + Prettier** - Qualidade de código

<!-- GETTING STARTED -->

## Getting Started

Para obter uma cópia local funcionando, siga estes passos simples.

### Prerequisites

Lista de requisitos necessários para usar o software:

- Node.js 20+ e npm

  ```sh
  npm install npm@latest -g
  ```

- Docker (para PostgreSQL e Redis)

  ```sh
  # macOS
  brew install docker

  # Ou baixe de https://www.docker.com/products/docker-desktop
  ```

### Installation

1. Clone o repositório

   ```sh
   git clone https://github.com/your-username/pegasus-platform.git
   cd pegasus-platform
   ```

2. Instale as dependências NPM

   ```sh
   npm install
   ```

3. Configure as variáveis de ambiente (veja seção abaixo)

4. Execute as migrações do Prisma

   ```sh
   npx prisma migrate dev
   ```

5. Inicie o servidor de desenvolvimento

   ```sh
   npm run dev
   ```

### Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Node Environment
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pegasus_platform?schema=public"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-with-at-least-32-characters-here"

# OAuth Providers (opcionais)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
MICROSOFT_CLIENT_ID="your-microsoft-client-id"
MICROSOFT_CLIENT_SECRET="your-microsoft-client-secret"

# Redis (opcional, necessário para BullMQ)
REDIS_URL="redis://localhost:6379"

# Emails (Resend - opcional)
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM="no-reply@yourdomain.com"

# Observability (opcionais)
SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
LOKI_URL=""
LOKI_USERNAME=""
LOKI_PASSWORD=""
```

### Configuração do Banco de Dados

Execute o seguinte comando para criar um container PostgreSQL:

```bash
docker run --name pg -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:latest
```

Depois, crie o banco de dados:

```bash
docker exec -it pg psql -U postgres -c "CREATE DATABASE pegasus_platform;"
```

Execute as migrações:

```bash
npx prisma migrate dev
```

### Configuração do Redis

Execute o seguinte comando para criar um container Redis:

```bash
# Com senha (recomendado para produção)
docker run --name redis -e REDIS_PASSWORD=redis -p 6379:6379 -d redis:latest redis-server --requirepass redis

# Sem senha (apenas para desenvolvimento)
docker run --name redis -p 6379:6379 -d redis:latest
```

Se usar Redis com senha, atualize a `REDIS_URL` no `.env`:

```env
REDIS_URL="redis://:redis@localhost:6379"
```

<!-- USAGE -->

## Usage

### Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

A aplicação estará disponível em [http://localhost:3000](http://localhost:3000).

### Executando Testes

```bash
# Executar todos os testes
npm test

# Executar testes com UI
npm run test:ui

# Executar testes com cobertura
npm run test:coverage

# Executar testes uma vez (CI)
npm run test:run
```

### Qualidade de Código

```bash
# Verificar qualidade (typecheck, lint, format, tests)
npm run quality:check

# Corrigir problemas automaticamente
npm run quality:fix
```

<!-- EXECUTANDO O WORKER -->

## Executando o Worker

O worker processa jobs de geração de chaves de torneio em background usando BullMQ e Redis.

### Desenvolvimento

Para executar o worker em modo desenvolvimento (com hot reload):

```bash
npm run dev:worker
```

### Produção

Para compilar e executar o worker em produção:

```bash
# Compilar
npm run build:worker

# Executar (após compilação)
node dist/src/jobs/worker.js
```

### Variáveis de Ambiente do Worker

O worker requer as mesmas variáveis de ambiente da aplicação principal, especialmente:

- `REDIS_URL` - URL de conexão com Redis (obrigatória)

<!-- DEPLOY -->

## Deploy

### Aplicação Principal (Next.js)

A aplicação pode ser deployada em qualquer plataforma que suporte Next.js:

- **Vercel** (recomendado)
- **AWS ECS/Fargate**
- **Railway**
- **Render**

### Worker (AWS ECS)

O worker deve ser deployado em um ambiente separado (AWS ECS) para processar jobs em background.

#### Pré-requisitos

- Conta AWS configurada
- ECS Cluster criado
- Task Definition configurada
- Redis acessível (ElastiCache ou instância EC2)

#### Variáveis de Ambiente no ECS

Configure as seguintes variáveis de ambiente na Task Definition:

```json
{
  "environment": [
    {
      "name": "NODE_ENV",
      "value": "production"
    },
    {
      "name": "REDIS_URL",
      "value": "redis://your-redis-endpoint:6379"
    },
    {
      "name": "DATABASE_URL",
      "value": "postgresql://..."
    }
  ]
}
```

#### Dockerfile para Worker

Crie um `Dockerfile.worker`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

CMD ["node", "dist/src/jobs/worker.js"]
```

#### Build e Deploy

```bash
# Build do worker
npm run build:worker

# Build da imagem Docker
docker build -f Dockerfile.worker -t pegasus-worker:latest .

# Tag e push para ECR
docker tag pegasus-worker:latest your-account.dkr.ecr.region.amazonaws.com/pegasus-worker:latest
docker push your-account.dkr.ecr.region.amazonaws.com/pegasus-worker:latest

# Atualizar serviço ECS
aws ecs update-service --cluster pegasus-cluster --service pegasus-worker --force-new-deployment
```

#### Health Checks

O worker não expõe endpoints HTTP, mas você pode monitorar:

- Logs do CloudWatch
- Métricas do BullMQ (jobs processados, falhados, etc.)
- Status do container ECS

<!-- ROADMAP -->

## Roadmap

Veja os [issues abertos](https://github.com/your-username/pegasus-platform/issues) para uma lista de features propostas (e problemas conhecidos).

### Status do Projeto

```bash
📝 Notas.

- [x] Multi-tenant Architecture
- [x] Autenticação SSO (Google, Microsoft)
- [x] Schema Prisma (Eventos, Modalidades, Times)
- [x] BullMQ + Redis para Jobs
- [x] Worker para Geração de Chaves
- [x] Layout Base do Dashboard
- [x] Integração Resend para Emails
- [ ] Geração de Chaves de Torneio
- [ ] Sistema de Rankings
- [ ] Badges e Conquistas
- [ ] Dashboard de Analytics
- [ ] Integração com Billing (Stripe/LemonSqueezy)
- [ ] Observability (Sentry, Loki, Grafana)
- [ ] Docker Compose
- [ ] CI/CD
```

<!-- CONTRIBUTING -->

## Contribuindo

Contribuições são o que tornam a comunidade open source um lugar incrível para aprender, inspirar e criar. Qualquer contribuição que você fizer será **muito apreciada**.

1. Faça um Fork do projeto
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

<!-- LICENSE -->

## License

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.

<!-- CONTACT -->

## Contato

### Autor

---

 <table>
  <tr>
    <td align="center"><a href="https://github.com/your-username"><img src="https://avatars.githubusercontent.com/u/your-user-id?v=4" width="100px;" alt=""/><br /><sub><b>Seu Nome</b></sub></a><br /><a href="#" title="Documentation">📖</a> <a href="#" title="Reviewed Pull Requests">👀</a></td>
 </tr>
</table>

---

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[contributors-shield]: https://img.shields.io/github/contributors/your-username/pegasus-platform.svg?style=for-the-badge
[contributors-url]: https://github.com/your-username/pegasus-platform/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/your-username/pegasus-platform.svg?style=for-the-badge
[forks-url]: https://github.com/your-username/pegasus-platform/network/members
[stars-shield]: https://img.shields.io/github/stars/your-username/pegasus-platform.svg?style=for-the-badge
[stars-url]: https://github.com/your-username/pegasus-platform/stargazers
[issues-shield]: https://img.shields.io/github/issues/your-username/pegasus-platform.svg?style=for-the-badge
[issues-url]: https://github.com/your-username/pegasus-platform/issues
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/your-profile/
