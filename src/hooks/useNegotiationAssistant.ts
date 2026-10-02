import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import { reportClientError } from '../lib/errorReporter'
import type { AssistedNegotiationRow } from '../types/database'

export type NegotiationAssistantOutput={
  produto:string
  categoria:string
  marca:string
  modelo:string
  condicao_resumida:string
  preco_detectado:number
  confianca_identificacao:number
  leitura_vendedor:string
  mensagem_para_enviar:string
  objetivo_atual:string
  justificativa_estrategia:string
  nao_ofertar_ainda:boolean
  oferta_sugerida:number
  motivo_oferta:string
  proximo_passo:string
  sinais_vendedor:string[]
  objecoes:string[]
  perguntas_produto:string[]
  alertas_negociacao:string[]
  encerrar_negociacao:boolean
  motivo_encerrar:string
  preco_base:number
}

export type NegotiationImage={mime_type:string;data:string;name:string}
export type NegotiationPrefill={
  analysisId:string
  askingPrice:number
  note:string
  images:NegotiationImage[]
}

async function readFunctionError(error:any){
  try{
    const response=error?.context
    if(response instanceof Response){
      const body=await response.clone().json()
      return {message:body?.details||body?.error||error?.message,code:body?.code||''}
    }
  }catch{}
  return {message:error?.message||'Não foi possível continuar.',code:''}
}

export function useNegotiationAssistant(active=true){
  const [sessions,setSessions]=useState<AssistedNegotiationRow[]>([])
  const [loading,setLoading]=useState(false)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  const load=useCallback(async()=>{
    if(!active)return
    setLoading(true)
    const {data,error:e}=await supabase
      .from('negociacoes_assistidas')
      .select('*')
      .order('data_atualizacao',{ascending:false})
      .limit(20)
    if(e){
      reportClientError(e,'negotiation.load')
      setError('Não foi possível carregar suas negociações agora.')
    }else{
      setSessions(data??[])
    }
    setLoading(false)
  },[active])

  useEffect(()=>{void load()},[load])

  const invoke=async(body:any,context:string)=>{
    setBusy(true)
    setError('')
    try{
      const {data,error:e}=await supabase.functions.invoke('assistente-negociacao',{body})
      if(e){
        const parsed=await readFunctionError(e)
        reportClientError(e,context,{code:parsed.code})
        throw new Error(parsed.message)
      }
      if(data?.error)throw new Error(data.error)
      return data
    }finally{
      setBusy(false)
    }
  }

  const upsertLocal=(row:AssistedNegotiationRow)=>{
    setSessions(current=>[row,...current.filter(item=>item.id!==row.id)].sort((a,b)=>new Date(b.data_atualizacao).getTime()-new Date(a.data_atualizacao).getTime()))
  }

  const start=async(input:{askingPrice:number;note:string;images:NegotiationImage[];sourceAnalysisId?:string})=>{
    try{
      const data=await invoke({
        action:'start',
        asking_price:input.askingPrice,
        note:input.note,
        images:input.images,
        analysis_id:input.sourceAnalysisId||null
      },'negotiation.start')
      upsertLocal(data.session)
      return data as {session:AssistedNegotiationRow;assistant:NegotiationAssistantOutput;meta:any}
    }catch(e){
      const message=e instanceof Error?e.message:'Não foi possível iniciar a negociação.'
      setError(message)
      throw e
    }
  }

  const reply=async(sessionId:string,input:{sellerText:string;images:NegotiationImage[];note?:string})=>{
    try{
      const data=await invoke({
        action:'reply',
        session_id:sessionId,
        seller_text:input.sellerText,
        images:input.images,
        note:input.note||''
      },'negotiation.reply')
      upsertLocal(data.session)
      return data as {session:AssistedNegotiationRow;assistant:NegotiationAssistantOutput;meta:any}
    }catch(e){
      const message=e instanceof Error?e.message:'Não foi possível responder agora.'
      setError(message)
      throw e
    }
  }

  const noReply=async(sessionId:string)=>{
    try{
      const data=await invoke({action:'no_reply',session_id:sessionId},'negotiation.no_reply')
      upsertLocal(data.session)
      return data as {session:AssistedNegotiationRow;assistant:NegotiationAssistantOutput;meta:any}
    }catch(e){
      const message=e instanceof Error?e.message:'Não foi possível gerar o follow-up.'
      setError(message)
      throw e
    }
  }

  const finish=async(sessionId:string,outcome:'bought'|'failed',finalPrice=0,reason='')=>{
    try{
      const data=await invoke({
        action:'finish',
        session_id:sessionId,
        outcome,
        final_price:finalPrice,
        reason
      },'negotiation.finish')
      upsertLocal(data.session)
      return data as {session:AssistedNegotiationRow;result:any}
    }catch(e){
      const message=e instanceof Error?e.message:'Não foi possível encerrar a negociação.'
      setError(message)
      throw e
    }
  }

  return{sessions,loading,busy,error,setError,load,start,reply,noReply,finish}
}
