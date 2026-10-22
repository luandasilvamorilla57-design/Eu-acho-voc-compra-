import {useState} from 'react'
import {ArrowRight,CalendarClock,Check,Gift,Package,ReceiptText,ShieldCheck,WalletCards,X} from 'lucide-react'
import {supabase} from '../lib/supabase'
import type {ControlAccess} from './useControlAccess'
import './one-day-trial.css'

export function OneDayTrialModal({access,onDone}:{access:ControlAccess;onDone:()=>void}){
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const endsAt=access.trial_ends_at?new Date(access.trial_ends_at):null
 const endLabel=endsAt&&!Number.isNaN(endsAt.getTime())
  ?endsAt.toLocaleString('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})
  :'24 horas após o cadastro'

 async function continueFree(){
  if(busy)return
  setBusy(true);setError('')
  try{
   const saved=await (supabase as any).rpc('control_mark_trial_welcome_seen')
   if(saved.error||saved.data!==true)throw(saved.error||new Error('Não foi possível confirmar a apresentação.'))
   onDone()
  }catch{
   // Este modal é informativo, não deve impedir alguém de usar o teste em caso de falha de rede.
   setError('Não foi possível salvar sua preferência. Você pode continuar e tentar novamente depois.')
   onDone()
  }finally{setBusy(false)}
 }

 return <div className="cp-daytrial-layer" role="presentation">
  <section className="cp-daytrial-card" role="dialog" aria-modal="true" aria-labelledby="cp-daytrial-title" aria-describedby="cp-daytrial-description">
   <div className="cp-daytrial-top">
    <div className="cp-daytrial-brand">CONTROLE<span>+</span></div>
    <button type="button" aria-label="Fechar e continuar para a ferramenta" onClick={()=>void continueFree()} disabled={busy}><X size={19}/></button>
   </div>
   <div className="cp-daytrial-content">
    <span className="cp-daytrial-label"><Gift size={15}/> SEU ACESSO GRATUITO ESTÁ ATIVO</span>
    <div className="cp-daytrial-number"><b>24<span>H</span></b><span>para descobrir<br/>seu próximo nível</span></div>
    <h2 id="cp-daytrial-title">Mais controle.<br/><em>Menos improviso.</em></h2>
    <p id="cp-daytrial-description">Você tem 1 dia para usar o CONTROLE+ e organizar sua operação de compras, estoque e vendas. Experimente todas as funcionalidades de gestão.</p>
    <div className="cp-daytrial-benefits">
     <div><Package size={20}/><span>Estoque e fotos<br/><small>Saiba o que está disponível</small></span><Check size={17}/></div>
     <div><ReceiptText size={20}/><span>Compras e vendas<br/><small>Registre cada movimento</small></span><Check size={17}/></div>
     <div><WalletCards size={20}/><span>Caixa e lucro real<br/><small>Acompanhe seus resultados</small></span><Check size={17}/></div>
    </div>
    <div className="cp-daytrial-expiration"><CalendarClock size={19}/><div><b>Seu teste termina em {endLabel}</b><span>Depois, você pode assinar por R$ 18,90/mês para continuar cadastrando e vendendo. Seus dados permanecem disponíveis para consulta.</span></div></div>
   </div>
   <div className="cp-daytrial-actions">
    {error&&<p role="status">{error}</p>}
    <button type="button" className="cp-daytrial-continue" disabled={busy} onClick={()=>void continueFree()}><span>{busy?'Preparando sua conta...':'COMEÇAR MEU DIA GRÁTIS'}</span><ArrowRight size={20}/></button>
    <span className="cp-daytrial-trust"><ShieldCheck size={15}/> Sem cartão para testar · Sem cobrança automática</span>
   </div>
  </section>
 </div>
}
