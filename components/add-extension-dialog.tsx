'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

interface AddExtensionDialogProps {
  onAdd: (extensionId: string) => Promise<void>;
}

export function AddExtensionDialog({ onAdd }: AddExtensionDialogProps) {
  const [open, setOpen] = useState(false);
  const [extensionId, setExtensionId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionId.trim()) return;

    setLoading(true);
    try {
      await onAdd(extensionId.trim());
      setExtensionId('');
      setOpen(false);
      toast.success('Extension added successfully');
    } catch (error) {
      toast.error('Failed to add extension');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4 mr-2" />
          Add Extension
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add VS Code Extension</DialogTitle>
          <DialogDescription>
            Enter the extension ID (e.g., publisher.extension-name) from the VS
            Code Marketplace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="publisher.extension-name"
            value={extensionId}
            onChange={(e) => setExtensionId(e.target.value)}
            disabled={loading}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="border-border/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !extensionId.trim()}
              className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              {loading ? 'Adding...' : 'Add Extension'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}