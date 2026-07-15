import {sb} from '../config/supabase.js';
export const listPreventives=unitId=>sb.from('preventivas_agendamentos').select('*').eq('unidade_id',unitId).order('data_programada',{ascending:true});
export const createPreventive=payload=>sb.from('preventivas_agendamentos').insert(payload);
export const updatePreventive=(id,payload)=>sb.from('preventivas_agendamentos').update(payload).eq('id',id);
export const insertPreventiveAttachment=payload=>sb.from('preventivas_anexos').insert(payload);
export const insertChecklistResponse=payload=>sb.from('preventivas_checklist_respostas').insert(payload);
