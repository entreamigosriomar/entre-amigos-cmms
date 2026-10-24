// Fotos: seleção (câmera/galeria), envio ao bucket privado e links temporários.
import { sb } from '../config/supabase.js';
import { esc, icon } from './util.js';

export const PHOTO_LIMIT = 8;
export const PHOTO_MAX = 10 * 1024 * 1024;
const BUCKET = 'os-anexos';

// HTML do seletor. `id` identifica o seletor na tela.
export function pickerHTML(id, { label = 'Fotos', allowPdf = false, big = false, text = 'Tirar foto' } = {}) {
  const accept = allowPdf ? 'image/*,application/pdf' : 'image/*';
  return `<div class="photo-picker" data-picker="${id}">
    ${label ? `<span class="field" style="font-size:14px;color:var(--navy)">${esc(label)}</span>` : ''}
    <div class="photo-add">
      <label class="${big ? 'photo-big' : 'btn btn-navy'}">${icon('camera', big ? 30 : 18, big ? 1.8 : 2)}${esc(text)}<input type="file" accept="image/*" capture="environment" data-cam></label>
      <label class="${big ? 'btn btn-light' : 'btn btn-light'}" style="${big ? 'align-self:stretch' : ''}">${icon('galeria', 18)}Galeria${allowPdf ? ' ou PDF' : ''}<input type="file" accept="${accept}" multiple data-gal></label>
    </div>
    <div class="photos" data-preview></div>
    <div class="msg" data-pmsg></div>
  </div>`;
}

// Liga o seletor a uma lista de arquivos (array mutável).
export function bindPicker(root, id, files, { allowPdf = false, onChange } = {}) {
  const box = root.querySelector(`[data-picker="${id}"]`);
  if (!box) return;
  const prev = box.querySelector('[data-preview]'), msg = box.querySelector('[data-pmsg]');
  let urls = [];
  const render = () => {
    urls.forEach(URL.revokeObjectURL); urls = [];
    prev.innerHTML = '';
    files.forEach((f, i) => {
      const d = document.createElement('div'); d.className = 'photo';
      if (f.type.startsWith('image/')) { const u = URL.createObjectURL(f); urls.push(u); const im = document.createElement('img'); im.src = u; im.alt = f.name; d.appendChild(im); }
      else { d.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:12px;font-weight:700;color:var(--navy)">PDF</div>`; }
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Remover'); b.textContent = '×';
      b.onclick = () => { files.splice(i, 1); render(); onChange?.(); };
      d.appendChild(b); prev.appendChild(d);
    });
  };
  const add = list => {
    msg.textContent = '';
    for (const f of Array.from(list || [])) {
      if (files.length >= PHOTO_LIMIT) { msg.textContent = `Limite de ${PHOTO_LIMIT} arquivos.`; break; }
      const ok = f.type.startsWith('image/') || (allowPdf && f.type === 'application/pdf');
      if (!ok) { msg.textContent = 'Selecione apenas imagens' + (allowPdf ? ' ou PDF.' : '.'); continue; }
      if (f.size > PHOTO_MAX) { msg.textContent = `${f.name} passa de 10 MB.`; continue; }
      files.push(f);
    }
    render(); onChange?.();
  };
  box.querySelectorAll('input[type=file]').forEach(inp => inp.onchange = e => { add(e.target.files); e.target.value = ''; });
  render();
}

// Envia arquivos; devolve [{path,name,mime,size}]. O banco guarda o caminho, nunca link público.
// Reduz fotos antes de enviar (lado maior 1600 px, JPEG 80%): de 3–5 MB para ~200–400 KB.
// PDFs e arquivos que não abrem como imagem vão como estão.
const MAX_LADO = 1600, QUALIDADE = 0.8;
async function comprimir(f) {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(f.type) || f.size < 300 * 1024) return f;
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
    const k = Math.min(1, MAX_LADO / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', QUALIDADE));
    if (!blob || blob.size >= f.size) return f;
    return new File([blob], f.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch { return f; }
}

export async function uploadFiles(files, unitId, folder) {
  const out = [];
  for (const original of files) {
    const f = await comprimir(original);
    const ext = (f.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `${unitId}/${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, f, { contentType: f.type, upsert: false });
    if (error) throw new Error(`Falha ao enviar ${f.name}: ${error.message}`);
    out.push({ path, name: f.name, mime: f.type, size: f.size });
  }
  return out;
}

// Aceita caminho (novo) ou link público antigo (V16.1/V18).
export function storagePath(v) {
  if (!v) return null;
  const m = String(v).match(/\/object\/(?:public|sign|authenticated)\/os-anexos\/([^?]+)/);
  if (m) return decodeURIComponent(m[1]);
  return /^https?:/i.test(v) ? null : String(v);
}
export async function signedMap(values) {
  const map = {}, paths = [...new Set(values.map(storagePath).filter(Boolean))];
  values.forEach(v => { if (v && !storagePath(v)) map[v] = v; });
  if (!paths.length) return map;
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600);
  if (error) { console.warn(error); return map; }
  const by = {}; (data || []).forEach(x => { if (x.signedUrl) by[x.path] = x.signedUrl; });
  values.forEach(v => { const p = storagePath(v); if (p && by[p]) map[v] = by[p]; });
  return map;
}
export async function galleryHTML(values) {
  if (!values.length) return '<div class="muted small">Sem fotos.</div>';
  const m = await signedMap(values);
  return `<div class="photos">${values.map(v => m[v]
    ? `<a class="photo" href="${esc(m[v])}" target="_blank" rel="noopener">${/\.pdf($|\?)/i.test(storagePath(v) || '') ? '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-weight:700">PDF</div>' : `<img src="${esc(m[v])}" alt="Foto">`}</a>`
    : '<div class="photo" title="Indisponível"></div>').join('')}</div>`;
}
