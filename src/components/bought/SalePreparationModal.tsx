import { useEffect,useMemo,useState } from 'react'
import { AlertTriangle,ArrowLeft,ArrowRight,Box,Camera,Check,CheckCircle2,ClipboardList,Copy,Home,ImagePlus,PackageCheck,RefreshCw,Save,Sparkles,Upload,X } from 'lucide-react'
import type { AnaliseRow,PurchaseRow,ResaleDraftOrigin,ResaleDraftRow } from '../../types/database'
import type { PhotoAudit,ResaleAd } from '../../types/resale'
import type { SaveResaleDraftInput } from '../../hooks/useResaleDrafts'
import { supabase } from '../../lib/supabase'
import { money } from '../../utils/format'
import { purchaseTotalCost } from '../../utils/purchase'
import { prepareScreenshots,revokePreviews,type PreparedImage } from '../../utils/imageInput'
import { reportClientError } from '../../lib/errorReporter'

type Step='source'|'details'|'photos'|'result'

function parseAd(value:unknown):ResaleAd|null{
  if(!value||typeof value!=='object'||Array.isArray(value))return null
  const v=value as any
  return typeof v.titulo==='string'&&v.foto_auditoria?v as ResaleAd:null
}

export function SalePreparationModal({
  purchases,analyses,initialPurchase,initialDraft,onClose,onSaveDraft,onUpdateCopy
}:{
  purchases:PurchaseRow[]
  analyses:AnaliseRow[]
  initialPurchase?:PurchaseRow|null
  initialDraft?:ResaleDraftRow|null
  onClose:()=>void
  onSaveDraft:(input:SaveResaleDraftInput)=>Promise<ResaleDraftRow>
  onUpdateCopy:(id:string,title:string,description:string)=>Promise<void>
}){
  const initialSource:ResaleDraftOrigin|null=initialDraft?.origem_item??(initialPurchase?'radar':null)
  const [step,setStep]=useState<Step>(initialDraft?'result':initialPurchase?'photos':'source')
  const [source,setSource]=useState<ResaleDraftOrigin|null>(initialSource)
  const [purchaseId,setPurchaseId]=useState(initialDraft?.compra_id??initialPurchase?.id??'')
  const [query,setQuery]=useState('')
  const [product,setProduct]=useState(initialDraft?.produto??'')
  const [category,setCategory]=useState(initialDraft?.categoria??'')
  const [brand,setBrand]=useState(initialDraft?.marca??'')
  const [model,setModel]=useState(initialDraft?.modelo??'')
  const [condition,setCondition]=useState(initialDraft?.condicao??'')
  const [usageTime,setUsageTime]=useState(initialDraft?.tempo_uso??'')
  const [notes,setNotes]=useState(initialDraft?.observacoes??'')
  const [minPrice,setMinPrice]=useState(String(initialDraft?.preco_minimo??''))
  const [idealPrice,setIdealPrice]=useState(String(initialDraft?.preco_ideal??''))
  const [images,setImages]=useState<PreparedImage[]>([])
  const [ad,setAd]=useState<ResaleAd|null>(()=>parseAd(initialDraft?.resultado_ia))
  const [draftId,setDraftId]=useState(initialDraft?.id??'')
  const [title,setTitle]=useState(initialDraft?.titulo??parseAd(initialDraft?.resultado_ia)?.titulo??'')
  const [description,setDescription]=useState(initialDraft?.descricao??parseAd(initialDraft?.resultado_ia)?.descricao??'')
  const [preparing,setPreparing]=useState(false)
  const [busy,setBusy]=useState(false)
  const [savingText,setSavingText]=useState(false)
  const [copied,setCopied]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>()=>revokePreviews(images),[])

  const selectedPurchase=useMemo(()=>purchases.find(p=>p.id===purchaseId)??initialPurchase??null,[purchases,purchaseId,initialPurchase])
  const selectedAnalysis=useMemo(()=>selectedPurchase?.analise_id?analyses.find(a=>a.id===selectedPurchase.analise_id)??null:null,[selectedPurchase,analyses])
  const radarMeta=useMemo(()=>{
    const ai=selectedAnalysis?.analise_ia as any
    return{brand:ai?.marca||'',model:ai?.modelo||'',condition:ai?.condicao_estimada||''}
  },[selectedAnalysis])
  const filteredPurchases=useMemo(()=>purchases.filter(p=>p.produto.toLowerCase().includes(query.toLowerCase())).slice(0,12),[purchases,query])

  const chooseSource=(next:ResaleDraftOrigin)=>{setSource(next);setError('');setStep('details')}

  const continueDetails=()=>{
    setError('')
    if(source==='radar'&&!selectedPurchase){setError('Selecione um item registrado no Radar.');return}
    if(source==='externo'&&!product.trim()){setError('Informe qual produto você quer anunciar.');return}
    setStep('photos')
  }

  const addImages=async(files:FileList|null)=>{
    if(!files?.length)return
    const room=6-images.length
    if(room<=0){setError('Você já selecionou 6 fotos.');return}
    setPreparing(true);setError('')
    try{
      const prepared=await prepareScreenshots(Array.from(files).slice(0,room))
      setImages(current=>[...current,...prepared])
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível preparar as fotos.')}
    finally{setPreparing(false)}
  }

  const removeImage=(index:number)=>{
    setImages(current=>{
      const removed=current[index]
      if(removed)URL.revokeObjectURL(removed.preview)
      return current.filter((_,i)=>i!==index)
    })
  }

  const generate=async()=>{
    if(!source)return
    if(images.length===0){setError('Envie pelo menos uma foto que você pretende usar no anúncio.');return}
    const p=source==='radar'?selectedPurchase:null
    const finalProduct=p?.produto??product.trim()
    const finalCategory=p?.categoria??category.trim()||null
    const finalBrand=source==='radar'?radarMeta.brand:brand.trim()
    const finalModel=source==='radar'?radarMeta.model:model.trim()
    const finalCondition=source==='radar'?radarMeta.condition:condition.trim()
    const finalNotes=source==='radar'?[p?.observacoes,p?.custos_observacao].filter(Boolean).join(' · '):notes.trim()
    const finalMin=p?.preco_minimo_venda??Number(minPrice||0)||0
    const finalIdeal=source==='externo'?Number(idealPrice||0)||0:0

    setBusy(true);setError('')
    const {data,error:e}=await supabase.functions.invoke('gerar-anuncio',{body:{
      origem_item:source,
      produto:finalProduct,
      categoria:finalCategory,
      marca:finalBrand,
      modelo:finalModel,
      condicao:finalCondition,
      tempo_uso:source==='externo'?usageTime.trim():'',
      observacoes:finalNotes,
      custo_total:p?purchaseTotalCost(p):0,
      preco_minimo:finalMin,
      preco_ideal:finalIdeal,
      analise:selectedAnalysis?.analise_ia??null,
      imagens:images.map(({mime_type,data,name})=>({mime_type,data,name}))
    }})
    if(e){reportClientError(e,'sale-preparation.generate',{source});setError(e.message);setBusy(false);return}
    if(data?.error){setError(data.error);setBusy(false);return}

    const next=data.ad as ResaleAd
    setAd(next);setTitle(next.titulo);setDescription(next.descricao);setStep('result')
    try{
      const saved=await onSaveDraft({
        id:draftId||undefined,
        origin:source,
        purchaseId:p?.id??null,
        analysisId:selectedAnalysis?.id??null,
        product:finalProduct,
        category:finalCategory,
        brand:finalBrand||null,
        model:finalModel||null,
        condition:finalCondition||null,
        usageTime:source==='externo'?usageTime.trim()||null:null,
        notes:finalNotes||null,
        minPrice:finalMin||null,
        idealPrice:finalIdeal||null,
        images,
        ad:next
      })
      setDraftId(saved.id)
    }catch(err){
      reportClientError(err,'sale-preparation.save')
      setError('A análise foi gerada, mas houve um problema ao salvar o rascunho. Tente salvar novamente antes de fechar.')
    }
    setBusy(false)
  }

  const saveCopy=async()=>{
    if(!draftId||!ad)return
    setSavingText(true);setError('')
    try{
      await onUpdateCopy(draftId,title.trim(),description.trim())
      setAd({...ad,titulo:title.trim(),descricao:description.trim()})
    }catch(err){setError(err instanceof Error?err.message:'Não foi possível salvar as alterações.')}
    finally{setSavingText(false)}
  }

  const copy=async(key:string,text:string)=>{
    try{await navigator.clipboard.writeText(text);setCopied(key);setTimeout(()=>setCopied(''),1300)}
    catch{setError('Não foi possível copiar automaticamente. Selecione o texto e copie manualmente.')}
  }

  const back=()=>{
    setError('')
    if(step==='details')setStep('source')
    else if(step==='photos')setStep(source==='radar'&&initialPurchase?'source':'details')
    else if(step==='result')setStep('photos')
  }

  return <div className="sale-flow">
    <button className="sale-flow__backdrop" onClick={onClose} aria-label="Fechar"/>
    <div className="sale-flow__card">
      <header className="sale-flow__header">
        <div className="min-w-0"><span className="premium-eyebrow text-cyan-400">ANÚNCIO INTELIGENTE · PRO</span><h2 className="font-display">Preparar venda com IA</h2><p>Do item até o anúncio pronto, sem misturar compra com revenda.</p></div>
        <button onClick={onClose} className="sale-flow__close"><X size={18}/></button>
      </header>

      <Stepper step={step}/>

      <div className="sale-flow__body">
        {step==='source'&&<SourceStep onChoose={chooseSource}/>}

        {step==='details'&&source==='radar'&&<RadarItemStep purchases={filteredPurchases} query={query} setQuery={setQuery} selectedId={purchaseId} setSelectedId={setPurchaseId} onContinue={continueDetails}/>}
        {step==='details'&&source==='externo'&&<ExternalItemStep product={product} setProduct={setProduct} category={category} setCategory={setCategory} brand={brand} setBrand={setBrand} model={model} setModel={setModel} condition={condition} setCondition={setCondition} usageTime={usageTime} setUsageTime={setUsageTime} notes={notes} setNotes={setNotes} minPrice={minPrice} setMinPrice={setMinPrice} idealPrice={idealPrice} setIdealPrice={setIdealPrice} onContinue={continueDetails}/>}

        {step==='photos'&&<PhotosStep source={source!} product={selectedPurchase?.produto??product} images={images} preparing={preparing} addImages={addImages} removeImage={removeImage} onGenerate={generate} busy={busy}/>}

        {step==='result'&&ad&&<ResultStep ad={ad} title={title} setTitle={setTitle} description={description} setDescription={setDescription} onSaveText={saveCopy} savingText={savingText} copied={copied} onCopy={copy} onRecheck={()=>{revokePreviews(images);setImages([]);setStep('photos')}}/>}

        {error&&<div className="sale-flow__error">{error}</div>}
      </div>

      {step!=='source'&&<button type="button" onClick={back} className="sale-flow__back"><ArrowLeft size={15}/> Voltar</button>}
    </div>
  </div>
}

