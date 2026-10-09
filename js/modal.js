const Modal = {
  el:null,
  _build(){
    if(this.el) return;
    var o=document.createElement('div');
    o.className='modal-overlay';
    o.innerHTML='<div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><div class="modal-head"><div><div class="modal-title" id="modalTitle"></div><div class="modal-sub" id="modalSub"></div></div><button class="modal-x" aria-label="Cerrar"><i class="ti ti-x"></i></button></div><div class="modal-body" id="modalBody"></div></div>';
    document.body.appendChild(o);
    this.el=o;
    var self=this;
    o.addEventListener('click',function(e){ if(e.target===o) self.close(); });
    o.querySelector('.modal-x').addEventListener('click',function(){ self.close(); });
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&o.classList.contains('open')) self.close(); });
  },
  open(opts){
    this._build(); this.owner=opts.owner||null;
    this.el.querySelector('#modalTitle').textContent=opts.title||'';
    this.el.querySelector('#modalSub').textContent=opts.subtitle||'';
    var body=this.el.querySelector('#modalBody');
    body.innerHTML='';
    if(typeof opts.render==='function') opts.render(body);
    document.body.style.overflow='hidden';
    var el=this.el;
    requestAnimationFrame(function(){ el.classList.add('open'); });
  },
  close(){
    if(!this.el) return;
    var closedOwner=this.owner; this.owner=null;
    this.el.classList.remove('open');
    document.body.style.overflow='';
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    document.dispatchEvent(new CustomEvent('modal:closed',{detail:{owner:closedOwner}}));
  }
};
