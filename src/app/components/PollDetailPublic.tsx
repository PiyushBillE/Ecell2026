import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
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
  status: 'open' | 'closed';
  totalVotes: number;
  image?: string;
}

interface PollDetailPublicProps {
  pollId: string;
  onBack: () => void;
  onLoginRequired: () => void;
}

export function PollDetailPublic({ pollId, onBack, onLoginRequired }: PollDetailPublicProps) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
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
      console.error('Error loading poll:', error);
      toast.error('Failed to load poll');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`poll-public-${pollId}`)
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

  const handleVoteClick = () => {
    if (!selectedOption) {
      toast.error('Please select an option');
      return;
    }
    onLoginRequired();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-slate-400">Loading poll...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-slate-400">Poll not found</p>
                <Button onClick={onBack} className="mt-4">Back to Feed</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white">EC</span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl text-white">E-Cell BVDU</h1>
              <p className="text-xs text-slate-400 hidden md:block">Navi Mumbai</p>
            </div>
          </div>

          <Button
            onClick={onLoginRequired}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
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
            {poll.image && (
              <div className="w-full h-64 md:h-80 bg-slate-900 overflow-hidden rounded-t-lg">
                <img
                  src={poll.image}
                  alt={poll.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-4 mb-4">
                <CardTitle className="text-3xl text-white">{poll.title}</CardTitle>
                <div className="flex gap-2">
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
              {/* Auth Guard Notice */}
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-5 h-5 text-blue-400" />
                  <p className="text-blue-400">Sign in to vote</p>
                </div>
                <p className="text-slate-300 text-sm">
                  You must be signed in to submit your vote
                </p>
              </div>

              {/* Voting Interface (Preview Only) */}
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
                  onClick={handleVoteClick}
                  className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
                >
                  Sign In to Vote
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}