function Stepper({step}:{step:Step}){
  const order:Step[]=['source','details','photos','result']
  const current=order.indexOf(step)
  const labels=['Origem','Produto','Fotos','Resultado']
  return <div className="sale-stepper">{labels.map((label,i)=><div key={label} className={i===current?'is-current':i<current?'is-done':''}><span>{i<current?<Check size={12}/>:i+1}</span><b>{label}</b></div>)}</div>
}

function SourceStep({onChoose}:{onChoose:(s:ResaleDraftOrigin)=>void}){
  return <section className="sale-source-step">
    <div className="sale-flow__intro"><span>ETAPA 1</span><h3>De onde vem o item?</h3><p>Você não precisa ter comprado nada pelo Radar para usar o Anúncio Inteligente.</p></div>
    <div className="sale-source-grid">
      <button onClick={()=>onChoose('radar')}><span className="is-radar"><ClipboardList size={23}/></span><strong>Item do Radar</strong><p>Use algo que você já registrou em <b>Comprei</b>. Custos, preço mínimo e análise entram automaticamente.</p><em>Selecionar item <ArrowRight size={14}/></em></button>
      <button onClick={()=>onChoose('externo')}><span className="is-home"><Home size={23}/></span><strong>Item que já tenho</strong><p>Quer desapegar de algo de casa? Cadastre somente os dados necessários e crie o anúncio do zero.</p><em>Criar anúncio externo <ArrowRight size={14}/></em></button>
    </div>
  </section>
}

