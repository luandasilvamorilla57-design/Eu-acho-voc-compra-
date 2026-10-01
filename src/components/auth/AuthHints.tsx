import { KeyRound,Lightbulb,MailCheck,ShieldCheck } from 'lucide-react'
import type { AuthMode } from './authCopy'

export function AuthHints({mode,onRecover}:{mode:AuthMode;onRecover:()=>void}){
  if(mode==='login')return <div className="auth-login-helper">
    <span><ShieldCheck size={14}/> Seu histórico fica protegido por usuário.</span>
    <button type="button" onClick={onRecover}>Esqueci minha senha</button>
  </div>

  const data={
    register:[Lightbulb,'POR QUE CRIAR SUA CONTA','Salve análises, acompanhe compra e venda, revise seu ROI real e construa um histórico de oportunidades para a ferramenta aprender com sua operação.'],
    recover:[MailCheck,'COMO FUNCIONA','Enviaremos um link seguro para o e-mail informado. Abra o link para definir uma nova senha e confira também a caixa de spam.'],
    reset:[KeyRound,'RECUPERAÇÃO EM ANDAMENTO','Crie uma senha forte e diferente da anterior. Depois da atualização, você entrará novamente com a nova senha.']
  } as const

  const [Icon,title,text]=data[mode as 'register'|'recover'|'reset']
  return <div className="auth-context-card">
    <span className="auth-context-card__icon"><Icon size={19}/></span>
    <div><b>{title}</b><p>{text}</p></div>
  </div>
}
