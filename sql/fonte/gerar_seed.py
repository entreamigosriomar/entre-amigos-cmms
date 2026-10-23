import json
R=json.load(open('biblioteca.json'))
def q(v):
    if v is None: return 'null'
    if isinstance(v,bool): return 'true' if v else 'false'
    if isinstance(v,(int,float)): return str(v)
    return "'"+str(v).replace("'","''")+"'"
out=["""-- =====================================================================
-- 04 — Carga inicial da biblioteca de rotinas (51 rotinas, {n} itens)
-- Fonte: Manual de Manutenções Preventivas v1.0 (05/2025), aprovado
-- pelo diretor em 23/10/2026. Rode depois do 02.
--
-- Pode rodar de novo sem duplicar: rotinas já existentes (mesmo código)
-- são mantidas como estão, inclusive com as edições feitas pela tela.
-- =====================================================================
begin;
""".format(n=sum(len(r['itens']) for r in R))]
for r in R:
    out.append(f"""with r as (
  insert into public.preventiva_rotinas (codigo, familia, tipo_equipamento, nome, frequencia, executor, observacao, secao_manual)
  values ({q(r['codigo'])}, {q(r['familia'])}, {q(r['tipo_equipamento'])}, {q(r['nome'])}, {q(r['frequencia'])}, {q(r['executor'])}, {q(r['observacao'])}, {q(r['secao_manual'])})
  on conflict (codigo) do nothing
  returning id
)
insert into public.preventiva_rotina_itens (rotina_id, ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria)
select r.id, v.* from r, (values""")
    rows=[]
    for i,it in enumerate(r['itens'],1):
        rows.append(f"  ({i}, {q(it['grupo'])}, {q(it['texto'])}, {q(it['tipo'])}, {q(it['criterio'])}, {q(it['criticidade'])}, {q(it['unidade'])}, {q(it['minimo'])}::numeric, {q(it['maximo'])}::numeric, {q(it['faixa_equipamento'])}, {q(it['bloqueio'])}, {q(it['novo'])}, {q(it['foto_obrigatoria'])})")
    out.append(",\n".join(rows)+"\n) as v(ordem, grupo, texto, tipo, criterio, criticidade, unidade_medida, minimo, maximo, faixa_equipamento, bloqueio, novo, foto_obrigatoria);\n")
out.append("""commit;

-- Conferência: 51 rotinas e o total de itens
select count(*) as rotinas, (select count(*) from public.preventiva_rotina_itens) as itens
from public.preventiva_rotinas;
""")
open('/home/claude/entreamigosriomar/entre-amigos-cmms/sql/04_carga_biblioteca.sql','w').write("\n".join(out))