function RadarItemStep({purchases,query,setQuery,selectedId,setSelectedId,onContinue}:{purchases:PurchaseRow[];query:string;setQuery:(v:string)=>void;selectedId:string;setSelectedId:(v:string)=>void;onContinue:()=>void}){
  return <section>
    <div className="sale-flow__intro"><span>ETAPA 2</span><h3>Qual item você vai anunciar?</h3><p>Escolha uma compra registrada. O Radar reaproveita os dados que já conhece.</p></div>
    <input className="sale-flow__input mt-4" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar item comprado..."/>
    <div className="sale-radar-list">{purchases.length?purchases.map(p=><button key={p.id} onClick={()=>setSelectedId(p.id)} className={selectedId===p.id?'is-selected':''}><span><PackageCheck size={17}/></span><div><strong>{p.produto}</strong><small>{p.categoria||'Sem categoria'} · custo total {money(purchaseTotalCost(p))}</small></div><i>{selectedId===p.id?<CheckCircle2 size={18}/>:null}</i></button>):<div className="sale-empty-state"><Box size={20}/><strong>Nenhum item encontrado.</strong><p>Registre a compra primeiro ou volte e escolha “Item que já tenho”.</p></div>}</div>
    <button onClick={onContinue} disabled={!selectedId} className="sale-flow__primary">Continuar para as fotos <ArrowRight size={16}/></button>
  </section>
}

