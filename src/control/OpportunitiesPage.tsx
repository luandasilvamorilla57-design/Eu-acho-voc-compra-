import {useCallback,useEffect,useMemo,useState} from 'react'
import {createPortal} from 'react-dom'
import {
 ArrowLeft,ArrowRight,Check,ChevronRight,ExternalLink,ImagePlus,Info,Package,
 Pencil,Plus,Search,ShieldCheck,ShoppingBag,Sparkles,Tag,Trash2,TrendingUp,
 UploadCloud,X
} from 'lucide-react'
import {supabase} from '../lib/supabase'
import './opportunities.css'

const db=supabase as any
const BUCKET='control-opportunity-images'

type Opportunity={
 id:string
 title:string
 description:string
 reason:string
 category:string
 badge:string
 investment:string
 image_url:string
 shop_url:string
 sort_order:number
 is_active:boolean
 created_at:string
}
type EditForm=Pick<Opportunity,'title'|'description'|'reason'|'category'|'badge'|'investment'|'shop_url'|'sort_order'|'is_active'|'image_url'>
const categories=['Todos','Ferramentas','Eletrônicos','Casa e cozinha','Moda','Outros']
const tags=['Bom para começar','Potencial de revenda','Útil no dia a dia','Para anunciar em kit','Baixo investimento','Sazonal','Boa opção']

function emptyForm(position:number):EditForm{
 return {title:'',description:'',reason:'',category:'Outros',badge:'Boa opção',investment:'Confira o preço atual',shop_url:'',image_url:'',sort_order:position,is_active:true}
}
function validShopLink(input:string){
 try{
  const url=new URL(input.trim())
  return url.protocol==='https:'&&(url.hostname==='tiktok.com'||url.hostname.endsWith('.tiktok.com'))
 }catch{return false}
}
function getImage(image:string){
 if(image.startsWith('/')&&!image.startsWith('//'))return image
 try{
  const src=new URL(image)
  if(src.protocol==='https:'&&src.hostname==='nnkwjqscmwfxxmpasvqq.supabase.co'&&src.pathname.includes('/control-opportunity-images/'))return image
 }catch{}
 return ''
}

