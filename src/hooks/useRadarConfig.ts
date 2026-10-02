import { useCallback,useEffect,useState } from 'react'
import { supabase } from '../lib/supabase'
import type { RadarConfigRow } from '../types/database'

export const defaultRadarConfig:RadarConfigRow={
  user_id:'',
  capital_disponivel:0,
  giro_preferido:'rapido',
  lucro_minimo:150,
  lucro_minimo_modo:'valor',
  lucro_minimo_percentual:20,
  roi_minimo:25,
  dias_alerta_estoque:14,
  plano_atual:'start',
  acesso_total:false,
  onboarding_concluido:false,
  perfil_operacao:'revenda',
  experiencia:'iniciante',
  categorias_preferidas:[],
  objetivo_lucro_mensal:0,
  notificacoes_ativas:true,
  data_atualizacao:new Date(0).toISOString()
}

export type RadarConfigPatch=Partial<Omit<RadarConfigRow,'user_id'|'data_atualizacao'|'acesso_total'|'plano_atual'>>

export function useRadarConfig(active:boolean){
  const [config,setConfig]=useState<RadarConfigRow>(defaultRadarConfig)
  const [loading,setLoading]=useState(false)
  const [checked,setChecked]=useState(false)
  const [error,setError]=useState('')

  const load=useCallback(async()=>{
    if(!active){
      setConfig(defaultRadarConfig)
      setLoading(false)
      setChecked(false)
      setError('')
      return false
    }

    setLoading(true)
    setError('')

    try{
      const {data,error:selectError}=await supabase.from('radar_config').select('*').maybeSingle()
      if(selectError)throw selectError

      if(data){
        setConfig({...defaultRadarConfig,...data})
        setChecked(true)
        return true
      }

      const {data:created,error:createError}=await supabase.from('radar_config').insert({}).select('*').single()
      if(createError)throw createError
      if(!created)throw new Error('Não foi possível preparar sua conta.')

      setConfig({...defaultRadarConfig,...created})
      setChecked(true)
      return true
    }catch(e){
      console.error('radar config',e)
      setError(e instanceof Error?e.message:'Não foi possível carregar sua configuração.')
      setChecked(true)
      return false
    }finally{
      setLoading(false)
    }
  },[active])

  useEffect(()=>{void load()},[load])

  const save=async(patch:RadarConfigPatch)=>{
    const {data,error}=await supabase.from('radar_config').upsert({...patch},{onConflict:'user_id'}).select('*').single()
    if(error)throw error
    if(data)setConfig({...defaultRadarConfig,...data})
  }

  return{config,loading,checked,error,save,load}
}
