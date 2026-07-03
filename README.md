# Plataforma de Manutenção Entre Amigos — V14 Produção Base

Versão limpa para piloto operacional no RioMar Recife.

## Estrutura

- `index.html`
- `manifest.json`
- `src/`
  - `assets/`
  - `components/`
  - `pages/`
  - `services/`
  - `styles/`
  - `supabase/`

## Como configurar

Abra:

`src/supabase/config.js`

Preencha com:

```js
export const SUPABASE_URL = "https://SEU-PROJETO.supabase.co";
export const SUPABASE_ANON_KEY = "SUA_PUBLISHABLE_KEY";
```

ou, se o arquivo estiver usando `SUPABASE_PUBLISHABLE_KEY`, cole a mesma Publishable Key nela.

## Como testar

1. Abra esta pasta no VS Code.
2. Rode com Live Server.
3. Faça login com seu usuário do Supabase.
4. Teste no modo local se precisar validar as telas.

## Módulos

- Login Supabase
- Dashboard RioMar Recife
- Abrir chamado
- Ocorrências / OS
- Equipamentos
- Preventivas com checklist obrigatório
- Usuários
- Relatórios
- PWA básico

## Próximo passo

Subir essa pasta para o GitHub e publicar pela Vercel.
