import {useEffect,useMemo,useState} from 'react'
import {ArrowRight,Sparkles,Star,UsersRound,X} from 'lucide-react'
import {supabase} from '../lib/supabase'

const db=supabase as any
const TAGS=['Gostei do visual','Mais relatórios','Mais velocidade','Melhor estoque']

export function FeedbackPrompt({userId,enabled=true,forcePreview=false}:{userId:string;enabled?:boolean;forcePreview?:boolean}){
  const [open,setOpen]=useState(false)
  const [stars,setStars]=useState(0)
  const [hover,setHover]=useState(0)
  const [comment,setComment]=useState('')
  const [tags,setTags]=useState<string[]>([])
  const [busy,setBusy]=useState(false)
  const [sent,setSent]=useState(false)
  const [error,setError]=useState<string|null>(null)

  useEffect(()=>{
    if(!enabled){setOpen(false);return}
    let alive=true
    let timer:number|undefined
    ;(async()=>{
      try{
        if(forcePreview){
          timer=window.setTimeout(()=>{if(alive)setOpen(true)},650)
          return
        }
        const status=await db.rpc('control_feedback_prompt_status')
        if(status.error)throw status.error
        const row=Array.isArray(status.data)?status.data[0]:status.data
        if(!alive||!row?.eligible)return
        timer=window.setTimeout(async()=>{
          if(!alive)return
          setOpen(true)
          const state=await db.from('control_feedback_state').select('prompt_count').eq('user_id',userId).maybeSingle()
          const count=Number(state.data?.prompt_count||0)
          await db.from('control_feedback_state').upsert({
            user_id:userId,
            last_prompt_at:new Date().toISOString(),
            prompt_count:count+1,
            updated_at:new Date().toISOString()
          },{onConflict:'user_id'})
        },1300)
      }catch{
        // Feedback is optional and must never interrupt the app.
      }
    })()
    return()=>{alive=false;if(timer)window.clearTimeout(timer)}
  },[userId,enabled,forcePreview])

  const activeStars=hover||stars
  const canSend=stars>=1&&!busy

  function toggleTag(tag:string){
    setTags(current=>current.includes(tag)?current.filter(item=>item!==tag):[...current,tag])
  }

  async function dismiss(){
    setOpen(false)
    if(forcePreview)return
    try{
      const until=new Date()
      until.setDate(until.getDate()+4)
      await db.from('control_feedback_state').upsert({
        user_id:userId,
        dismissed_until:until.toISOString(),
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'})
    }catch{}
  }

  async function submit(){
    if(!canSend)return
    setBusy(true);setError(null)
    try{
      if(forcePreview){
        setSent(true)
        window.setTimeout(()=>setOpen(false),1500)
        return
      }
      const inserted=await db.from('control_feedback').insert({
        user_id:userId,
        stars,
        comment:comment.trim()||null,
        selected_tags:tags
      })
      if(inserted.error)throw inserted.error

      await db.from('control_feedback_state').upsert({
        user_id:userId,
        submitted_at:new Date().toISOString(),
        dismissed_until:null,
        updated_at:new Date().toISOString()
      },{onConflict:'user_id'})

      setSent(true)
      window.setTimeout(()=>setOpen(false),1500)
    }catch(err:any){
      setError(err?.message||'Não foi possível enviar sua avaliação.')
    }finally{
      setBusy(false)
    }
  }

  if(!open)return null

  return <div className="cp-feedback-layer" role="dialog" aria-modal="true" aria-label="Avaliar o CONTROLE+">
    <button className="cp-feedback-backdrop" onClick={()=>void dismiss()} aria-label="Fechar"/>
    <section className="cp-feedback-card">
      <span className="cp-feedback-handle"/>
      <button className="cp-feedback-close" onClick={()=>void dismiss()} aria-label="Fechar"><X/></button>

      {sent?<div className="cp-feedback-thanks">
        <span><Sparkles/></span>
        <h2>Obrigado pela sua opinião.</h2>
        <p>{forcePreview?'Prévia concluída. Nenhuma avaliação foi salva no painel.':'Seu feedback foi enviado e vai ajudar a deixar o CONTROLE+ ainda melhor para quem vive de compra e revenda.'}</p>
      </div>:<>
        <div className="cp-feedback-kicker"><Sparkles/> SUA OPINIÃO IMPORTA</div>
        <h2>Como está sendo sua experiência com o <strong>CONTROLE+</strong>?</h2>
        <p className="cp-feedback-intro">Você já está usando a ferramenta há alguns dias. Avalie sua experiência e nos diga o que poderia ficar ainda melhor.</p>

        <div className="cp-feedback-stars" onMouseLeave={()=>setHover(0)}>
          {[1,2,3,4,5].map(value=><button
            key={value}
            type="button"
            className={value<=activeStars?'active':''}
            onMouseEnter={()=>setHover(value)}
            onFocus={()=>setHover(value)}
            onBlur={()=>setHover(0)}
            onClick={()=>setStars(value)}
            aria-label={value+' estrela'+(value>1?'s':'')}
          ><Star/></button>)}
        </div>
        <span className="cp-feedback-stars-help">{stars?stars+' de 5 estrelas':'Toque nas estrelas para avaliar'}</span>

        <label className="cp-feedback-field">
          <span>Sugestão de melhoria <small>(opcional)</small></span>
          <textarea
            maxLength={2000}
            value={comment}
            onChange={e=>setComment(e.target.value)}
            placeholder="Ex.: Gostaria de ver mais insights sobre meus produtos e vendas..."
          />
        </label>

        <div className="cp-feedback-tags">
          {TAGS.map(tag=><button key={tag} type="button" className={tags.includes(tag)?'active':''} onClick={()=>toggleTag(tag)}>{tag}</button>)}
        </div>

        {error&&<div className="cp-form-error">{error}</div>}

        <div className="cp-feedback-actions">
          <button className="cp-feedback-later" onClick={()=>void dismiss()}>Agora não</button>
          <button className="cp-feedback-send" disabled={!canSend} onClick={()=>void submit()}>
            {busy?'Enviando...':<>Enviar avaliação <ArrowRight/></>}
          </button>
        </div>

        <div className="cp-feedback-footer"><UsersRound/><span>Sua avaliação ajuda a melhorar o app para todo mundo.</span></div>
      </>}
    </section>
  </div>
}

export type FeedbackRow={
  id:string
  user_id:string
  stars:number
  comment:string|null
  selected_tags:string[]
  created_at:string
}

export function feedbackSummary(rows:FeedbackRow[]){
  const total=rows.length
  const average=total?rows.reduce((sum,row)=>sum+Number(row.stars||0),0)/total:0
  const five=rows.filter(row=>Number(row.stars)===5).length
  const tagCount=new Map<string,number>()
  for(const row of rows)for(const tag of row.selected_tags||[])tagCount.set(tag,(tagCount.get(tag)||0)+1)
  const topTag=[...tagCount.entries()].sort((a,b)=>b[1]-a[1])[0]||null
  return{total,average,five,topTag}
}

export function StarRating({value}:{value:number}){
  const stars=useMemo(()=>[1,2,3,4,5],[ ])
  return <span className="cp-admin-feedback-stars">{stars.map(n=><Star key={n} className={n<=value?'active':''}/>)}</span>
}
