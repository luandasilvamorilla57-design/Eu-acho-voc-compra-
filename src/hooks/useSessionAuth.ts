import { useEffect,useState } from 'react'
import type { AuthChangeEvent,Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

const recovery=()=>location.hash.includes('type=recovery')||location.search.includes('type=recovery')

export function useSessionAuth(){
  const [session,setSession]=useState<Session|null>(null)
  const [ready,setReady]=useState(false)
  const [reset,setReset]=useState(recovery())

  useEffect(()=>{
    let alive=true

    const apply=(event:AuthChangeEvent,next:Session|null)=>{
      if(!alive)return
      setSession(next)
      setReady(true)

      if(event==='PASSWORD_RECOVERY'){
        setReset(true)
        return
      }

      if(event==='SIGNED_IN'||event==='SIGNED_OUT'||event==='TOKEN_REFRESHED'||event==='USER_UPDATED'){
        setReset(false)
      }
    }

    const {data:listener}=supabase.auth.onAuthStateChange(apply)

    void supabase.auth.getSession().then(({data})=>{
      if(!alive)return
      setSession(data.session)
      setReset(recovery())
      setReady(true)
    }).catch(()=>{
      if(!alive)return
      setSession(null)
      setReady(true)
    })

    return()=>{
      alive=false
      listener.subscription.unsubscribe()
    }
  },[])

  return{session,ready,reset}
}