function ExternalItemStep(p:{
  product:string;setProduct:(v:string)=>void;category:string;setCategory:(v:string)=>void;brand:string;setBrand:(v:string)=>void;model:string;setModel:(v:string)=>void;condition:string;setCondition:(v:string)=>void;usageTime:string;setUsageTime:(v:string)=>void;notes:string;setNotes:(v:string)=>void;minPrice:string;setMinPrice:(v:string)=>void;idealPrice:string;setIdealPrice:(v:string)=>void;onContinue:()=>void
}){
  return <section>
    <div className="sale-flow__intro"><span>ETAPA 2</span><h3>Conte só o que você sabe.</h3><p>Não precisa preencher tudo. Quanto mais informações verdadeiras, melhor o anúncio e menor a chance da IA inventar contexto.</p></div>
    <div className="sale-form-grid">
      <Field label="Produto *" value={p.product} setValue={p.setProduct} placeholder="Ex.: iPhone 13 128GB"/>
      <Field label="Categoria" value={p.category} setValue={p.setCategory} placeholder="Ex.: Celulares"/>
      <Field label="Marca" value={p.brand} setValue={p.setBrand} placeholder="Ex.: Apple"/>
      <Field label="Modelo" value={p.model} setValue={p.setModel} placeholder="Ex.: A2633"/>
      <Field label="Estado" value={p.condition} setValue={p.setCondition} placeholder="Ex.: usado, bem conservado"/>
      <Field label="Tempo de uso" value={p.usageTime} setValue={p.setUsageTime} placeholder="Ex.: 1 ano"/>
      <Field label="Preço mínimo" value={p.minPrice} setValue={p.setMinPrice} prefix="R$" numeric placeholder="0,00"/>
      <Field label="Preço que gostaria" value={p.idealPrice} setValue={p.setIdealPrice} prefix="R$" numeric placeholder="0,00"/>
    </div>
    <label className="sale-flow__label mt-3">Defeitos, acessórios e observações<textarea value={p.notes} onChange={e=>p.setNotes(e.target.value)} className="sale-flow__textarea" placeholder="Ex.: pequeno risco lateral, acompanha carregador original, tudo funcionando..."/></label>
    <button onClick={p.onContinue} disabled={!p.product.trim()} className="sale-flow__primary">Continuar para as fotos <ArrowRight size={16}/></button>
  </section>
}

