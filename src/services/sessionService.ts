import { supabase } from '../lib/supabase'

const wait=(ms:number)=>new Promise(resolve=>window.setTimeout(resolve,ms))

export async function signOutFast(){
  try{
    await Promise.race([
      supabase.auth.signOut({scope:'local'}),
      wait(700)
    ])
  }catch{
    // Local navigation below guarantees that an expired remote token never traps the UI.
  }finally{
    window.location.replace('/')
  }
}
