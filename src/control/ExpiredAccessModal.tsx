import {ArrowRight,Check,Clock3,CreditCard,Eye,Info,LockKeyhole,ShieldCheck,X} from 'lucide-react'
import type {ControlAccess} from './useControlAccess'
import './expired-access.css'

const money=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'})

type Props={
  access:ControlAccess
  busy:boolean
  error:string|null
  onClose:()=>void
  onSubscribe:()=>void
  blockedAction?:boolean
}

export function ExpiredAccessModal({access,busy,error,onClose,onSubscribe,blockedAction=false}:Props){
  return <div className="cp-expired-layer" role="presentation">
    <button type="button" className="cp-expired-scrim" aria-label="Continuar em modo visualização" onClick={onClose}/>
    <section className="cp-expired-card" role="dialog" aria-modal="true" aria-labelledby="cp-expired-title" aria-describedby="cp-expired-description">
      <header className="cp-expired-top">
        <strong>CONTROLE<span>+</span></strong>
        <button type="button" onClick={onClose} aria-label="Fechar aviso"><X size={22}/></button>
      </header>
      <div className="cp-expired-status"><Clock3 size={14}/>{blockedAction?'RECURSO BLOQUEADO':'PERÍODO DE TESTE ENCERRADO'}</div>
      <div className="cp-expired-heading">
        <span className="cp-expired-lock"><LockKeyhole size={27}/></span>
        <h2 id="cp-expired-title">{blockedAction?'Continue de onde parou.':'Seu período de teste'}<em>{blockedAction?' Ative seu acesso.':' expirou.'}</em></h2>
      </div>
      <p id="cp-expired-description" className="cp-expired-copy">
        {blockedAction
          ?'Para cadastrar, editar, excluir produtos ou registrar novas movimentações, ative seu plano CONTROLE+.'
          :'Seu acesso gratuito terminou. Assine para continuar cadastrando produtos, registrando vendas e cuidando do seu negócio sem interrupções.'}
      </p>
      <div className="cp-expired-preserved"><Info size={19}/><p><b>Seus dados estão seguros.</b> Você continua visualizando seus produtos, vendas e históricos. Nada foi apagado, mas novas alterações exigem acesso ativo.</p></div>
      <div className="cp-expired-benefits">
        <h3>Com o CONTROLE+ você pode:</h3>
        <ul>
          <li><Check/>Cadastrar produtos com fotos</li>
          <li><Check/>Controlar estoque, vendas e caixa</li>
          <li><Check/>Registrar gastos e acompanhar o saldo</li>
          <li><Check/>Receber lembretes e cuidar dos anúncios</li>
          <li><Check/>Manter seu histórico e informações salvos</li>
        </ul>
      </div>
      <div className="cp-expired-price">
        <div className="cp-expired-price-icon"><ShieldCheck size={24}/></div>
        <div><span>PLANO MENSAL · ACESSO COMPLETO</span><strong>{money.format(access.monthly_price)}<small>/mês</small></strong><p>Cancele quando quiser</p></div>
      </div>
      {error&&<div className="cp-form-error" role="alert">{error}</div>}
      <button type="button" className="cp-expired-activate" onClick={onSubscribe} disabled={busy}><CreditCard size={20}/><span>{busy?'Abrindo pagamento...':'Ativar meu acesso agora'}</span><ArrowRight size={20}/></button>
      <button type="button" className="cp-expired-readonly" onClick={onClose}><Eye size={18}/>Continuar em modo visualização</button>
      <div className="cp-expired-trust"><ShieldCheck size={16}/>Pagamento seguro pelo Mercado Pago</div>
    </section>
  </div>
}