function Field({label,value,setValue,placeholder,prefix,numeric=false}:{label:string;value:string;setValue:(v:string)=>void;placeholder:string;prefix?:string;numeric?:boolean}){
  return <label className="sale-flow__label">{label}<div className="sale-flow__field">{prefix&&<span>{prefix}</span>}<input inputMode={numeric?'decimal':undefined} value={value} onChange={e=>setValue(numeric?e.target.value.replace(',','.'):e.target.value)} placeholder={placeholder}/></div></label>
}

function PhotosStep({source,product,images,preparing,addImages,removeImage,onGenerate,busy}:{source:ResaleDraftOrigin;product:string;images:PreparedImage[];preparing:boolean;addImages:(f:FileList|null)=>void;removeImage:(i:number)=>void;onGenerate:()=>void;busy:boolean}){
  return <section>
    <div className="sale-flow__intro"><span>ETAPA 3</span><h3>Agora mostre o produto.</h3><p><b>{product||'Seu item'}</b> · envie as fotos que você realmente pretende usar. O diagnóstico avalia o conjunto, não uma foto genérica.</p></div>
    <div className="sale-photo-guide"><span><Camera size={14}/> Luz natural</span><span><ImagePlus size={14}/> Produto inteiro</span><span><CheckCircle2 size={14}/> Defeitos visíveis</span><span><PackageCheck size={14}/> Etiqueta/acessórios</span></div>
    {images.length>0&&<div className="sale-photo-grid">{images.map((img,i)=><div key={img.preview}><img src={img.preview} alt={'Foto '+(i+1)}/><b>Foto {i+1}</b><button onClick={()=>removeImage(i)}><X size={13}/></button></div>)}</div>}
    {images.length<6&&<label className="sale-photo-drop"><input type="file" accept="image/*" multiple className="hidden" onChange={e=>{addImages(e.target.files);e.currentTarget.value=''}}/><Upload size={21}/><span><strong>{preparing?'Preparando imagens...':'Selecionar fotos'}</strong><small>1 a 6 fotos · JPG, PNG ou WEBP</small></span><em>{images.length}/6</em></label>}
    <div className="sale-photo-note"><Sparkles size={14}/><p>O Radar não deve inventar sujeira ou defeitos. Quando houver dúvida visual, a recomendação será fotografar melhor em vez de afirmar algo.</p></div>
    <button onClick={onGenerate} disabled={busy||preparing||images.length===0} className="sale-flow__primary">{busy?<RefreshCw size={16} className="animate-spin"/>:<Sparkles size={16}/>} {busy?'Analisando fotos e criando anúncio...':'Gerar diagnóstico + anúncio'}</button>
    <small className="sale-flow__secure">{source==='radar'?'Os dados do item são cruzados com o que já existe no Radar.':'Este item fica separado da sua carteira de compras.'}</small>
  </section>
}

