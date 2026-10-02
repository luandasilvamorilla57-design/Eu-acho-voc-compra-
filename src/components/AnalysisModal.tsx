import { X } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow } from '../types/database'
import type { AnalysisResult } from '../types/analysis'
import { analysisPhotoPaths } from '../utils/analysisPhotos'
import { AnalysisPhotos } from './analysis/AnalysisPhotos'
import { AnalysisView } from './AnalysisView'

export function AnalysisModal({item,onClose,config}:{item:AnaliseRow|null;onClose:()=>void;config?:RadarConfigRow}){
  if(!item)return null
  const photos=analysisPhotoPaths(item)
  return <div className="analysis-modal fixed inset-0 z-[65] overflow-y-auto">
    <button className="analysis-modal__backdrop" onClick={onClose} aria-label="Fechar análise"/>
    <div className="analysis-modal__shell">
      <div className="analysis-modal__bar"><div><span className="premium-eyebrow text-emerald-400">ANÁLISE SALVA</span><strong className="font-display">{item.titulo_anuncio}</strong></div><button onClick={onClose} className="analysis-modal__close"><X size={18}/></button></div>
      <AnalysisPhotos paths={photos}/>
      <AnalysisView a={item.analise_ia as unknown as AnalysisResult} config={config}/>
    </div>
  </div>
}
