import { useEffect,useMemo,useRef,useState } from 'react'
import {
  ArrowLeft,ArrowRight,Check,CheckCircle2,Clipboard,Clock3,Copy,
  ImagePlus,MessageCircle,RefreshCw,Send,ShieldCheck,Sparkles,
  Target,Upload,X,XCircle
} from 'lucide-react'
import { useNegotiationAssistant,type NegotiationAssistantOutput } from '../hooks/useNegotiationAssistant'
import type { AssistedNegotiationRow } from '../types/database'
import { money,pct } from '../utils/format'
import { prepareScreenshots,revokePreviews,type PreparedImage } from '../utils/imageInput'

type Props={onBack:()=>void;onUsageChanged?:()=>void|Promise<void>}

function asArray(value:any){return Array.isArray(value)?value:[]}
function strategyOf(session:AssistedNegotiationRow|null){return (session?.estrategia_atual||{}) as unknown as NegotiationAssistantOutput}
function resultOf(session:AssistedNegotiationRow|null){return (session?.resultado||{}) as any}

export function NegotiationAssistantPage({onBack,onUsageChanged}:Props){
  const {sessions,loading,busy,error,setError,start,reply,noReply,finish}=useNegotiationAssistant(true)
  const [selected,setSelected]=useState<AssistedNegotiationRow|null>(null)
  const [startImages,setStartImages]=useState<PreparedImage[]>([])
  const [replyImages,setReplyImages]=useState<PreparedImage[]>([])
  const startImagesRef=useRef<PreparedImage[]>([])
  const replyImagesRef=useRef<PreparedImage[]>([])
  const [askingPrice,setAskingPrice]=useState('')
  const [startNote,setStartNote]=useState('')
  const [sellerText,setSellerText]=useState('')
  const [replyNote,setReplyNote]=useState('')
  const [copied,setCopied]=useState('')
  const [finishMode,setFinishMode]=useState<'bought'|'failed'|null>(null)
  const [finalPrice,setFinalPrice]=useState('')
  const [finishReason,setFinishReason]=useState('')

  useEffect(()=>{startImagesRef.current=startImages},[startImages])
  useEffect(()=>{replyImagesRef.current=replyImages},[replyImages])
  useEffect(()=>()=>{revokePreviews(startImagesRef.current);revokePreviews(replyImagesRef.current)},[])

  useEffect(()=>{
    if(!selected)return
    const fresh=sessions.find(item=>item.id===selected.id)
    if(fresh)setSelected(fresh)
  },[sessions,selected?.id])

  const activeSessions=useMemo(()=>sessions.filter(item=>item.status==='ativa'),[sessions])
  const recentClosed=useMemo(()=>sessions.filter(item=>item.status!=='ativa').slice(0,5),[sessions])
  const strategy=strategyOf(selected)
  const result=resultOf(selected)
  const conversation=asArray(selected?.conversa)

  const replaceStartImages=async(files:FileList|null)=>{
    if(!files?.length)return
    try{
      const prepared=(await prepareScreenshots(files)).slice(0,3)
      revokePreviews(startImagesRef.current)
      setStartImages(prepared)
      setError('')
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar as imagens.')}
  }

  const replaceReplyImages=async(files:FileList|null)=>{
    if(!files?.length)return
    try{
      const prepared=(await prepareScreenshots(files)).slice(0,3)
      revokePreviews(replyImagesRef.current)
      setReplyImages(prepared)
      setError('')
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar o print.')}
  }

  const begin=async()=>{
    if(!startImages.length){setError('Envie um print do anúncio ou uma foto do produto.');return}
    const value=Number(askingPrice.replace(',','.'))||0
    try{
      const data=await start({
        askingPrice:value,
        note:startNote,
        images:startImages.map(({mime_type,data,name})=>({mime_type,data,name}))
      })
      revokePreviews(startImagesRef.current)
      setStartImages([])
      setAskingPrice('')
      setStartNote('')
      setSelected(data.session)
      void onUsageChanged?.()
    }catch{}
  }

  const sendSellerReply=async()=>{
    if(!selected)return
    if(!sellerText.trim()&&!replyImages.length){setError('Cole o que o vendedor respondeu ou envie um print da conversa.');return}
    try{
      const data=await reply(selected.id,{
        sellerText,
        note:replyNote,
        images:replyImages.map(({mime_type,data,name})=>({mime_type,data,name}))
      })
      revokePreviews(replyImagesRef.current)
      setReplyImages([])
      setSellerText('')
      setReplyNote('')
      setSelected(data.session)
    }catch{}
  }

  const sendNoReply=async()=>{
    if(!selected)return
    try{
      const data=await noReply(selected.id)
      setSelected(data.session)
    }catch{}
  }

  const copyMessage=async(text:string,id:string)=>{
    try{
      await navigator.clipboard.writeText(text)
      setCopied(id)
      window.setTimeout(()=>setCopied(current=>current===id?'':current),1700)
    }catch{setError('Não consegui copiar automaticamente. Pressione e segure a mensagem para copiar.')}
  }

  const closeNegotiation=async()=>{
    if(!selected||!finishMode)return
    const value=finishMode==='bought'?(Number(finalPrice.replace(',','.'))||0):0
    if(finishMode==='bought'&&value<=0){setError('Informe quanto você realmente pagou.');return}
    try{
      const data=await finish(selected.id,finishMode,value,finishReason)
      setSelected(data.session)
      setFinishMode(null)
      setFinalPrice('')
      setFinishReason('')
    }catch{}
  }

  const newNegotiation=()=>{
    setSelected(null)
    setFinishMode(null)
    setError('')
  }

  if(selected){
    const ended=selected.status!=='ativa'
    return <div className="negotiation-page">
      <section className="negotiation-workspace">
        <header className="negotiation-workspace__head">
          <button type="button" className="negotiation-back" onClick={newNegotiation}><ArrowLeft size={16}/> Negociações</button>
          <div className="negotiation-live"><i/>{ended?'ENCERRADA':'RADAR NEGOCIANDO'}</div>
        </header>

        <div className="negotiation-product">
          <div>
            <span className="negotiation-kicker">PRODUTO IDENTIFICADO</span>
            <h2>{selected.produto}</h2>
            <p>{[selected.marca,selected.modelo,selected.categoria].filter(Boolean).join(' · ')||'Produto usado'}</p>
          </div>
          <div className="negotiation-product__price">
            <span>PREÇO PEDIDO</span>
            <strong>{money(selected.preco_pedido)}</strong>
          </div>
        </div>

        {!ended&&strategy?.objetivo_atual&&<div className="negotiation-strategy">
          <span className="negotiation-strategy__icon"><Target size={19}/></span>
          <div>
            <small>OBJETIVO DESTA RODADA</small>
            <strong>{strategy.objetivo_atual}</strong>
            <p>{strategy.justificativa_estrategia}</p>
          </div>
          <span className={'negotiation-offer-state '+(strategy.nao_ofertar_ainda?'is-wait':'is-ready')}>
            {strategy.nao_ofertar_ainda?'SEM OFERTA AGORA':strategy.oferta_sugerida>0?money(strategy.oferta_sugerida):'AVANÇAR'}
          </span>
        </div>}

        <div className="negotiation-chat">
          {conversation.map((entry:any,index:number)=>{
            const role=entry?.role||'event'
            const text=String(entry?.text||'').trim()
            if(!text)return null
            const id=`${selected.id}-${index}`
            if(role==='radar')return <article key={id} className="negotiation-message negotiation-message--radar">
              <div className="negotiation-message__meta"><span><Sparkles size={12}/> RADAR · MENSAGEM PARA ENVIAR</span>{entry?.offer>0&&<b>{money(Number(entry.offer))}</b>}</div>
              <p>{text}</p>
              <div className="negotiation-message__actions">
                <button type="button" onClick={()=>void copyMessage(text,id)}>{copied===id?<><Check size={14}/> Copiado</>:<><Copy size={14}/> Copiar mensagem</>}</button>
              </div>
            </article>
            if(role==='seller')return <article key={id} className="negotiation-message negotiation-message--seller">
              <div className="negotiation-message__meta"><span><MessageCircle size={12}/> VENDEDOR</span></div>
              <p>{text}</p>
            </article>
            return <div key={id} className="negotiation-event"><Clock3 size={12}/>{text}</div>
          })}
        </div>

        {!ended&&<>
          {strategy?.encerrar_negociacao&&<div className="negotiation-warning">
            <XCircle size={18}/><div><strong>O Radar recomenda não forçar essa compra.</strong><p>{strategy.motivo_encerrar}</p></div>
          </div>}

          <section className="negotiation-reply-box">
            <div className="negotiation-reply-box__head">
              <div><span>CONTINUE A CONVERSA</span><strong>O que o vendedor respondeu?</strong></div>
              <small>{selected.turn_count}/10 rodadas</small>
            </div>

            <textarea value={sellerText} onChange={e=>setSellerText(e.target.value)} placeholder="Cole aqui exatamente o que o vendedor falou…"/>

            <div className="negotiation-upload-row">
              <label className="negotiation-upload">
                <input type="file" accept="image/*" multiple onChange={e=>void replaceReplyImages(e.target.files)}/>
                <ImagePlus size={16}/><span>{replyImages.length?replyImages.length+' print(s) pronto(s)':'Enviar print da conversa'}</span>
              </label>
              {replyImages.length>0&&<button type="button" className="negotiation-clear" onClick={()=>{revokePreviews(replyImagesRef.current);setReplyImages([])}}><X size={14}/> Limpar</button>}
            </div>

            {replyImages.length>0&&<div className="negotiation-thumbs">{replyImages.map(image=><img key={image.preview} src={image.preview} alt="Print da conversa"/>)}</div>}

            <label className="negotiation-context-note">
              <span>Algo que o Radar precisa saber? <small>opcional</small></span>
              <input value={replyNote} onChange={e=>setReplyNote(e.target.value)} placeholder="Ex.: consigo buscar hoje, fica a 10 km…"/>
            </label>

            {error&&<div className="negotiation-error">{error}</div>}

            <button type="button" className="negotiation-send" onClick={()=>void sendSellerReply()} disabled={busy}>
              {busy?<><RefreshCw className="negotiation-spin" size={17}/> Pensando na melhor resposta…</>:<><Send size={17}/> Responder vendedor com o Radar</>}
            </button>

            <button type="button" className="negotiation-no-reply" onClick={()=>void sendNoReply()} disabled={busy}>
              O vendedor não respondeu · criar um follow-up leve
            </button>
          </section>

          <section className="negotiation-outcome">
            <div>
              <span>JÁ SABE COMO TERMINOU?</span>
              <strong>Registre o resultado da negociação.</strong>
            </div>
            <div className="negotiation-outcome__actions">
              <button type="button" className="is-success" onClick={()=>setFinishMode('bought')}><CheckCircle2 size={17}/> Deu certo</button>
              <button type="button" className="is-failed" onClick={()=>setFinishMode('failed')}><XCircle size={17}/> Não fechou</button>
            </div>
          </section>
        </>}

        {ended&&<section className={'negotiation-result '+(selected.status==='comprado'?'is-success':'is-failed')}>
          {selected.status==='comprado'?<CheckCircle2 size={23}/>:<XCircle size={23}/>}
          <div>
            <span>{selected.status==='comprado'?'NEGOCIAÇÃO FECHADA':'NEGOCIAÇÃO ENCERRADA'}</span>
            <h3>{selected.status==='comprado'?'Compra concluída.':'Esse negócio não fechou.'}</h3>
            {selected.status==='comprado'&&<div className="negotiation-result__numbers">
              <span><small>Pedido</small><b>{money(selected.preco_pedido)}</b></span>
              <span><small>Pago</small><b>{money(selected.preco_final)}</b></span>
              <span><small>Economia</small><b>{money(Number(result?.saved_amount||0))}</b></span>
              <span><small>Desconto</small><b>{pct(Number(result?.discount_percent||0))}</b></span>
            </div>}
            {result?.reason&&<p>{result.reason}</p>}
          </div>
          <button type="button" onClick={newNegotiation}>Nova negociação <ArrowRight size={14}/></button>
        </section>}
      </section>

      {finishMode&&<div className="negotiation-finish-modal">
        <button className="negotiation-finish-modal__backdrop" onClick={()=>setFinishMode(null)} aria-label="Fechar"/>
        <div className="negotiation-finish-modal__card">
          <button className="negotiation-finish-modal__close" onClick={()=>setFinishMode(null)}><X size={16}/></button>
          <span>{finishMode==='bought'?'DEU CERTO':'NÃO FECHOU'}</span>
          <h3>{finishMode==='bought'?'Quanto você pagou?':'O que travou a negociação?'}</h3>
          {finishMode==='bought'&&<label>Valor final<div><span>R$</span><input autoFocus inputMode="decimal" value={finalPrice} onChange={e=>setFinalPrice(e.target.value)} placeholder="0,00"/></div></label>}
          <label>{finishMode==='bought'?'Observação (opcional)':'Motivo (opcional)'}<textarea value={finishReason} onChange={e=>setFinishReason(e.target.value)} placeholder={finishMode==='bought'?'Ex.: vendedor aceitou após testar e retirar hoje.':'Ex.: vendedor não baixou, produto tinha defeito, desistiu…'}/></label>
          {error&&<div className="negotiation-error">{error}</div>}
          <button type="button" className={finishMode==='bought'?'is-success':'is-failed'} onClick={()=>void closeNegotiation()} disabled={busy}>{busy?'Salvando…':finishMode==='bought'?'Confirmar compra':'Encerrar negociação'}</button>
        </div>
      </div>}
    </div>
  }

  return <div className="negotiation-page">
    <section className="negotiation-hero">
      <button type="button" className="negotiation-back" onClick={onBack}><ArrowLeft size={16}/> Central de Ação</button>
      <div className="negotiation-hero__grid">
        <div>
          <span className="negotiation-kicker"><i/> ASSISTENTE DE NEGOCIAÇÃO</span>
          <h1>Não sabe <em>negociar?</em></h1>
          <p>Envie o anúncio ou uma foto do produto. O Radar identifica o que está sendo vendido, entende os pontos que realmente importam e monta uma conversa natural para descobrir condição, defeitos e espaço de preço antes de falar em oferta.</p>
          <div className="negotiation-hero__trust">
            <span><ShieldCheck size={14}/> sem inventar defeitos</span>
            <span><MessageCircle size={14}/> conversa curta e humana</span>
            <span><Target size={14}/> desconto baseado em fatos</span>
          </div>
        </div>
        <div className="negotiation-hero__visual" aria-hidden="true">
          <div className="negotiation-orbit"><span/><span/><span/><i/></div>
          <div className="negotiation-bubble negotiation-bubble--one">Ainda está disponível?</div>
          <div className="negotiation-bubble negotiation-bubble--two">Tem algum detalhe ou defeito?</div>
          <div className="negotiation-bubble negotiation-bubble--three">Consegue mandar um vídeo funcionando?</div>
        </div>
      </div>
    </section>

    <div className="negotiation-start-layout">
      <section className="negotiation-start-card">
        <div className="negotiation-start-card__head">
          <div><span>COMECE POR AQUI</span><h2>Mostre o produto para o Radar.</h2><p>Se o preço estiver visível no print, pode deixar o campo de valor vazio. Se for só uma foto do produto, informe quanto o vendedor está pedindo.</p></div>
          <span className="negotiation-step">01</span>
        </div>

        <label className="negotiation-dropzone">
          <input type="file" accept="image/*" multiple onChange={e=>void replaceStartImages(e.target.files)}/>
          <span className="negotiation-dropzone__icon"><Upload size={21}/></span>
          <strong>{startImages.length?'Imagens prontas para análise':'Print do anúncio ou foto do produto'}</strong>
          <p>Até 3 imagens · o Radar lê produto, detalhes e preço visível.</p>
        </label>

        {startImages.length>0&&<div className="negotiation-thumbs negotiation-thumbs--start">{startImages.map((image,index)=><div key={image.preview}><img src={image.preview} alt={`Imagem ${index+1}`}/><span>{index+1}</span></div>)}</div>}

        <label className="negotiation-field">
          <span>Quanto o vendedor está pedindo? <small>opcional se estiver no print</small></span>
          <div className="negotiation-money"><b>R$</b><input inputMode="decimal" value={askingPrice} onChange={e=>setAskingPrice(e.target.value)} placeholder="Ex.: 850"/></div>
        </label>

        <label className="negotiation-field">
          <span>Contexto extra <small>opcional</small></span>
          <textarea value={startNote} onChange={e=>setStartNote(e.target.value)} placeholder="Ex.: vendedor fica perto, consigo buscar hoje, anúncio está há alguns dias…"/>
        </label>

        <div className="negotiation-principle">
          <ShieldCheck size={17}/><p>O Radar não inventa uma história de “uso próprio”. Ele simplesmente não expõe sua estratégia de revenda sem necessidade e nunca usa defeitos que o vendedor não confirmou.</p>
        </div>

        {error&&<div className="negotiation-error">{error}</div>}

        <button type="button" className="negotiation-start-cta" onClick={()=>void begin()} disabled={busy}>
          {busy?<><RefreshCw className="negotiation-spin" size={18}/> Lendo produto e preparando abordagem…</>:<><Sparkles size={18}/> Montar primeira abordagem <ArrowRight size={16}/></>}
        </button>
      </section>

      <aside className="negotiation-resume">
        <div className="negotiation-resume__head"><div><span>SUAS CONVERSAS</span><strong>Retome de onde parou.</strong></div>{loading&&<RefreshCw className="negotiation-spin" size={16}/>}</div>

        {activeSessions.length?activeSessions.slice(0,6).map(item=><button type="button" key={item.id} className="negotiation-session-card" onClick={()=>setSelected(item)}>
          <div><span className="negotiation-session-card__status"><i/> EM NEGOCIAÇÃO</span><strong>{item.produto}</strong><small>{item.categoria||'Produto usado'} · {money(item.preco_pedido)}</small></div>
          <ArrowRight size={16}/>
        </button>):<div className="negotiation-empty"><MessageCircle size={22}/><strong>Nenhuma negociação aberta.</strong><p>Quando você iniciar uma conversa, ela fica salva aqui para continuar depois.</p></div>}

        {recentClosed.length>0&&<div className="negotiation-recent">
          <span>ÚLTIMAS ENCERRADAS</span>
          {recentClosed.map(item=><button type="button" key={item.id} onClick={()=>setSelected(item)}><div><strong>{item.produto}</strong><small>{item.status==='comprado'?'Comprado':'Não fechou'}</small></div><b>{item.status==='comprado'?money(item.preco_final):'—'}</b></button>)}
        </div>}
      </aside>
    </div>
  </div>
}
