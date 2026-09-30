import { X } from 'lucide-react'
import type { AnaliseRow,RadarConfigRow } from '../types/database'
import type { AnalysisResult } from '../types/analysis'
import { AnalysisView } from './AnalysisView'
export function AnalysisModal({item,onClose,config}:{item:AnaliseRow|null;onClose:()=>void;config?:RadarConfigRow}){if(!item)return null;return <div className="fixed inset-0 z-[65] overflow-y-auto bg-black/75 p-3 backdrop-blur-sm sm:p-6"><div className="mx-auto max-w-5xl"><div className="mb-3 flex justify-end"><button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-slate-400"><X size={18}/></button></div><AnalysisView a={item.analise_ia as unknown as AnalysisResult} config={config}/></div></div>}
