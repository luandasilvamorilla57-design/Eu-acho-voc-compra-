import type { AnaliseRow } from '../types/database'

export const analysisPhotoPaths=(item:Pick<AnaliseRow,'fotos'>):string[]=>
  Array.isArray(item.fotos)?item.fotos.filter((value):value is string=>typeof value==='string'&&value.length>0):[]
