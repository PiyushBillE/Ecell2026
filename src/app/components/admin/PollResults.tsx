import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Progress } from '../ui/progress';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
  totalVotes: number;
}

interface PollResultsProps {
  pollId: string;
  onClose: () => void;
}

export function PollResults({ pollId, onClose }: PollResultsProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoll();
    setupRealtimeSubscription();
  }, [pollId]);

  const loadPoll = async () => {
    try {
      const { data, error } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `poll:${pollId}`)
        .single();

      if (error) throw error;

      if (data) {
        const pollData = JSON.parse(data.value);
        setPoll(pollData);
      }
    } catch (error) {
      console.error('Error loading poll results:', error);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`poll-results-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: `key=eq.poll:${pollId}`
        },
        (payload) => {
          const updatedPoll = JSON.parse(payload.new.value);
          setPoll(updatedPoll);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const getPercentage = (votes: number) => {
    if (!poll || poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Live Poll Results</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading results...</p>
            </div>
          </div>
        ) : poll ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl text-white mb-2">{poll.title}</h3>
              <p className="text-slate-400">
                Total Votes: {poll.totalVotes}
              </p>
            </div>

            <div className="space-y-4">
              {poll.options.map((option) => {
                const percentage = getPercentage(option.votes);

                return (
                  <div
                    key={option.id}
                    className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white text-lg">{option.text}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{option.votes} votes</span>
                        <span className="text-2xl text-blue-400 font-semibold min-w-[60px] text-right">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                );
              })}
            </div>

            {/* Bar Chart Visualization */}
            <div className="pt-6 border-t border-slate-700">
              <h4 className="text-lg text-white mb-4">Distribution</h4>
              <div className="space-y-3">
                {poll.options.map((option) => {
                  const percentage = getPercentage(option.votes);
                  const maxVotes = Math.max(...poll.options.map(o => o.votes));
                  const barWidth = maxVotes > 0 ? (option.votes / maxVotes) * 100 : 0;

                  return (
                    <div key={option.id} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">{option.text}</span>
                        <span className="text-slate-400">{option.votes}</span>
                      </div>
                      <div className="h-8 bg-slate-900/50 rounded overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${barWidth}%` }}
                        >
                          {barWidth > 20 && (
                            <span className="text-white text-sm font-semibold">
                              {percentage}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-slate-400">Poll not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}