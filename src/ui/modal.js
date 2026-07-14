export function closeModal(){document.getElementById('modalRoot').innerHTML=''}
export function modal(content){document.getElementById('modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><div class="modal-head"><span></span><button class="btn light" id="modalClose" type="button">X</button></div>${content}</div></div>`;document.getElementById('modalClose').onclick=closeModal;}
