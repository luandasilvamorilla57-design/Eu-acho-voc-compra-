import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AccountPlan } from '../types/database'

export type SubscriptionAccess={
  plano:AccountPlan
  status:string
  ultimo_pagamento_em:string|null
  valido_ate:string|null
}

export function usePlanAccess(active:boolean,accessTotal:boolean){
  const [loading,setLoading]=useState(active)
  const [checked,setChecked]=useState(false)
  const [hasAccess,setHasAccess]=useState(false)
  const [subscription,setSubscription]=useState<SubscriptionAccess|null>(null)

  const refresh=useCallback(async()=>{
    if(!active){
      setHasAccess(false)
      setSubscription(null)
      setChecked(false)
      setLoading(false)
      return false
    }

    setLoading(true)

    if(accessTotal){
      setHasAccess(true)
      setChecked(true)
      setLoading(false)
      return true
    }

    const {data,error}=await supabase
      .from('assinaturas')
      .select('plano,status,ultimo_pagamento_em,valido_ate')
      .order('updated_at',{ascending:false})
      .limit(1)
      .maybeSingle()

    if(error){
      console.error('subscription access',error)
      setHasAccess(false)
      setChecked(true)
      setLoading(false)
      return false
    }

    const row=(data??null) as SubscriptionAccess|null
    setSubscription(row)

    const paid=Boolean(row?.ultimo_pagamento_em)
    const currentStatus=String(row?.status||'').toLowerCase()
    const activeStatus=currentStatus==='authorized'||currentStatus==='active'
    const validUntil=row?.valido_ate?new Date(row.valido_ate).getTime():0
    const canceledStillValid=currentStatus==='cancelled'&&paid&&validUntil>Date.now()
    const allowed=Boolean(paid&&(activeStatus||canceledStillValid))

    setHasAccess(allowed)
    setChecked(true)
    setLoading(false)
    return allowed
  },[active,accessTotal])

  useEffect(()=>{void refresh()},[refresh])

  return{loading,checked,hasAccess,subscription,refresh}
}
