import type { View } from './BottomNav'
import { BottomNav } from './BottomNav'
import { DesktopSidebar } from './layout/DesktopSidebar'
import { TopHeader } from './layout/TopHeader'

export function AppShell({view,setView,dark,setDark,email,children}:{view:View;setView:(v:View)=>void;dark:boolean;setDark:(v:boolean)=>void;email?:string;children:React.ReactNode}){
  return <div className={`app-theme ${dark?'theme-dark':'theme-light'} relative min-h-screen overflow-x-hidden`}>
    <DesktopSidebar view={view} setView={setView}/>
    <div className="lg:pl-[262px]">
      <TopHeader view={view} dark={dark} setDark={setDark} email={email}/>
      <main className="safe-bottom mx-auto max-w-[1450px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
    <BottomNav view={view} setView={setView}/>
  </div>
}
