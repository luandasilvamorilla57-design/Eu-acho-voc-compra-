import type { View } from './BottomNav'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './layout/DesktopSidebar'
import { TopHeader } from './layout/TopHeader'

export function AppShell({view,setView,dark,setDark,email,radarCount=0,ownerAccess=false,onManageSubscription,onOpenAdmin,children}:{view:View;setView:(v:View)=>void;dark:boolean;setDark:(v:boolean)=>void;email?:string;radarCount?:number;ownerAccess?:boolean;onManageSubscription?:()=>void;onOpenAdmin?:()=>void;children:React.ReactNode}){
  return <div className={`app-theme ${dark?'theme-dark':'theme-light'} app-shell relative min-h-screen overflow-x-hidden`}>
    <div className="app-atmosphere" aria-hidden="true"><span className="app-atmosphere__orb app-atmosphere__orb--one"/><span className="app-atmosphere__orb app-atmosphere__orb--two"/><span className="app-atmosphere__mesh"/></div>
    <DesktopSidebar view={view} setView={setView} radarCount={radarCount}/>
    <div className="app-workspace lg:pl-[276px]">
      <TopHeader view={view} dark={dark} setDark={setDark} email={email} ownerAccess={ownerAccess} onManageSubscription={onManageSubscription} onOpenAdmin={onOpenAdmin}/>
      <main className="app-main safe-bottom mx-auto max-w-[1480px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
        <div key={view} className="app-page-stage">{children}</div>
      </main>
    </div>
    <BottomNav view={view} setView={setView} radarCount={radarCount}/>
  </div>
}
