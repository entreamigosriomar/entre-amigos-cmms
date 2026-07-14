import {sb} from '../config/supabase.js';
export const getSession=()=>sb.auth.getSession();
export const signIn=(email,password)=>sb.auth.signInWithPassword({email,password});
export const signOut=()=>sb.auth.signOut();
export async function loadProfile(userId){const {data,error}=await sb.from('perfis').select('*').eq('id',userId).single();if(error)throw new Error('Perfil não encontrado: '+error.message);return data;}
