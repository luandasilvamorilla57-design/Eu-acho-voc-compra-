import { supabase } from './supabase'

export async function reportClientError(error:unknown,context='app',metadata:Record<string,unknown>={}){
  try{
    const e=error instanceof Error?error:new Error(String(error))
    await supabase.from('client_errors').insert({
      context:context.slice(0,80),
      message:e.message.slice(0,1000),
      stack:e.stack?.slice(0,6000)||null,
      metadata:JSON.parse(JSON.stringify(metadata)) as any
    })
  }catch{
    // Reporting must never break the user flow.
  }
}
