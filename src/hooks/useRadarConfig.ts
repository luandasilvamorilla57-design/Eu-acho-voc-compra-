import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RadarConfigRow } from '../types/database'

export const defaultRadarConfig:RadarConfigRow={
  user_id:'',
  capital_disponivel:0,
  lucro_minimo:150,
  roi_minimo:25,
  dias_alerta_estoque:14,
  data_atualizacao:new Date(0).toISOString()
}

export function useRadarConfig(active:boolean){
  const [config,setConfig]=useState<RadarConfigRow>(defaultRadarConfig)
  const [loading,setLoading]=useState(false)

  const load=useCallback(async()=>{
    if(!active)return
    setLoading(true)
    const {data,error}=await supabase.from('radar_config').select('*').maybeSingle()
    if(!error&&data){setConfig(data)}
    else if(!data){
      const {data:created}=await supabase.from('radar_config').insert({}).select('*').single()
      if(created)setConfig(created)
    }
    setLoading(false)
  },[active])

  useEffect(()=>{load()},[load])

  const save=async(patch:Partial<Pick<RadarConfigRow,'capital_disponivel'|'lucro_minimo'|'roi_minimo'|'dias_alerta_estoque'>>)=>{
    const {data,error}=await supabase.from('radar_config').upsert({...patch},{onConflict:'user_id'}).select('*').single()
    if(error)throw error
    if(data)setConfig(data)
  }

  return{config,loading,save,load}
}
