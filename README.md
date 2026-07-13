# V17 — Modularização, Estabilização e Auditoria de Produção

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
- Fluxo de abertura de OS preservado e reforçado com unidade, área, setor, categoria, equipamento, prioridade, problema, descrição e fotos.
- Câmera e galeria separadas, múltiplas fotos, miniaturas, remoção de fotos, validação de tipo, limite de 8 fotos e 10 MB por imagem.
- Campos e fotos são preservados em erro de upload/gravação, com proteção contra duplo envio.
- Multiunidade com seletor para MASTER, ADMIN e DIRETOR; técnicos ficam restritos à unidade do perfil.
- Realtime recriado ao trocar unidade e sem polling que recria formulários em preenchimento.
- Status de OS padronizados nos filtros, com CANCELADA fora de abertas.
- Indicador “Custo do Mês” filtrado pelo mês corrente.

## Banco de dados

Não há alteração destrutiva ou migração SQL nova nesta versão.
