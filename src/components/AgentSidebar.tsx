
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { InfoIcon, LayoutPanelLeftIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { AgentModeData } from '@/types';
import { Dispatch, SetStateAction } from 'react';

type Props = {
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  agentModeData: AgentModeData | null
}

const AgentSidebar = (props: Props) => {
  const {agentModeData,sidebarOpen,setSidebarOpen} = props

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
    <SheetContent side="right" className="p-4 w-full sm:max-w-md">
      <SheetHeader className="mb-4">
        <SheetTitle className="flex items-center gap-2">
          <LayoutPanelLeftIcon size={18} className="text-primary" />
          Agent Mode Details
        </SheetTitle>
        <SheetDescription>
          Information about the executed tool action
        </SheetDescription>
      </SheetHeader>

      {agentModeData && (
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Tool Name</div>
            <Badge variant="outline" className="text-md">
              {agentModeData.toolName}
            </Badge>
          </div>

          <div>
            <div className="text-sm font-medium mb-1">Arguments</div>
            <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-auto max-h-40">
              {JSON.stringify(agentModeData.args, null, 2)}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-medium mb-1 flex items-center gap-2">
              <InfoIcon size={14} className="text-primary" />
              Result
            </div>
            <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-auto max-h-64">
              {typeof agentModeData.result === 'object'
                ? JSON.stringify(agentModeData.result, null, 2)
                : agentModeData.result}
            </div>
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => setSidebarOpen(false)}
          >
            Close
          </Button>
        </div>
      )}
    </SheetContent>
  </Sheet>
  )
}

export default AgentSidebar