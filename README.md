# V17 — Modularização e Estabilização

Esta branch reorganiza a aplicação CMMS para manter compatibilidade com GitHub Pages e estabilizar o fluxo de abertura de Ordem de Serviço com fotos em Android, iPhone e desktop.

## Como testar localmente

1. Abra `index.html` por um servidor estático simples ou pelo GitHub Pages da branch.
2. Execute o smoke test estático:

```bash
npm test
```

## Principais mudanças

- HTML principal reduzido e carregando CSS/JS externos.
- Código separado em `src/` por configuração, estado, serviços, domínio, UI e páginas.
- Fluxo de abertura de OS reconstruído com seletor de câmera/galeria, miniaturas, remoção de fotos, validação de tipo/tamanho/quantidade e proteção contra duplo envio.
- Multiunidade com seletor para MASTER, ADMIN e DIRETOR.
- Realtime recriado ao trocar unidade e sem polling que recria formulários em preenchimento.
- Status de OS padronizados nos filtros.

## Banco de dados

Não há alteração destrutiva ou migração SQL nova nesta versão.
