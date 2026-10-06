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
      let row:any=null
      if(forceRemote){
        const remote=await supabase.functions.invoke('controle-status',{body:{}})
        if(remote.error)throw remote.error
        row=remote.data
      }else{
        const result=await db.rpc('control_access_status')
        if(result.error)throw result.error
        row=Array.isArray(result.data)?result.data[0]:result.data

        if(row&&!row.can_write&&!row.is_admin){
          const remote=await supabase.functions.invoke('controle-status',{body:{}})
          if(!remote.error&&remote.data)row=remote.data
        }
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

  const subscribe=useCallback(async()=>{
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
  },[refresh])

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
      throw err
    }finally{
      setBusy(false)
    }
  },[refresh])

  return{access,loading,busy,error,refresh,subscribe,cancel}
}
