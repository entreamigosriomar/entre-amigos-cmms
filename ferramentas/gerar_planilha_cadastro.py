import json, collections
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.comments import Comment

R=json.load(open('/home/claude/biblioteca/biblioteca.json'))
NAVY="13254A"; ORANGE="E94D10"; GRAY="5B6B85"; LIGHT="EEF1F6"; INPUT="FFF7E0"
F=lambda **k: Font(name="Arial", **k)
thin=Side(style="thin", color="C9D3E3"); border=Border(left=thin,right=thin,top=thin,bottom=thin)
FAM={"CLI":"Climatização","REF":"Refrigeração","GAS":"Cocção a gás","COC":"Cocção elétrica e fornos","EXA":"Exaustão","LAV":"Lavagem e gelo","INC":"Incêndio e gás","ELE":"Elétrica e energia","TI":"Tecnologia","PRE":"Predial"}
FREQ={"SEMANAL":"semanal","MENSAL":"mensal","TRIMESTRAL":"trimestral","QUADRIMESTRAL":"quadrimestral","SEMESTRAL":"semestral","ANUAL":"anual","QUINQUENAL":"a cada 5 anos"}
POR_LOJA={"Rede de gás","Sistema saponificante, CO₂ e dampers","Sistema de detecção de gás","Alarme e detectores de fumaça","Bomba dos hidrantes","Brigada de incêndio","Tubulação de gás","Servidor e rack","Gerador"}
tipos=collections.OrderedDict()
for r in R:
    t=tipos.setdefault(r["tipo_equipamento"],{"fam":FAM[r["familia"]],"rot":[],"fx":set()})
    t["rot"].append(f'{r["codigo"]} ({FREQ[r["frequencia"]]}{", terceirizada" if r["executor"]=="TERCEIRIZADA" else ""})')
    for i in r["itens"]:
        if i["faixa_equipamento"]: t["fx"].add(i["unidade"])
FXNOME={"°C":"Temperatura mín./máx.","V":"Tensão","A":"Corrente nominal","psi":"Pressões (terceirizada informa)","s":"Tempo de partida (fabricante)"}
extras=[("Mobiliário","Sem preventiva",["Só chamados"]),("TI e KDS","Sem preventiva",["Só chamados"]),("Predial e estrutura","Sem preventiva",["Só chamados"]),("Outro equipamento","Sem preventiva",["Só chamados"])]

wb=Workbook()
# ---------------- Instruções ----------------
ws=wb.active; ws.title="Instruções"
ws.sheet_view.showGridLines=False
ws.column_dimensions["A"].width=3; ws.column_dimensions["B"].width=28; ws.column_dimensions["C"].width=90
ws["B2"]="Cadastro de equipamentos — RioMar Recife"; ws["B2"].font=F(size=18,bold=True,color=NAVY)
ws["B3"]="Plataforma de Manutenção Entre Amigos · modelo para importação · versão 23/10/2026"; ws["B3"].font=F(size=10,color=GRAY)
linhas=[
("Objetivo","Cadastrar todos os equipamentos e itens da loja. Cada linha vira um equipamento no sistema, com suas preventivas criadas automaticamente pelo Tipo."),
("Onde preencher","Aba Equipamentos, a partir da linha 6. As linhas 4 e 5 são exemplos: pode apagar ou sobrescrever."),
("Obrigatórios","Área, Setor, Equipamento e Tipo (cabeçalho laranja). Sem eles a linha não é importada."),
("Opcionais","Fabricante, Modelo, Nº de série, faixas e observações (cabeçalho azul). Nº de série NÃO é obrigatório."),
("Uma linha por item","3 balcões iguais = 3 linhas, com nomes diferentes: Balcão refrigerado 01, 02 e 03."),
("Tipo","Escolha na lista. Ele define as preventivas do equipamento (veja a aba Tipos). Itens sem preventiva (cadeira, aparador, tela do KDS) usam Mobiliário, TI e KDS, Predial e estrutura ou Outro equipamento: servem para abrir chamados."),
("Sistemas da loja","Rede de gás, detecção de gás, alarme, gerador, brigada e similares: cadastre 1 linha por loja (Área Técnica, por exemplo)."),
("Faixas","Preencha só quando a coluna Faixas necessárias pedir. Use o valor do fabricante; para temperatura, o combinado com a nutrição."),
("Áreas e setores","Ajuste a lista na aba Áreas e setores antes de começar. As colunas Área e Setor usam essa lista."),
("Conferência","A coluna Conferência mostra OK ou o que falta. Envie a planilha só quando todas as linhas estiverem OK."),
]
r0=5
for i,(a,b) in enumerate(linhas):
    ws.cell(row=r0+i,column=2,value=a).font=F(bold=True,color=NAVY,size=11)
    c=ws.cell(row=r0+i,column=3,value=b); c.font=F(size=11); c.alignment=Alignment(wrap_text=True,vertical="top")
    ws.cell(row=r0+i,column=2).alignment=Alignment(vertical="top")
    ws.row_dimensions[r0+i].height=34 if len(b)<110 else 50
