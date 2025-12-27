import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Loader2, BarChart3, Download, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { PollResults } from './PollResults';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  status: 'open' | 'closed';
  totalVotes: number;
  image?: string;
  created_at: string;
}

export function PollManagement() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [showResults, setShowResults] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isOpen, setIsOpen] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPolls();
    setupRealtimeSubscription();
  }, []);

  const loadPolls = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', 'poll:%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const pollsList = data
          .map(item => {
            try {
              return JSON.parse(item.value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        setPolls(pollsList);
      }
    } catch (error) {
      console.error('Error loading polls:', error);
      toast.error('Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-polls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: 'key=like.poll:%'
        },
        () => {
          loadPolls();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleNewPoll = () => {
    setEditingPoll(null);
    setTitle('');
    setDescription('');
    setOptions(['', '']);
    setIsOpen(true);
    setImageUrl('');
    setShowBuilder(true);
  };

  const handleEditPoll = (poll: Poll) => {
    setEditingPoll(poll);
    setTitle(poll.title);
    setDescription(poll.description);
    setOptions(poll.options.map(o => o.text));
    setIsOpen(poll.status === 'open');
    setImageUrl(poll.image || '');
    setShowBuilder(true);
  };

  const handleAddOption = () => {
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSavePoll = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    const validOptions = options.filter(o => o.trim());
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required');
      return;
    }

    setSaving(true);
    try {
      const pollId = editingPoll?.id || `poll_${Date.now()}`;
      const pollData: Poll = {
        id: pollId,
        title: title.trim(),
        description: description.trim(),
        options: validOptions.map((text, index) => ({
          id: `option_${index}`,
          text: text.trim(),
          votes: editingPoll?.options[index]?.votes || 0,
        })),
        status: isOpen ? 'open' : 'closed',
        totalVotes: editingPoll?.totalVotes || 0,
        image: imageUrl.trim() || undefined,
        created_at: editingPoll?.created_at || new Date().toISOString(),
      };

      const { error } = await supabase
        .from('kv_store_19c6936e')
        .upsert({
          key: `poll:${pollId}`,
          value: JSON.stringify(pollData),
          created_at: pollData.created_at,
        });

      if (error) throw error;

      toast.success(editingPoll ? 'Poll updated!' : 'Poll created!');
      setShowBuilder(false);
      loadPolls();
    } catch (error) {
      console.error('Error saving poll:', error);
      toast.error('Failed to save poll');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (poll: Poll) => {
    try {
      const updatedPoll = {
        ...poll,
        status: poll.status === 'open' ? 'closed' : 'open',
      };

      const { error } = await supabase
        .from('kv_store_19c6936e')
        .update({
          value: JSON.stringify(updatedPoll),
        })
        .eq('key', `poll:${poll.id}`);

      if (error) throw error;

      toast.success(`Poll ${updatedPoll.status === 'open' ? 'opened' : 'closed'}`);
      loadPolls();
    } catch (error) {
      console.error('Error toggling poll status:', error);
      toast.error('Failed to update poll status');
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    try {
      const { error } = await supabase
        .from('kv_store_19c6936e')
        .delete()
        .eq('key', `poll:${pollId}`);

      if (error) throw error;

      toast.success('Poll deleted');
      setDeleteConfirm(null);
      loadPolls();
    } catch (error) {
      console.error('Error deleting poll:', error);
      toast.error('Failed to delete poll');
    }
  };

  const handleExportCSV = async (poll: Poll) => {
    try {
      // Fetch all votes for this poll
      const { data, error } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', `vote:%:${poll.id}`);

      if (error) throw error;

      const votes = data?.map(item => JSON.parse(item.value)) || [];
      
      // Create CSV content
      let csv = 'Voter ID,Selected Option,Timestamp\n';
      votes.forEach(vote => {
        const option = poll.options.find(o => o.id === vote.optionId);
        csv += `${vote.userId},"${option?.text || 'Unknown'}",${vote.timestamp}\n`;
      });

      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll_${poll.id}_results.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading polls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-white mb-2">Poll Management</h2>
          <p className="text-slate-400">Create and monitor live polls</p>
        </div>
        <Button onClick={handleNewPoll} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />
          Create Poll
        </Button>
      </div>

      {/* Poll Builder */}
      {showBuilder && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {editingPoll ? 'Edit Poll' : 'Create New Poll'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Build your poll with multiple options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-slate-200">
                Poll Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., What's your favorite programming language?"
                className="h-12 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-200">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide context for your poll..."
                className="min-h-24 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image" className="text-slate-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Feature Image URL (Optional)
              </Label>
              <Input
                id="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="h-12 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-slate-200">Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="h-12 bg-slate-900/50 border-slate-600 text-white"
                  />
                  {options.length > 2 && (
                    <Button
                      onClick={() => handleRemoveOption(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                onClick={handleAddOption}
                variant="outline"
                className="w-full border-slate-600 text-slate-300"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div>
                <Label htmlFor="status" className="text-slate-200">
                  Poll Status
                </Label>
                <p className="text-sm text-slate-400">
                  {isOpen ? 'Poll is open for voting' : 'Poll is closed'}
                </p>
              </div>
              <Switch
                id="status"
                checked={isOpen}
                onCheckedChange={setIsOpen}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSavePoll}
                disabled={saving}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Publish'
                )}
              </Button>
              <Button
                onClick={() => setShowBuilder(false)}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Poll List */}
      <div className="space-y-4">
        {polls.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <BarChart3 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-400 mb-2">No Polls Yet</h3>
              <p className="text-slate-500 mb-4">Create your first poll to get started</p>
              <Button onClick={handleNewPoll} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Poll
              </Button>
            </CardContent>
          </Card>
        ) : (
          polls.map(poll => (
            <Card key={poll.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl text-white">{poll.title}</CardTitle>
                      {poll.status === 'open' ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                          Closed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-300">
                      {poll.description}
                    </CardDescription>
                    <p className="text-slate-400 text-sm mt-2">
                      {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleToggleStatus(poll)}
                    variant={poll.status === 'open' ? 'outline' : 'default'}
                    className={
                      poll.status === 'open'
                        ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                        : 'bg-green-600 hover:bg-green-700'
                    }
                  >
                    {poll.status === 'open' ? 'Close Poll' : 'Open Poll'}
                  </Button>
                  <Button
                    onClick={() => handleEditPoll(poll)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => setShowResults(poll.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                  <Button
                    onClick={() => handleExportCSV(poll)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(poll.id)}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Results Modal */}
      {showResults && (
        <PollResults
          pollId={showResults}
          onClose={() => setShowResults(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Poll</DialogTitle>
            <DialogDescription className="text-slate-300">
              Are you sure you want to delete this poll? This action cannot be undone.
              All votes will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDeletePoll(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}