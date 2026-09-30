import { Camera,Check,FilePenLine,LockKeyhole,Sparkles,X } from 'lucide-react'

export function FeatureLockedModal({onClose}:{onClose:()=>void}){
  return <div className="purchase-modal">
    <button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <div className="purchase-modal__card feature-locked-card">
      <div className="flex items-start justify-between gap-4">
        <div><span className="premium-eyebrow text-cyan-400">RECURSO BRIKE PRO</span><h3 className="font-display mt-1.5 text-2xl font-extrabold purchase-title">Anúncio Inteligente</h3><p className="mt-2 text-[12px] leading-5 text-slate-500">No Start o recurso continua visível para você saber exatamente o que pode desbloquear ao mudar para o Pro.</p></div>
        <button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button>
      </div>
      <div className="feature-locked-hero"><span><LockKeyhole size={22}/></span><strong>Transforme fotos em um anúncio pronto para vender.</strong><p>A IA olha cada foto de verdade, aponta o que está atrapalhando e monta a publicação.</p></div>
      <div className="feature-locked-list">
        <span><Check size={13}/><b>Avaliação individual</b> de nitidez, luz e enquadramento</span>
        <span><Check size={13}/><b>Detecta apresentação ruim</b>, sujeira aparente e fundo que distrai</span>
        <span><Check size={13}/><b>Sugere novas fotos</b> e ângulos que aumentam confiança</span>
        <span><Check size={13}/><b>Escolhe a melhor foto principal</b> entre as enviadas</span>
        <span><Check size={13}/><b>Gera título e descrição</b> prontos para copiar</span>
        <span><Check size={13}/><b>Calcula faixa de preço</b> sem ignorar seu preço mínimo</span>
      </div>
      <div className="feature-locked-footer"><div><Camera size={15}/><span><b>BRIKE Pro</b><small>O acesso será conectado à tela de planos na próxima etapa.</small></span></div><button type="button" onClick={onClose}><FilePenLine size={14}/> Entendi</button></div>
    </div>
  </div>
}
