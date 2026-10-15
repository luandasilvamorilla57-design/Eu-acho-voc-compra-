(function(){
  try{
    var saved=localStorage.getItem('controle-plus-theme');
    var theme=saved==='light'||saved==='dark'?saved:(matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
    document.documentElement.dataset.theme=theme;
    document.querySelector('meta[name="theme-color"]').setAttribute('content',theme==='light'?'#f3f7fc':'#07111f');
  }catch(e){}
})();
