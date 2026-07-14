import {sb} from '../config/supabase.js';
export const UNIT_NAMES=['RioMar Recife','RioMar Fortaleza','Espinheiro','Boa Viagem','Praia'];
export async function loadUnits(){return sb.from('unidades').select('id,nome,ativo').eq('ativo',true).order('nome')}
