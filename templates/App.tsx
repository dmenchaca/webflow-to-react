import { HomeBody } from '@/components/HomeBody'
import { TooltipProvider } from '@/components/ui/tooltip'

function App() {
  return (
    <TooltipProvider>
      <HomeBody />
    </TooltipProvider>
  )
}

export default App
