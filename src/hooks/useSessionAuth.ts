import { useEffect,useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
const recovery=()=>location.hash.includes('type=recovery')||location.search.includes('type=recovery')
export function useSessionAuth(){const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[reset,setReset]=useState(recovery());useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session);setReset(recovery());setReady(true)});const {data}=supabase.auth.onAuthStateChange((e,s)=>{setSession(s);if(e==='PASSWORD_RECOVERY')setReset(true);if(e==='SIGNED_OUT'||e==='USER_UPDATED')setReset(false)});return()=>data.subscription.unsubscribe()},[]);return{session,ready,reset}}
