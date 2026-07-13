# V16 — Piloto Completo

Esta versão reúne as melhorias solicitadas para o teste operacional.

## Incluído

### Fotos e abertura de OS
- câmera e galeria separadas;
- várias fotos;
- miniaturas e remoção;
- problema e descrição não são apagados;
- fotos obrigatórias na abertura e conclusão.

### Painel administrativo
- dashboard completo e clicável;
- gráficos;
- calendário de preventivas;
- custos;
- visão multiunidade;
- equipamentos por status;
- relatórios, auditoria e configurações.

### Painel técnico
- Serviços do Dia;
- chamados com foto;
- preventivas do dia;
- atualização de situação;
- aguardando peça;
- aguardando terceirizada;
- aguardando aprovação do diretor;
- conclusão com fotos obrigatórias.

### Cadastros
- criar, editar e excluir/inativar:
  - equipamentos;
  - setores;
  - áreas;
  - categorias;
- somente MASTER, ADMIN ou DIRETOR;
- registros com histórico são inativados, não apagados.

### TAG
- numeração global e única;
- prefixo da unidade:
  - EA-RMR-001
  - EA-RMF-002
  - EA-ESP-003
  - EA-BV-004
  - EA-PRAIA-005
- ao transferir de unidade, preserva o número e troca o prefixo.

## Como aplicar

1. No Supabase, execute `MIGRACAO_V16.sql`.
2. No GitHub, substitua:
   - `index.html`
   - `README.md`
3. Aguarde o GitHub Pages ficar verde.
4. Feche e reabra o sistema nos celulares.

## Teste recomendado

1. Criar setor, área e categoria.
2. Editar e inativar um cadastro.
3. Criar equipamento e conferir a TAG.
4. Abrir OS com fotos no Android e iPhone.
5. Conferir no painel técnico.
6. Atualizar status e concluir com fotos.
7. Executar uma preventiva.
8. Conferir dashboard e custos.