lg=r0+len(linhas)+1
ws.cell(row=lg,column=2,value="Legenda").font=F(bold=True,color=NAVY,size=11)
for j,(fill,txt,fc) in enumerate([(ORANGE,"Cabeçalho laranja = obrigatório","FFFFFF"),(NAVY,"Cabeçalho azul = opcional","FFFFFF"),(INPUT,"Fundo creme = célula para preencher",NAVY),(LIGHT,"Fundo cinza = calculado, não editar",GRAY)]):
    c=ws.cell(row=lg+1+j,column=2,value=txt); c.fill=PatternFill("solid",fgColor=fill); c.font=F(bold=True,color=fc,size=10)

# ---------------- Áreas e setores ----------------
wa=wb.create_sheet("Áreas e setores")
wa.sheet_view.showGridLines=False
wa["A1"]="Áreas e setores da loja (ajuste à vontade)"; wa["A1"].font=F(size=14,bold=True,color=NAVY)
wa["A2"]="Sugestão inicial. Inclua, renomeie ou apague linhas; as listas da aba Equipamentos usam as colunas A e B."; wa["A2"].font=F(size=10,color=GRAY)
for col,h in zip("AB",["Área","Setor"]):
    c=wa[f"{col}4"]; c.value=h; c.font=F(bold=True,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=NAVY); c.border=border
areas=[("Cozinha","Cozinha quente"),("Cozinha","Cozinha fria"),("Cozinha","Sobremesa"),("Cozinha","Copa"),("Cozinha","Lavagem"),("Estoque","Câmaras frias"),("Estoque","Estoque seco"),("Salão","Salão principal"),("Salão","Salão frente do bar"),("Salão","Varanda"),("Bar","Balcão do bar"),("Banheiros","Banheiro clientes"),("Banheiros","Banheiro funcionários"),("Área técnica","Casa de máquinas"),("Área técnica","Quadros elétricos"),("Administrativo","Escritório"),("Área externa","Fachada")]
for i,(a,s) in enumerate(areas):
    for col,v in zip("AB",(a,s)):
        c=wa[f"{col}{5+i}"]; c.value=v; c.font=F(size=11); c.fill=PatternFill("solid",fgColor=INPUT); c.border=border
for i in range(len(areas),80):
    for col in "AB":
        c=wa[f"{col}{5+i}"]; c.fill=PatternFill("solid",fgColor=INPUT); c.border=border; c.font=F(size=11)
wa.column_dimensions["A"].width=24; wa.column_dimensions["B"].width=30
# lista única de áreas (para validação) em D
wa["D4"]="Áreas (lista)"; wa["D4"].font=F(bold=True,color="FFFFFF"); wa["D4"].fill=PatternFill("solid",fgColor=NAVY)
uni=list(dict.fromkeys(a for a,_ in areas))
for i,a in enumerate(uni): wa[f"D{5+i}"]=a; wa[f"D{5+i}"].font=F(size=11); wa[f"D{5+i}"].fill=PatternFill("solid",fgColor=INPUT)
for i in range(len(uni),30): wa[f"D{5+i}"].fill=PatternFill("solid",fgColor=INPUT)
wa.column_dimensions["D"].width=24
wa["F4"]="Escreva cada área uma única vez na coluna D."; wa["F4"].font=F(size=10,color=GRAY,italic=True)

# ---------------- Tipos ----------------
wt=wb.create_sheet("Tipos")
wt.sheet_view.showGridLines=False
wt["A1"]="Tipos de equipamento e preventivas que cada um gera"; wt["A1"].font=F(size=14,bold=True,color=NAVY)
wt["A2"]="Fonte: Biblioteca de rotinas aprovada em 23/10/2026 (51 rotinas). Não editar: é a referência da importação."; wt["A2"].font=F(size=10,color=GRAY)
hdr=["Tipo","Família","Preventivas criadas","Faixas necessárias","Como cadastrar"]
for j,h in enumerate(hdr):
    c=wt.cell(row=4,column=j+1,value=h); c.font=F(bold=True,color="FFFFFF"); c.fill=PatternFill("solid",fgColor=NAVY); c.border=border
