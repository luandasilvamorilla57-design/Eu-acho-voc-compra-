import { FileText, Images, Link2, ShoppingBag, Sparkles, Upload, WalletCards, X } from 'lucide-react'
import type { PreparedImage } from '../../utils/imageInput'

export type AdOrigin='olx'|'facebook'|'manual'

type P={
  origem:AdOrigin
  link:string
  texto:string
  preco:string
  images:PreparedImage[]
  imageBusy:boolean
  busy:boolean
  error:string
  setOrigem:(v:AdOrigin)=>void
  setLink:(v:string)=>void
  setTexto:(v:string)=>void
  setPreco:(v:string)=>void
  addImages:(files:FileList|null)=>void
  removeImage:(index:number)=>void
  analyze:()=>void
}

const origins=[
  {id:'olx' as const,label:'OLX',desc:'Cole o link do anúncio',icon:Link2},
  {id:'facebook' as const,label:'Facebook',desc:'Envie prints do Marketplace',icon:Images},
  {id:'manual' as const,label:'Outro',desc:'Cole os dados manualmente',icon:FileText},
]

export function AnalysisForm(p:P){
  return <section className="glass rounded-[26px] p-4 sm:p-6">
    <div className="mb-5">
      <span className="text-[9px] font-bold uppercase tracking-[.2em] text-slate-500">ORIGEM DO ANÚNCIO</span>
      <h3 className="font-display mt-1 text-lg font-bold">De onde vem esta oportunidade?</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">O Radar adapta a forma de leitura para cada plataforma.</p>
    </div>

    <div className="grid grid-cols-3 gap-2">
      {origins.map(({id,label,desc,icon:Icon})=>{
        const active=p.origem===id
        return <button
          key={id}
          type="button"
          onClick={()=>p.setOrigem(id)}
          className={`relative min-h-[96px] rounded-[20px] border p-3 text-left transition sm:min-h-[104px] sm:p-4 ${active?'border-emerald-400/35 bg-emerald-400/[.08] shadow-[0_14px_40px_rgba(16,185,129,.08)]':'border-slate-800 bg-slate-950/30 hover:border-slate-700'}`}
        >
          <span className={`grid h-8 w-8 place-items-center rounded-xl ${active?'bg-emerald-400/12 text-emerald-300':'bg-slate-800/70 text-slate-500'}`}><Icon size={16}/></span>
          <strong className="mt-3 block text-xs text-white">{label}</strong>
          <span className="mt-1 hidden text-[9px] leading-4 text-slate-500 sm:block">{desc}</span>
        </button>
      })}
    </div>

    <div className="mt-5 grid gap-4">
      {p.origem==='olx'&&<>
        <div className="rounded-[18px] border border-blue-400/10 bg-blue-400/[.045] p-3 text-[10px] leading-5 text-slate-400">
          <b className="text-blue-300">OLX:</b> cole o link público. O Radar tenta ler o anúncio diretamente.
        </div>
        <label className="text-xs font-semibold text-slate-400">
          Link do anúncio
          <div className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 focus-within:border-emerald-400/25">
            <Link2 size={16} className="text-slate-600"/>
            <input value={p.link} onChange={e=>p.setLink(e.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="https://www.olx.com.br/..." />
          </div>
        </label>
        <OptionalText p={p}/>
      </>}

      {p.origem==='facebook'&&<>
        <div className="rounded-[18px] border border-emerald-400/10 bg-emerald-400/[.045] p-3 text-[10px] leading-5 text-slate-400">
          <b className="text-emerald-300">Facebook Marketplace:</b> envie prints mostrando fotos do produto, título, preço e descrição. Você pode selecionar vários de uma vez.
        </div>

        <label className="group relative grid min-h-[168px] cursor-pointer place-items-center overflow-hidden rounded-[22px] border border-dashed border-slate-700 bg-slate-950/35 p-5 text-center transition hover:border-emerald-400/35 hover:bg-emerald-400/[.025]">
          <input
            type="file"
            accept="image/*"
            multiple
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={e=>{p.addImages(e.target.files);e.currentTarget.value=''}}
          />
          <div>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><Upload size={21}/></span>
            <strong className="mt-3 block text-sm">{p.imageBusy?'Preparando prints...':'Enviar prints do anúncio'}</strong>
            <span className="mt-1 block text-[10px] leading-5 text-slate-500">Até 6 imagens · a ferramenta comprime antes de enviar</span>
          </div>
        </label>

        {p.images.length>0&&<div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {p.images.map((image,index)=><div key={image.preview} className="relative aspect-[4/5] overflow-hidden rounded-[16px] border border-slate-800 bg-slate-950">
            <img src={image.preview} alt={`Print ${index+1}`} className="h-full w-full object-cover"/>
            <button type="button" onClick={()=>p.removeImage(index)} className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/75 text-white backdrop-blur"><X size={13}/></button>
            <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/70 px-2 py-1 text-[8px] text-white">{index+1}</span>
          </div>)}
        </div>}

        <label className="text-xs font-semibold text-slate-400">
          Informação extra <span className="font-normal text-slate-600">(opcional)</span>
          <textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm leading-6 outline-none focus:border-emerald-400/25" placeholder="Ex.: vendedor disse que a bateria foi trocada, aceita troca..." />
        </label>
      </>}

      {p.origem==='manual'&&<>
        <div className="rounded-[18px] border border-slate-700/60 bg-slate-900/30 p-3 text-[10px] leading-5 text-slate-400">
          Use para outros sites, grupos, WhatsApp ou anúncios que você recebeu por mensagem.
        </div>
        <label className="text-xs font-semibold text-slate-400">
          Dados do anúncio
          <textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="mt-2 min-h-36 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm leading-6 outline-none focus:border-emerald-400/25" placeholder="Cole título, descrição, estado do produto, acessórios e outras informações..." />
        </label>
      </>}

      <label className="text-xs font-semibold text-slate-400">
        Preço anunciado <span className="font-normal text-slate-600">(se estiver visível nos prints, pode deixar vazio)</span>
        <div className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 focus-within:border-emerald-400/25">
          <WalletCards size={16} className="text-slate-600"/>
          <input inputMode="decimal" value={p.preco} onChange={e=>p.setPreco(e.target.value.replace(',','.'))} className="w-full bg-transparent text-sm outline-none" placeholder="Ex.: 1500" />
        </div>
      </label>

      {p.error&&<div className="rounded-xl border border-red-400/15 bg-red-400/5 p-3 text-xs leading-5 text-red-300">{p.error}</div>}

      <button disabled={p.busy||p.imageBusy} onClick={p.analyze} className="flex h-[52px] items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-emerald-400 to-cyan-400 font-bold text-slate-950 shadow-[0_16px_42px_rgba(45,212,165,.13)] disabled:opacity-50">
        <Sparkles size={17}/>{p.busy?'Radar analisando...':p.imageBusy?'Preparando imagens...':'Analisar oportunidade'}
      </button>
    </div>
  </section>
}

function OptionalText({p}:{p:P}){
  return <label className="text-xs font-semibold text-slate-400">
    Texto complementar <span className="font-normal text-slate-600">(opcional)</span>
    <textarea value={p.texto} onChange={e=>p.setTexto(e.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-sm leading-6 outline-none focus:border-emerald-400/25" placeholder="Se quiser, cole também a descrição do anúncio para aumentar a precisão." />
  </label>
}
