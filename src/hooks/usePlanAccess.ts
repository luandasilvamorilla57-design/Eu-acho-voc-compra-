import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AccountPlan } from '../types/database'

export type AccessStatus={
  liberado:boolean
  plano:AccountPlan|null
  owner_access:boolean
  assinatura_status:string|null
  valido_ate:string|null
  analises_mes:number
  analises_dia:number
  usadas_mes:number
  usadas_dia:number
  geracoes_venda_mes:number
  usadas_venda_mes:number
  creditos_extras:number
  proxima_cobranca:string|null
  valor:number|null
  gateway:string|null
}

const empty:AccessStatus={
  liberado:false,plano:null,owner_access:false,assinatura_status:null,valido_ate:null,
  analises_mes:0,analises_dia:0,usadas_mes:0,usadas_dia:0,
  geracoes_venda_mes:0,usadas_venda_mes:0,creditos_extras:0,
  proxima_cobranca:null,valor:null,gateway:null
}

export function usePlanAccess(active:boolean){
  const [loading,setLoading]=useState(active)
  const [checked,setChecked]=useState(false)
  const [status,setStatus]=useState<AccessStatus>(empty)

  const refresh=useCallback(async(options?:{silent?:boolean})=>{
    const silent=Boolean(options?.silent)
    if(!active){setStatus(empty);setChecked(false);setLoading(false);return false}
    if(!silent)setLoading(true)
    try{
      const {data,error}=await supabase.functions.invoke('status-acesso',{body:{}})
      if(error)throw error
      const next:AccessStatus={
        liberado:Boolean(data?.liberado),
        plano:(data?.plano??null) as AccountPlan|null,
        owner_access:Boolean(data?.owner_access),
        assinatura_status:data?.assinatura_status??null,
        valido_ate:data?.valido_ate??null,
        analises_mes:Number(data?.analises_mes||0),
        analises_dia:Number(data?.analises_dia||0),
        usadas_mes:Number(data?.usadas_mes||0),
        usadas_dia:Number(data?.usadas_dia||0),
        geracoes_venda_mes:Number(data?.geracoes_venda_mes||0),
        usadas_venda_mes:Number(data?.usadas_venda_mes||0),
        creditos_extras:Number(data?.creditos_extras||0),
        proxima_cobranca:data?.proxima_cobranca??null,
        valor:data?.valor==null?null:Number(data.valor),
        gateway:data?.gateway??null,
      }
      setStatus(next);setChecked(true);return next.liberado
    }catch(error){
      console.error('access status',error)
      setStatus(empty);setChecked(true);return false
    }finally{if(!silent)setLoading(false)}
  },[active])

  useEffect(()=>{void refresh()},[refresh])
  return{loading,checked,hasAccess:status.liberado,status,refresh}
}
