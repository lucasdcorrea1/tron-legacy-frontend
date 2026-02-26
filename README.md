# Tron Legacy Blog

Um blog moderno e performático construído com React + Vite.

## [Acessar o Blog](https://www.whodo.com.br)

---

## Funcionalidades

- **Blog Público** - Feed de posts com filtro por categorias
- **Sistema de Autenticação** - Login e cadastro de usuários
- **Painel Admin** - Gerenciamento de posts e usuários
- **Editor de Posts** - Criação com suporte a Markdown e upload de imagens
- **SEO Ready** - Meta tags configuráveis por post
- **Responsivo** - Funciona em desktop, tablet e mobile

## Tech Stack

| Tecnologia | Uso |
|------------|-----|
| React 18 | UI Components |
| Vite 5 | Build Tool |
| React Router 7 | Navegação SPA |
| CSS Puro | Estilização |
| GitHub Pages | Hospedagem |
| GitHub Actions | CI/CD |

## Rodar Localmente

```bash
# Clonar o repositório
git clone https://github.com/lucasdcorrea1/tron-legacy-frontend.git
cd tron-legacy-frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.development

# Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_API_URL` | URL da API backend |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |

## Estrutura

```
src/
├── components/     # Componentes reutilizáveis
├── context/        # Context API (Auth)
├── pages/          # Páginas da aplicação
├── services/       # Serviços de API
└── styles/         # Estilos globais
```

## API

Este frontend consome a [Tron Legacy API](https://github.com/lucasdcorrea1/tron-legacy-api) em Go.

## Deploy

O deploy é automático via GitHub Actions a cada push na branch `main`.

---

**[Acessar o Blog](https://www.whodo.com.br)**
