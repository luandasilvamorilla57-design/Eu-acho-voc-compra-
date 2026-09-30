import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RadarConfigRow } from '../types/database'

export const defaultRadarConfig:RadarConfigRow={
  user_id:'',
  capital_disponivel:0,
  lucro_minimo:150,
  lucro_minimo_modo:'valor',
  lucro_minimo_percentual:20,
  roi_minimo:25,
  dias_alerta_estoque:14,
  plano_atual:'start',
  acesso_total:false,
  data_atualizacao:new Date(0).toISOString()
}

type ConfigPatch=Partial<Pick<RadarConfigRow,'capital_disponivel'|'lucro_minimo'|'lucro_minimo_modo'|'lucro_minimo_percentual'|'roi_minimo'|'dias_alerta_estoque'>>

export function useRadarConfig(active:boolean){
  const [config,setConfig]=useState<RadarConfigRow>(defaultRadarConfig)
  const [loading,setLoading]=useState(false)

  const load=useCallback(async()=>{
    if(!active)return
    setLoading(true)
    const {data,error}=await supabase.from('radar_config').select('*').maybeSingle()
    if(!error&&data){setConfig({...defaultRadarConfig,...data})}
    else if(!data){
      const {data:created}=await supabase.from('radar_config').insert({}).select('*').single()
      if(created)setConfig({...defaultRadarConfig,...created})
    }
    setLoading(false)
  },[active])

  useEffect(()=>{load()},[load])

  const save=async(patch:ConfigPatch)=>{
    const {data,error}=await supabase.from('radar_config').upsert({...patch},{onConflict:'user_id'}).select('*').single()
    if(error)throw error
    if(data)setConfig({...defaultRadarConfig,...data})
  }

  return{config,loading,save,load}
}
