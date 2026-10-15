import {useCallback,useEffect,useState} from 'react'
import {supabase} from '../lib/supabase'

const db=supabase as any

export type ControlAccess={
  can_write:boolean
  access_state:'trial'|'active'|'expired'|'pending'|'past_due'|'admin'
  trial_started_at:string|null
  trial_ends_at:string|null
  days_remaining:number
  monthly_price:number
  subscription_status:string|null
  next_payment_at:string|null
  valid_until:string|null
  is_admin:boolean
}

function normalize(row:any):ControlAccess{
  return{
    can_write:Boolean(row?.can_write),
    access_state:(row?.access_state||'expired') as ControlAccess['access_state'],
    trial_started_at:row?.trial_started_at||null,
    trial_ends_at:row?.trial_ends_at||null,
    days_remaining:Math.max(0,Number(row?.days_remaining||0)),
    monthly_price:Number(row?.monthly_price||12.90),
    subscription_status:row?.subscription_status||null,
    next_payment_at:row?.next_payment_at||null,
    valid_until:row?.valid_until||null,
    is_admin:Boolean(row?.is_admin)
  }
}

export function useControlAccess(userId:string){
  const [access,setAccess]=useState<ControlAccess|null>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState<string|null>(null)

  const refresh=useCallback(async(forceRemote=false)=>{
    if(!userId)return null
    setError(null)
    try{
      // O banco (RLS) é a fonte de verdade, inclusive no teste da conta master.
      // A função remota só reconcilia pagamentos e nunca substitui o bloqueio local.
      let result=await db.rpc('control_access_status')
      if(result.error)throw result.error
      let row:any=Array.isArray(result.data)?result.data[0]:result.data
      if(forceRemote||(row&&!row.can_write&&!row.is_admin)){
        const remote=await supabase.functions.invoke('controle-status',{body:{}})
        if(remote.error&&forceRemote)throw remote.error
        result=await db.rpc('control_access_status')
        if(result.error)throw result.error
        row=Array.isArray(result.data)?result.data[0]:result.data
      }
      const next=normalize(row)
      setAccess(next)
      return next
    }catch(err:any){
      setError(err?.message||'Não foi possível validar seu acesso.')
      return null
    }finally{
      setLoading(false)
    }
  },[userId])

  useEffect(()=>{
    let alive=true
    const checkout=new URLSearchParams(window.location.search).get('checkout')==='controle'
    ;(async()=>{
      const result=await refresh(checkout)
      if(!alive)return
      if(checkout&&result){
        const url=new URL(window.location.href)
        url.searchParams.delete('checkout')
        window.history.replaceState({},'',url.pathname+url.search+url.hash)
      }
    })()
    return()=>{alive=false}
  },[refresh])

  // A expiração é verificada pelo servidor; atualize o estado também sem recarregar o PWA.
  // Durante o teste, atualiza o indicador a cada minuto e verifica imediatamente ao vencer.
  useEffect(()=>{
    if(access?.access_state!=='trial'||!access.trial_ends_at)return
    const remaining=new Date(access.trial_ends_at).getTime()-Date.now()
    const delay=Math.max(1000,Math.min(60000,remaining+1000))
    const id=window.setTimeout(()=>{void refresh(false)},delay)
    return()=>window.clearTimeout(id)
  },[access?.access_state,access?.trial_ends_at,access?.can_write,refresh])

  // O celular pode ficar em segundo plano depois das 24 horas.
  useEffect(()=>{
    const recheck=()=>{if(document.visibilityState==='visible')void refresh(false)}
    document.addEventListener('visibilitychange',recheck)
    window.addEventListener('focus',recheck)
    return()=>{
      document.removeEventListener('visibilitychange',recheck)
      window.removeEventListener('focus',recheck)
    }
  },[refresh])

  const subscribe=useCallback(async()=>{
    if(access?.is_admin&&!access.can_write){
      setError('Sua conta master está em simulação de acesso expirado. Reative o acesso administrativo ao finalizar o teste.')
      return
    }
    setBusy(true);setError(null)
    try{
      const result=await supabase.functions.invoke('controle-assinar',{
        body:{return_origin:window.location.origin}
      })
      if(result.error)throw result.error
      if(result.data?.already_active){
        await refresh(true)
        return
      }
      const url=String(result.data?.checkout_url||'')
      if(!url)throw new Error('O Mercado Pago não retornou o link de pagamento.')
      window.location.assign(url)
    }catch(err:any){
      setError(err?.message||'Não foi possível abrir o pagamento.')
    }finally{
      setBusy(false)
    }
  },[refresh,access])

  const cancel=useCallback(async()=>{
    setBusy(true);setError(null)
    try{
      const result=await supabase.functions.invoke('controle-gerenciar-assinatura',{
        body:{action:'cancel'}
      })
      if(result.error)throw result.error
      await refresh(true)
    }catch(err:any){
      setError(err?.message||'Não foi possível cancelar a renovação.')
    }finally{
      setBusy(false)
    }
  },[refresh])

  return{access,loading,busy,error,refresh,subscribe,cancel}
}