row=5
for t,v in tipos.items():
    fx=", ".join(FXNOME[u] for u in ["°C","V","A","psi","s"] if u in v["fx"]) or "—"
    vals=[t,v["fam"],"; ".join(v["rot"]),fx,"1 por loja" if t in POR_LOJA else "1 linha por equipamento"]
    for j,x in enumerate(vals):
        c=wt.cell(row=row,column=j+1,value=x); c.font=F(size=10); c.border=border; c.alignment=Alignment(wrap_text=True,vertical="top")
    row+=1
for t,fam,rot in extras:
    for j,x in enumerate([t,fam,"; ".join(rot),"—","1 linha por item"]):
        c=wt.cell(row=row,column=j+1,value=x); c.font=F(size=10,italic=True); c.border=border; c.alignment=Alignment(wrap_text=True,vertical="top")
    row+=1
last_tipo=row-1
for col,w in zip("ABCDE",[36,22,58,34,22]): wt.column_dimensions[col].width=w

# ---------------- Equipamentos ----------------
we=wb.create_sheet("Equipamentos",1)
we.sheet_view.showGridLines=False
we.freeze_panes="E4"
we["A1"]="Equipamentos — RioMar Recife"; we["A1"].font=F(size=16,bold=True,color=NAVY)
we["A2"]="Preencha a partir da linha 6. Linhas 4 e 5 são exemplos. Laranja = obrigatório; azul = opcional; cinza = calculado."; we["A2"].font=F(size=10,color=GRAY)
cols=[("Unidade",False,16,True),("Área",True,18,False),("Setor",True,24,False),("Equipamento",True,30,False),("Tipo",True,34,False),
      ("Fabricante",False,16,False),("Modelo",False,16,False),("Nº de série",False,16,False),
      ("Tensão (V)",False,11,False),("Corrente nominal (A)",False,12,False),("Temp. mínima (°C)",False,11,False),("Temp. máxima (°C)",False,11,False),
      ("Observações",False,30,False),("Preventivas que serão criadas",None,48,True),("Faixas necessárias",None,26,True),("Conferência",None,30,True),("Família",None,20,True)]
HR=3
for j,(h,req,w,calc) in enumerate(cols,1):
    c=we.cell(row=HR,column=j,value=h)
    c.font=F(bold=True,color="FFFFFF",size=10)
    c.fill=PatternFill("solid",fgColor=ORANGE if req else (NAVY if req is False else GRAY))
    c.alignment=Alignment(wrap_text=True,vertical="center"); c.border=border
    we.column_dimensions[c.column_letter].width=w
we.row_dimensions[HR].height=36
we["H3"].comment=Comment("Opcional. Deixe em branco se o equipamento não tiver ou não for possível ver.","Plataforma")
we["K3"].comment=Comment("Para refrigeração: faixa combinada com a nutrição (ex.: congelados −22 a −18).","Plataforma")
FIRST,LAST=4,303
ex=[["RioMar Recife","Cozinha","Sobremesa","Micro-ondas","Outro equipamento","","","","220","","","","Exemplo: item só para chamados"],
    ["RioMar Recife","Salão","Salão frente do bar","Aparador","Mobiliário","","","","","","","","Exemplo: item só para chamados"]]
for r in range(FIRST,LAST+1):
    for j in range(1,14):
        c=we.cell(row=r,column=j); c.border=border; c.font=F(size=10,italic=(r<6),color=(GRAY if r<6 else "0F1B33"))
        c.fill=PatternFill("solid",fgColor=INPUT)
    we.cell(row=r,column=1,value="RioMar Recife") if r>=6 else None
    # calculados
    we.cell(row=r,column=14,value=f'=IF($E{r}="","",IFERROR(INDEX(Tipos!$C$5:$C${last_tipo},MATCH($E{r},Tipos!$A$5:$A${last_tipo},0)),"Tipo não encontrado"))')
    we.cell(row=r,column=15,value=f'=IF($E{r}="","",IFERROR(INDEX(Tipos!$D$5:$D${last_tipo},MATCH($E{r},Tipos!$A$5:$A${last_tipo},0)),""))')
    we.cell(row=r,column=16,value=f'=IF(COUNTA($B{r}:$E{r})=0,"",IF($B{r}="","Falta Área",IF($C{r}="","Falta Setor",IF($D{r}="","Falta Equipamento",IF($E{r}="","Falta Tipo",IF(COUNTIF($D${FIRST}:$D${LAST},$D{r})>1,"Nome repetido: diferencie (01, 02…)",IF(AND(ISNUMBER(SEARCH("Temperatura",$O{r})),OR($K{r}="",$L{r}="")),"Falta faixa de temperatura",IF(AND(ISNUMBER($K{r}),ISNUMBER($L{r}),$K{r}>$L{r}),"Temp. mínima maior que a máxima","OK"))))))))')
    we.cell(row=r,column=17,value=f'=IF($E{r}="","",IFERROR(INDEX(Tipos!$B$5:$B${last_tipo},MATCH($E{r},Tipos!$A$5:$A${last_tipo},0)),""))')
    for j in (14,15,16,17):
        c=we.cell(row=r,column=j); c.fill=PatternFill("solid",fgColor=LIGHT); c.border=border; c.font=F(size=10,color=GRAY); c.alignment=Alignment(wrap_text=True,vertical="top")
