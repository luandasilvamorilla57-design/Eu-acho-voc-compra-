export type PreparedImage = {
  name: string
  mime_type: 'image/jpeg'
  data: string
  preview: string
  size: number
}

const MAX_IMAGES = 6
const MAX_SIDE = 1800

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>{
      const result=String(reader.result||'')
      resolve(result.split(',')[1]||'')
    }
    reader.onerror=()=>reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function prepareScreenshot(file: File): Promise<PreparedImage> {
  if(!file.type.startsWith('image/')) throw new Error('Selecione somente imagens.')

  const bitmap=await createImageBitmap(file)
  const scale=Math.min(1,MAX_SIDE/Math.max(bitmap.width,bitmap.height))
  const width=Math.max(1,Math.round(bitmap.width*scale))
  const height=Math.max(1,Math.round(bitmap.height*scale))

  const canvas=document.createElement('canvas')
  canvas.width=width
  canvas.height=height
  const ctx=canvas.getContext('2d')
  if(!ctx) throw new Error('Não foi possível processar a imagem.')

  ctx.drawImage(bitmap,0,0,width,height)
  bitmap.close()

  const blob=await new Promise<Blob>((resolve,reject)=>{
    canvas.toBlob(b=>b?resolve(b):reject(new Error('Não foi possível comprimir a imagem.')),'image/jpeg',0.86)
  })

  return {
    name:file.name,
    mime_type:'image/jpeg',
    data:await toBase64(blob),
    preview:URL.createObjectURL(blob),
    size:blob.size
  }
}

export async function prepareScreenshots(files: FileList | File[]) {
  const selected=Array.from(files).slice(0,MAX_IMAGES)
  return Promise.all(selected.map(prepareScreenshot))
}

export function revokePreviews(images: PreparedImage[]) {
  images.forEach(image=>URL.revokeObjectURL(image.preview))
}

export { MAX_IMAGES }
