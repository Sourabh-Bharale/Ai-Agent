import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircleIcon, TerminalIcon, XCircleIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ToolInvocation } from 'ai';

interface ToolComformDialogProps {
  toolConfirmation: ToolInvocation | null
  handleToolConfirmation: (toolInvocation: ToolInvocation | null) => void
  setConfirmToolState: (state: boolean) => void
}

const ToolComformDialog = (props:ToolComformDialogProps) => {

  const {toolConfirmation, handleToolConfirmation, setConfirmToolState} = props
  return (
    <Dialog open={toolConfirmation !== null} onOpenChange={(open) => {
      if (!open) handleToolConfirmation(null);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TerminalIcon size={18} className="text-primary" />
            Tool Action Confirmation
          </DialogTitle>
          <DialogDescription>
            The assistant is requesting to run a tool action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="font-medium text-sm flex items-center gap-2">
              <Badge variant="outline">{toolConfirmation?.toolName}</Badge>
            </div>

            <div className="bg-muted rounded-md p-3 text-xs font-mono overflow-auto max-h-40">
              {toolConfirmation && JSON.stringify(toolConfirmation.args, null, 2)}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Do you want to allow this tool to be executed?
          </p>
        </div>

        <DialogFooter className="flex w-full gap-2">
          <Button
            variant="destructive"
            onClick={() => setConfirmToolState(false)}
            className="flex items-center gap-2"
          >
            <XCircleIcon size={16} />
            Deny
          </Button>
          <Button
            onClick={() => setConfirmToolState(true)}
            className="flex items-center gap-2"
          >
            <CheckCircleIcon size={16} />
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ToolComformDialog