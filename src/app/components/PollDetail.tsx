import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from './ui/progress';

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
}

interface PollDetailProps {
  pollId: string;
  userId: string;
  onBack: () => void;
}

export function PollDetail({ pollId, userId, onBack }: PollDetailProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadPoll();
    checkIfVoted();
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
      console.error('Error loading poll:', error);
      toast.error('Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const checkIfVoted = async () => {
    try {
      const { data } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `vote:${userId}:${pollId}`)
        .single();

      if (data) {
        setHasVoted(true);
        const voteData = JSON.parse(data.value);
        setSelectedOption(voteData.optionId);
      }
    } catch (error) {
      // No vote found, that's okay
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`poll-${pollId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: `key=eq.poll:${pollId}`
        },
        (payload) => {
          setSyncing(true);
          const updatedPoll = JSON.parse(payload.new.value);
          setPoll(updatedPoll);
          setTimeout(() => setSyncing(false), 500);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleSubmitVote = async () => {
    if (!selectedOption || !poll) return;

    setSubmitting(true);
    try {
      // Record the vote
      const voteRecord = {
        userId,
        pollId,
        optionId: selectedOption,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('kv_store_19c6936e')
        .upsert({
          key: `vote:${userId}:${pollId}`,
          value: JSON.stringify(voteRecord)
        });

      // Update poll vote counts
      const updatedOptions = poll.options.map(opt =>
        opt.id === selectedOption
          ? { ...opt, votes: opt.votes + 1 }
          : opt
      );

      const updatedPoll = {
        ...poll,
        options: updatedOptions,
        totalVotes: poll.totalVotes + 1
      };

      await supabase
        .from('kv_store_19c6936e')
        .update({
          value: JSON.stringify(updatedPoll)
        })
        .eq('key', `poll:${pollId}`);

      setHasVoted(true);
      setPoll(updatedPoll);
      toast.success('Vote submitted successfully!');
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading poll...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-400">Poll not found</p>
            <Button onClick={onBack} className="mt-4">Back to Feed</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPercentage = (votes: number) => {
    if (poll.totalVotes === 0) return 0;
    return Math.round((votes / poll.totalVotes) * 100);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        onClick={onBack}
        variant="ghost"
        className="mb-6 text-slate-300 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Feed
      </Button>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-start justify-between gap-4 mb-4">
            <CardTitle className="text-3xl text-white">{poll.title}</CardTitle>
            <div className="flex gap-2">
              {syncing && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Syncing
                </Badge>
              )}
              {poll.status === 'open' ? (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse">
                  Live
                </Badge>
              ) : (
                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                  Closed
                </Badge>
              )}
            </div>
          </div>
          <p className="text-slate-300 text-lg">{poll.description}</p>
          {poll.totalVotes > 0 && (
            <p className="text-slate-400 text-sm mt-2">
              {poll.totalVotes} {poll.totalVotes === 1 ? 'vote' : 'votes'}
            </p>
          )}
        </CardHeader>

        <CardContent>
          {hasVoted || poll.status === 'closed' ? (
            // Show Results
            <div className="space-y-6">
              {hasVoted && poll.status === 'open' && (
                <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-400">You have already voted</p>
                </div>
              )}

              {poll.status === 'closed' && (
                <div className="flex items-center gap-2 p-4 bg-gray-500/10 border border-gray-500/50 rounded-lg">
                  <Lock className="w-5 h-5 text-gray-400" />
                  <p className="text-gray-400">Poll Closed</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xl text-white mb-4">Live Results</h3>
                {poll.options.map((option) => {
                  const percentage = getPercentage(option.votes);
                  const isUserChoice = option.id === selectedOption;

                  return (
                    <div
                      key={option.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isUserChoice
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-slate-900/50 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white text-lg flex items-center gap-2">
                          {option.text}
                          {isUserChoice && (
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                          )}
                        </span>
                        <span className="text-2xl text-blue-400">{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-3" />
                      <p className="text-slate-400 text-sm mt-2">
                        {option.votes} {option.votes === 1 ? 'vote' : 'votes'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            // Show Voting Interface
            <div className="space-y-6">
              <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                <div className="space-y-3">
                  {poll.options.map((option) => (
                    <Label
                      key={option.id}
                      htmlFor={option.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedOption === option.id
                          ? 'bg-blue-500/10 border-blue-500'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <RadioGroupItem value={option.id} id={option.id} />
                      <span className="text-white text-lg flex-1">{option.text}</span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>

              <Button
                onClick={handleSubmitVote}
                disabled={!selectedOption || submitting}
                className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Vote...</span>
                  </div>
                ) : (
                  'Submit Vote'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}