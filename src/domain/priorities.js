export const priorityClass=p=>p==='CRITICA'?'crit':p==='ALTA'?'alta':p==='MEDIA'?'media':'baixa';
export const priorityWeight=p=>({BAIXA:1,MEDIA:2,ALTA:3,CRITICA:4}[p]||0);
