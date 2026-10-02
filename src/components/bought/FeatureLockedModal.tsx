import { ArrowRight,Camera,Check,LockKeyhole,Sparkles,X } from 'lucide-react'

export function FeatureLockedModal({onClose,onUpgrade}:{onClose:()=>void;onUpgrade:()=>void}){
  return <div className="purchase-modal">
    <button className="purchase-modal__backdrop" onClick={onClose} aria-label="Fechar"/>
    <div className="purchase-modal__card feature-locked-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="premium-eyebrow text-cyan-400">RECURSO BRIKE PRO</span>
          <h3 className="font-display mt-1.5 text-2xl font-extrabold purchase-title">Anúncio Inteligente</h3>
          <p className="mt-2 text-[12px] leading-5 text-slate-500">Seu Start continua ativo. Para usar este recurso, faça upgrade para o Pro e libere também a preparação de venda com IA.</p>
        </div>
        <button type="button" onClick={onClose} className="purchase-close"><X size={17}/></button>
      </div>

      <div className="feature-locked-hero">
        <span><LockKeyhole size={22}/></span>
        <strong>Transforme fotos em um anúncio pronto para vender.</strong>
        <p>A IA olha cada foto de verdade, aponta o que está atrapalhando e monta a publicação.</p>
      </div>

      <div className="feature-locked-list">
        <span><Check size={13}/><b>Avaliação individual</b> de nitidez, luz e enquadramento</span>
        <span><Check size={13}/><b>Detecta apresentação ruim</b>, sujeira aparente e fundo que distrai</span>
        <span><Check size={13}/><b>Sugere novas fotos</b> e ângulos que aumentam confiança</span>
        <span><Check size={13}/><b>Escolhe a melhor foto principal</b> entre as enviadas</span>
        <span><Check size={13}/><b>Gera título e descrição</b> prontos para copiar</span>
        <span><Check size={13}/><b>Calcula faixa de preço</b> sem ignorar seu preço mínimo</span>
      </div>

      <div className="feature-locked-footer">
        <div><Camera size={15}/><span><b>BRIKE Pro · R$ 19,90/mês</b><small>Upgrade da sua assinatura atual. Você não precisa criar outra conta.</small></span></div>
        <button type="button" className="feature-locked-upgrade" onClick={onUpgrade}>
          <Sparkles size={14}/> Liberar Pro <ArrowRight size={14}/>
        </button>
      </div>
    </div>
  </div>
}