export function OpportunitiesPage({isAdmin,onBack}:{isAdmin:boolean;onBack:()=>void}){
 const [items,setItems]=useState<Opportunity[]>([])
 const [loading,setLoading]=useState(true)
 const [error,setError]=useState('')
 const [filter,setFilter]=useState('Todos')
 const [search,setSearch]=useState('')
 const [selected,setSelected]=useState<Opportunity|null>(null)
 const [editor,setEditor]=useState(false)
 const [editing,setEditing]=useState<Opportunity|null>(null)
 const [form,setForm]=useState<EditForm>(emptyForm(10))
 const [photo,setPhoto]=useState<File|null>(null)
 const [saving,setSaving]=useState(false)
 const [confirmDelete,setConfirmDelete]=useState<Opportunity|null>(null)
 const [message,setMessage]=useState('')

 const load=useCallback(async()=>{
  setError('')
  const result=await db.from('control_opportunities').select('*').order('sort_order',{ascending:true}).order('created_at',{ascending:true})
  if(result.error){setError('Não conseguimos carregar as indicações. Tente novamente.');setLoading(false);return}
  setItems((result.data||[]) as Opportunity[])
  setLoading(false)
 },[])
 useEffect(()=>{void load()},[load])
 // Impede rolagem do painel atrás do modal enquanto ele estiver aberto.
 const dialogOpen=Boolean(selected||editor||confirmDelete)
 useEffect(()=>{
  if(!dialogOpen)return
  const previous=document.body.style.overflow
  document.body.style.overflow='hidden'
  return ()=>{document.body.style.overflow=previous}
 },[dialogOpen])

 const active=useMemo(()=>items.filter(item=>item.is_active||isAdmin),[items,isAdmin])
 const filtered=useMemo(()=>active.filter(item=>
  (filter==='Todos'||item.category===filter)
  &&(!search||[item.title,item.description,item.category].join(' ').toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
 ),[active,filter,search])
 const visibleCategories=useMemo(()=>['Todos',...Array.from(new Set(active.map(item=>item.category)))],[active])

 function openEditor(item?:Opportunity){
  setEditing(item||null)
  setForm(item?{
   title:item.title,description:item.description,reason:item.reason,
   category:item.category,badge:item.badge,investment:item.investment,
   shop_url:item.shop_url,image_url:item.image_url,
   sort_order:item.sort_order,is_active:item.is_active
  }:emptyForm(Math.max(0,...items.map(p=>p.sort_order))+10))
  setPhoto(null)
  setError('')
  setEditor(true)
 }

 async function saveItem(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault()
  if(!isAdmin||saving)return
  if(!form.title.trim()||!form.description.trim()||!form.reason.trim()){setError('Preencha o nome, a descrição e o motivo da indicação.');return}
  if(!validShopLink(form.shop_url)){setError('Use um link HTTPS válido do TikTok Shop.');return}
  if(!editing&&!photo){setError('Adicione uma foto do produto.');return}
  if(photo&&(!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>6*1024*1024)){setError('Use JPG, PNG ou WebP de até 6 MB.');return}
  setSaving(true);setError('')
  let imageUrl=form.image_url
  let uploadedPath=''
  try{
   if(photo){
    const ext=photo.type==='image/png'?'png':photo.type==='image/webp'?'webp':'jpg'
    const path='catalogo/'+crypto.randomUUID()+'.'+ext
    const upload=await supabase.storage.from(BUCKET).upload(path,photo,{contentType:photo.type,cacheControl:'3600',upsert:false})
    if(upload.error)throw upload.error
    uploadedPath=path
    imageUrl=supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
   }
   const payload={
    title:form.title.trim(),description:form.description.trim(),reason:form.reason.trim(),
    category:form.category.trim()||'Outros',badge:form.badge.trim()||'Boa opção',
    investment:form.investment.trim()||'Confira o preço atual',
    image_url:imageUrl,shop_url:form.shop_url.trim(),sort_order:Number(form.sort_order)||0,
    is_active:form.is_active,updated_at:new Date().toISOString()
   }
   const result=editing
    ?await db.from('control_opportunities').update(payload).eq('id',editing.id).select('id').single()
    :await db.from('control_opportunities').insert(payload).select('id').single()
   if(result.error)throw result.error
   setEditor(false);setPhoto(null);setEditing(null)
   setMessage(editing?'Indicação atualizada para todos.':'Nova indicação publicada para todos.')
   await load()
  }catch(err:any){
   setError(err?.code==='23505'?'Este link já está cadastrado.':err?.message||'Erro ao salvar o produto.')
   if(uploadedPath)void supabase.storage.from(BUCKET).remove([uploadedPath])
  }finally{setSaving(false)}
 }

 async function deleteItem(){
  if(!isAdmin||!confirmDelete||saving)return
  setSaving(true);setError('')
  const result=await db.from('control_opportunities').delete().eq('id',confirmDelete.id).select('id').single()
  if(result.error){
   setError('Não foi possível excluir: '+result.error.message)
   setSaving(false);return
  }
  setConfirmDelete(null);setSelected(null);setMessage('Indicação excluída do catálogo.');setSaving(false)
  await load()
 }

 return <div className="cp-opp-page cp-page">
  <header className="cp-opp-header">
   <button type="button" className="cp-opp-back" onClick={onBack}><ArrowLeft size={19}/> Voltar</button>
   <span className="cp-opp-eyebrow"><Sparkles size={16}/> CURADORIA CONTROLE+</span>
   <h1>Oportunidades <em>para revender.</em></h1>
   <p>Quer começar com pouco ou encontrar ideias de mercadorias? Reunimos produtos para você avaliar, comparar preços e testar a procura na sua região.</p>
   {isAdmin&&<button type="button" className="cp-opp-new" onClick={()=>openEditor()}><Plus size={19}/> Adicionar indicação</button>}
  </header>

  <div className="cp-opp-summary">
   <div className="cp-opp-summary-mark"><TrendingUp size={25}/></div>
   <div><b>Escolha melhor. Compre com mais estratégia.</b><span>Confira custo total, qualidade, demanda e margem antes de investir.</span></div>
  </div>
  <div className="cp-opp-controls">
   <div className="cp-opp-search"><Search size={18}/><input aria-label="Buscar oportunidades" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar produtos..."/></div>
   <div className="cp-opp-filters" role="group" aria-label="Filtrar por categoria">
    {visibleCategories.map(cat=><button key={cat} type="button" className={filter===cat?'is-active':''} onClick={()=>setFilter(cat)}>{cat}</button>)}
   </div>
  </div>

  {message&&<p role="status" className="cp-opp-success"><Check size={15}/>{message}</p>}
  {error&&!editor&&!confirmDelete&&<div role="alert" className="cp-opp-alert">{error}<button onClick={()=>void load()}>Tentar novamente</button></div>}
  {loading?<div className="cp-opp-loading">Buscando recomendações...</div>:
  filtered.length===0?<div className="cp-opp-empty"><Package size={32}/><strong>Nenhuma indicação nessa categoria</strong><p>Tente outro filtro ou volte mais tarde.</p></div>:
  <div className="cp-opp-grid">
   {filtered.map(item=><article className="cp-opp-item" key={item.id}>
    <button className="cp-opp-product-open" type="button" onClick={()=>setSelected(item)} aria-label={'Ver detalhes de '+item.title}>
     <div className="cp-opp-photo">
      {getImage(item.image_url)?<img loading="lazy" src={getImage(item.image_url)} alt={item.title}/>:<span><ShoppingBag size={34}/></span>}
      <span className="cp-opp-badge"><Sparkles size={13}/>{item.badge}</span>
     </div>
     <div className="cp-opp-item-content">
      <span className="cp-opp-category">{item.category}</span>
      <h2>{item.title}</h2>
      <p>{item.description}</p>
      <div className="cp-opp-price-hint"><Tag size={15}/>{item.investment}</div>
      <span className="cp-opp-more">Por que indicamos <ChevronRight size={16}/></span>
      {!item.is_active&&<span className="cp-opp-hidden">Oculta dos usuários</span>}
     </div>
    </button>
    {isAdmin&&<div className="cp-opp-admin-row">
     <button type="button" onClick={()=>openEditor(item)}><Pencil size={15}/> Editar</button>
     <button type="button" className="danger" onClick={()=>{setError('');setConfirmDelete(item)}}><Trash2 size={15}/> Excluir</button>
    </div>}
   </article>)}
  </div>}
  <footer className="cp-opp-disclosure"><ShieldCheck size={17}/>
   <span>As indicações são sugestões de produtos, não garantia de vendas ou lucros. Alguns links são de afiliados: o CONTROLE+ pode receber comissão sem custo adicional para você.</span>
  </footer>

  {selected&&!editor&&!confirmDelete&&createPortal(<div className="cp-opp-modal-layer" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null)}}>
   <section className="cp-opp-modal" role="dialog" aria-modal="true" aria-labelledby="cp-opp-detail-title">
    <button type="button" className="cp-opp-x" onClick={()=>setSelected(null)} aria-label="Fechar"><X size={20}/></button>
    <div className="cp-opp-modal-picture">{getImage(selected.image_url)?<img src={getImage(selected.image_url)} alt={selected.title}/>:<ShoppingBag size={48}/>}</div>
    <span className="cp-opp-modal-tag">{selected.badge}</span>
    <h2 id="cp-opp-detail-title">{selected.title}</h2>
    <p>{selected.description}</p>
    <div className="cp-opp-why"><b><Info size={17}/> Por que o CONTROLE+ recomenda?</b><p>{selected.reason}</p></div>
    <div className="cp-opp-tip"><Tag size={16}/>{selected.investment}</div>
    <a className="cp-opp-external" href={selected.shop_url} target="_blank" rel="noopener noreferrer sponsored">Ver produto no TikTok Shop <ExternalLink size={18}/></a>
    <span className="cp-opp-modal-disclosure">Link de afiliado. Confira valores, disponibilidade e especificações na loja.</span>
   </section>
  </div>,document.body)}

  {editor&&isAdmin&&createPortal(<div className="cp-opp-modal-layer" role="presentation">
   <section className="cp-opp-modal cp-opp-edit" role="dialog" aria-modal="true" aria-labelledby="cp-opp-editor-title">
    <header className="cp-opp-edit-header">
     <div>
      <span className="cp-opp-eyebrow">PAINEL MASTER</span>
      <h2 id="cp-opp-editor-title">{editing?'Editar indicação':'Nova indicação'}</h2>
      <p>Você controla o que aparece na aba Oportunidades de todas as contas.</p>
     </div>
     <button type="button" className="cp-opp-edit-close" onClick={()=>{if(!saving){setEditor(false);setError('')}}} aria-label="Fechar"><X size={21}/></button>
    </header>
    <form onSubmit={e=>void saveItem(e)} className="cp-opp-form" id="cp-opp-edit-form">
     <div className="cp-opp-form-scroll">
     <label>Nome do produto<input maxLength={160} required value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))} placeholder="Ex.: Kit de cabos para iPhone"/></label>
     <label>Link do TikTok Shop<input type="url" required value={form.shop_url} onChange={e=>setForm(v=>({...v,shop_url:e.target.value}))} placeholder="https://vt.tiktok.com/..."/></label>
     <label>Foto do produto <span className="cp-opp-upload"><ImagePlus size={19}/>{photo?photo.name:editing?'Trocar a foto (opcional)':'Selecionar foto'}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setPhoto(e.target.files?.[0]||null)}/></span></label>
     {editing&&getImage(form.image_url)&&!photo&&<img className="cp-opp-current-photo" src={getImage(form.image_url)} alt="Foto atual"/>}
     <label>Descrição da oportunidade<textarea required rows={3} maxLength={1200} value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))} placeholder="Para quem esse produto é interessante?"/></label>
     <label>Motivo da indicação<textarea required rows={3} maxLength={800} value={form.reason} onChange={e=>setForm(v=>({...v,reason:e.target.value}))} placeholder="O que vale conferir antes de comprar?"/></label>
     <div className="cp-opp-form-grid">
      <label>Categoria<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value}))}>{categories.filter(x=>x!=='Todos').map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Selo<select value={form.badge} onChange={e=>setForm(v=>({...v,badge:e.target.value}))}>{Array.from(new Set([form.badge,...tags])).map(x=><option key={x}>{x}</option>)}</select></label>
     </div>
     <label>Nota de investimento<input maxLength={90} value={form.investment} onChange={e=>setForm(v=>({...v,investment:e.target.value}))} placeholder="Ex.: Comece com pouco"/></label>
     <div className="cp-opp-form-grid">
      <label>Ordem de exibição<input type="number" value={form.sort_order} onChange={e=>setForm(v=>({...v,sort_order:Number(e.target.value)}))}/></label>
      <label className="cp-opp-switch"><input type="checkbox" checked={form.is_active} onChange={e=>setForm(v=>({...v,is_active:e.target.checked}))}/> Publicar para todos</label>
     </div>
     </div>
     <div className="cp-opp-edit-footer">
      {error&&<p className="cp-opp-form-error" role="alert">{error}</p>}
      <button type="submit" className="cp-opp-save" disabled={saving}><UploadCloud size={19}/>{saving?'Salvando e enviando...':editing?'Salvar alterações':'Publicar indicação'}</button>
     </div>
    </form>
   </section>
  </div>,document.body)}

  {confirmDelete&&isAdmin&&createPortal(<div className="cp-opp-modal-layer" role="presentation">
   <section className="cp-opp-modal cp-opp-confirm" role="alertdialog" aria-modal="true" aria-labelledby="cp-opp-delete-title">
    <span className="cp-opp-delete-icon"><Trash2 size={25}/></span>
    <h2 id="cp-opp-delete-title">Excluir esta indicação?</h2>
    <p>O produto <b>{confirmDelete.title}</b> deixará de aparecer para todos os usuários. Essa ação não apaga produtos dos estoques pessoais.</p>
    {error&&<p className="cp-opp-form-error" role="alert">{error}</p>}
    <div className="cp-opp-confirm-actions"><button disabled={saving} onClick={()=>{setConfirmDelete(null);setError('')}}>Cancelar</button><button disabled={saving} className="cp-opp-danger" onClick={()=>void deleteItem()}>{saving?'Excluindo...':'Sim, excluir'}</button></div>
   </section>
  </div>,document.body)}
 </div>
}