function ResultStep({ad,title,setTitle,description,setDescription,onSaveText,savingText,copied,onCopy,onRecheck}:{ad:ResaleAd;title:string;setTitle:(v:string)=>void;description:string;setDescription:(v:string)=>void;onSaveText:()=>void;savingText:boolean;copied:string;onCopy:(k:string,t:string)=>void;onRecheck:()=>void}){
  const audit=ad.foto_auditoria
  const tone=audit.nota_geral>=80?'good':audit.nota_geral>=60?'mid':'bad'
  return <section className="sale-result">
    <div className={'premium-diagnostic is-'+tone}>
      <div className="premium-diagnostic__head">
        <div><span className="premium-eyebrow text-cyan-400">DIAGNÓSTICO PREMIUM</span><h3>{audit.pronta_para_publicar?'Fotos prontas para anunciar.':'Vale melhorar antes de publicar.'}</h3><p>{audit.resumo}</p></div>
        <div className="premium-diagnostic__score"><strong>{Math.round(audit.nota_geral)}</strong><span>/100</span><small>NOTA GERAL</small></div>
      </div>

      <div className="premium-diagnostic__metrics">
        <Metric label="Nitidez" value={audit.nitidez_score}/>
        <Metric label="Iluminação" value={audit.iluminacao_score}/>
        <Metric label="Apresentação" value={audit.apresentacao_score}/>
      </div>

      {audit.foto_principal_indice>0&&<div className="premium-main-photo"><CheckCircle2 size={17}/><span>Melhor foto para capa</span><strong>Foto {audit.foto_principal_indice}</strong></div>}

      <div className="premium-photo-reviews">{audit.avaliacoes.map(photo=><article key={photo.indice} className={'is-'+photo.qualidade}>
        <header><div><span>FOTO {photo.indice}</span><strong>{photo.qualidade==='boa'?'Boa para usar':photo.qualidade==='refazer'?'Refazer':'Pode melhorar'}</strong></div><b>{Math.round(photo.nota)}/100</b></header>
        {photo.problemas.length>0&&<div className="premium-photo-reviews__issues">{photo.problemas.map((x,i)=><p key={i}><AlertTriangle size={14}/>{x}</p>)}</div>}
        {photo.pontos_fortes.length>0&&<div className="premium-photo-reviews__good">{photo.pontos_fortes.map((x,i)=><p key={i}><Check size={14}/>{x}</p>)}</div>}
        <footer><strong>O que fazer</strong><p>{photo.acao_recomendada}</p></footer>
      </article>)}</div>

      {audit.plano_de_fotos.length>0&&<div className="premium-shot-plan"><span className="premium-eyebrow text-blue-400">ROTEIRO PARA REFazer</span><h4>Faça nessa ordem</h4>{audit.plano_de_fotos.map((x,i)=><div key={i}><b>{i+1}</b><p>{x}</p></div>)}</div>}
    </div>

    <div className="sale-ready">
      <div className="sale-ready__heading"><div><span className="premium-eyebrow text-emerald-400">ANÚNCIO PRONTO</span><h3>Copie, ajuste se quiser e publique.</h3></div><button onClick={onRecheck}><RefreshCw size={14}/> Trocar fotos</button></div>
      <div className="sale-ready__prices"><Price label="Venda rápida" value={ad.preco_venda_rapida}/><Price label="Preço equilibrado" value={ad.preco_equilibrado} accent/><Price label="Tentar mais margem" value={ad.preco_premium}/></div>

      <label className="sale-edit-block"><div><span>Título</span><button onClick={()=>onCopy('title',title)} type="button">{copied==='title'?<Check size={14}/>:<Copy size={14}/>} {copied==='title'?'Copiado':'Copiar'}</button></div><input value={title} onChange={e=>setTitle(e.target.value)}/></label>
      <label className="sale-edit-block"><div><span>Descrição</span><button onClick={()=>onCopy('desc',description)} type="button">{copied==='desc'?<Check size={14}/>:<Copy size={14}/>} {copied==='desc'?'Copiado':'Copiar'}</button></div><textarea value={description} onChange={e=>setDescription(e.target.value)}/></label>

      <div className="sale-ready__lists"><List title="Pontos fortes para destacar" items={ad.pontos_destaque}/><List title="Fotos que ainda podem ajudar" items={ad.checklist_fotos}/></div>
      <div className="sale-reply"><div><span>RESPOSTA PARA PEDIDO DE DESCONTO</span><button onClick={()=>onCopy('reply',ad.resposta_negociacao)}>{copied==='reply'?<Check size={14}/>:<Copy size={14}/>} {copied==='reply'?'Copiado':'Copiar'}</button></div><p>{ad.resposta_negociacao}</p></div>

      <button onClick={onSaveText} disabled={savingText} className="sale-save-copy"><Save size={16}/>{savingText?'Salvando alterações...':'Salvar título e descrição'}</button>
    </div>
  </section>
}

function Metric({label,value}:{label:string;value:number}){const v=Math.max(0,Math.min(100,Number(value||0)));return <div><span>{label}</span><strong>{Math.round(v)}</strong><i><b style={{width:v+'%'}}/></i></div>}
function Price({label,value,accent=false}:{label:string;value:number;accent?:boolean}){return <div className={accent?'is-accent':''}><span>{label}</span><strong>{money(value)}</strong></div>}
function List({title,items}:{title:string;items:string[]}){return <div className="sale-list"><strong>{title}</strong>{items.map((x,i)=><p key={i}><Check size={13}/>{x}</p>)}</div>}
