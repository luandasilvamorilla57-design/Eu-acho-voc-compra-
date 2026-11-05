(function(){
  try{
    // Uma migração única apresenta a nova identidade branca também a quem usava o tema escuro antigo.
    if(localStorage.getItem('controle-plus-reference-light-v1')!=='yes'){
      localStorage.setItem('controle-plus-theme','light');
      localStorage.setItem('controle-plus-reference-light-v1','yes');
    }
    var saved=localStorage.getItem('controle-plus-theme');
    var theme=saved==='dark'?'dark':'light';
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]').setAttribute('content',theme==='light'?'#ffffff':'#0b1512');
  }catch(e){}
})();
