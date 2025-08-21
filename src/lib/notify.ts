import { toast } from "sonner";

export const notify = {
  success: (message: string, description?: string) => {
    toast.success(message, { description });
  },
  
  error: (message: string, description?: string) => {
    toast.error(message, { description });
  },
  
  info: (message: string, description?: string) => {
    toast.info(message, { description });
  },
  
  warning: (message: string, description?: string) => {
    toast.warning(message, { description });
  },
  
  // Action toast with button
  action: (message: string, options: {
    description?: string;
    actionLabel: string;
    onAction: () => void;
  }) => {
    toast.info(message, {
      description: options.description,
      action: {
        label: options.actionLabel,
        onClick: options.onAction
      }
    });
  }
};