for i,vals in enumerate(ex):
    for j,v in enumerate(vals,1):
        cell=we.cell(row=FIRST+i,column=j)
        cell.value=(int(v) if v.isdigit() else v) if v else None
# formatos numéricos
for r in range(FIRST,LAST+1):
    for j in (10,11,12): we.cell(row=r,column=j).number_format='0.0;-0.0'
# conferência destaque
we.conditional_formatting.add(f"P{FIRST}:P{LAST}",FormulaRule(formula=[f'$P{FIRST}="OK"'],font=Font(name="Arial",color="1F7A45",bold=True),fill=PatternFill("solid",fgColor="DDF3E4")))
we.conditional_formatting.add(f"P{FIRST}:P{LAST}",FormulaRule(formula=[f'AND($P{FIRST}<>"",$P{FIRST}<>"OK")'],font=Font(name="Arial",color="9F1D12",bold=True),fill=PatternFill("solid",fgColor="FDE3DF")))
# validações
dv_area=DataValidation(type="list",formula1="='Áreas e setores'!$D$5:$D$34",allow_blank=True,showErrorMessage=True,errorTitle="Área",error="Escolha uma área da lista (aba Áreas e setores).")
dv_setor=DataValidation(type="list",formula1="='Áreas e setores'!$B$5:$B$84",allow_blank=True,showErrorMessage=True,errorTitle="Setor",error="Escolha um setor da lista (aba Áreas e setores).")
dv_tipo=DataValidation(type="list",formula1=f"=Tipos!$A$5:$A${last_tipo}",allow_blank=True,showErrorMessage=True,errorTitle="Tipo",error="Escolha um tipo da lista (aba Tipos).")
dv_v=DataValidation(type="list",formula1='"127,220,380"',allow_blank=True)
dv_num=DataValidation(type="decimal",operator="between",formula1="-60",formula2="400",allow_blank=True,showErrorMessage=True,error="Digite só o número.")
for dv,rng in [(dv_area,f"B{FIRST}:B{LAST}"),(dv_setor,f"C{FIRST}:C{LAST}"),(dv_tipo,f"E{FIRST}:E{LAST}"),(dv_v,f"I{FIRST}:I{LAST}"),(dv_num,f"J{FIRST}:L{LAST}")]:
    we.add_data_validation(dv); dv.add(rng)
we.auto_filter.ref=f"A{HR}:Q{LAST}"

# ---------------- Resumo ----------------
wr=wb.create_sheet("Resumo",2)
wr.sheet_view.showGridLines=False
wr["A1"]="Resumo do cadastro"; wr["A1"].font=F(size=14,bold=True,color=NAVY)
items=[("Linhas preenchidas (sem exemplos)",f'=COUNTA(Equipamentos!D6:D{LAST})'),
       ("Linhas OK",f'=COUNTIF(Equipamentos!P6:P{LAST},"OK")'),
       ("Linhas com pendência",f'=B4-B5'),
       ("Itens só para chamados",f'=COUNTIF(Equipamentos!N6:N{LAST},"Só chamados")'),
       ("Equipamentos com preventiva",f'=B5-COUNTIFS(Equipamentos!N6:N{LAST},"Só chamados",Equipamentos!P6:P{LAST},"OK")')]
for i,(a,f) in enumerate(items):
    wr.cell(row=4+i,column=1,value=a).font=F(size=11)
    c=wr.cell(row=4+i,column=2,value=f); c.font=F(size=11,bold=True,color=NAVY); c.border=border
wr.column_dimensions["A"].width=38; wr.column_dimensions["B"].width=12
wr["A10"]="Por família"; wr["A10"].font=F(bold=True,color=NAVY,size=11)
fams=list(dict.fromkeys(v["fam"] for v in tipos.values()))+["Sem preventiva"]
for i,fam in enumerate(fams):
    wr.cell(row=11+i,column=1,value=fam).font=F(size=11)
    c=wr.cell(row=11+i,column=2,value=f'=COUNTIF(Equipamentos!$Q$6:$Q${LAST},"{fam}")')
    c.font=F(size=11); c.border=border
wb.save("Cadastro_Equipamentos_RioMar_Recife.xlsx")
print("ok", last_tipo)
