# Teste ponta a ponta (V18.1)

Roda o app num Chromium real contra uma **réplica local** do banco de produção (estrutura exportada em 23/10/2026, sem dados), com os SQL 01–05 aplicados.

- `replica.sql` — estrutura do banco gerada por `build_replica.py` a partir do export do schema.
- `build_db.sh` — cria o banco `e2e`, aplica `sql/01..05` e os usuários de teste (`seed_e2e.sql`).
- `start_stack.sh` — sobe Postgres, PostgREST e `gateway.js` (simula Auth e Storage do Supabase e serve o app em http://localhost:8080).
- `t1_diretor.js` — importa a planilha, abre equipamentos, gera preventivas, biblioteca, cadastros, painel.
- `t2_fluxo.js` — líder abre 2 chamados; técnico executa checklist com NC (fritadeira) e com medição fora da faixa (câmara, terceirizada); técnico conclui o chamado; líder confirma; gerente valida a terceirizada.
- `t3_mobile_dir.js` — telas da diretoria no celular.

Usuários de teste (senha `teste123`): walter@teste.com (DIRETOR), gerente@teste.com, tecnico@teste.com, lider@teste.com.
Dependências: PostgreSQL 16, PostgREST 12, Node 22, `npm i @supabase/supabase-js@2.45.4 jsonwebtoken@9 playwright@1.47.2 xlsx@0.18.5`.
