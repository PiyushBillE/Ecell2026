import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Badge } from './ui/badge';
import { Vote, FileQuestion, Loader2, Gift } from 'lucide-react';
import { PollDetailPublic } from './PollDetailPublic';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
  image?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
}

interface PublicActivityFeedProps {
  onLoginPrompt: () => void;
}

type ViewState = 
  | { type: 'feed' }
  | { type: 'poll'; pollId: string };

export function PublicActivityFeed({ onLoginPrompt }: PublicActivityFeedProps) {
  const [viewState, setViewState] = useState<ViewState>({ type: 'feed' });
  const [activeTab, setActiveTab] = useState('polls');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    setupRealtimeSubscriptions();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Load polls
      const pollsData = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', 'poll:%')
        .order('created_at', { ascending: false });

      if (pollsData.data) {
        const pollsList = pollsData.data
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

      // Load quizzes
      const quizzesData = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', 'quiz:%')
        .order('created_at', { ascending: false });

      if (quizzesData.data) {
        const quizzesList = quizzesData.data
          .map(item => {
            try {
              return JSON.parse(item.value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        setQuizzes(quizzesList);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    const pollsChannel = supabase
      .channel('public-polls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: 'key=like.poll:%'
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    const quizzesChannel = supabase
      .channel('public-quizzes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: 'key=like.quiz:%'
        },
        () => {
          loadActivities();
        }
      )
      .subscribe();

    return () => {
      pollsChannel.unsubscribe();
      quizzesChannel.unsubscribe();
    };
  };

  const getStatusBadge = (status: string) => {
    if (status === 'open') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse">Live</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Closed</Badge>;
  };

  const handleViewPoll = (pollId: string) => {
    setViewState({ type: 'poll', pollId });
  };

  const handleBackToFeed = () => {
    setViewState({ type: 'feed' });
  };

  if (viewState.type === 'poll') {
    return (
      <PollDetailPublic
        pollId={viewState.pollId}
        onBack={handleBackToFeed}
        onLoginRequired={onLoginPrompt}
      />
    );
  }

  const activePollsCount = polls.filter(p => p.status === 'open').length;
  const activeQuizzesCount = quizzes.filter(q => q.status === 'open').length;

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
            onClick={onLoginPrompt}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading activities...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl text-white mb-2">Activity Feed</h2>
              <p className="text-slate-400">Discover live polls, quizzes, and events</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700">
                <TabsTrigger value="polls" className="data-[state=active]:bg-blue-600">
                  <Vote className="w-4 h-4 mr-2" />
                  Polls
                  {activePollsCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {activePollsCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="quizzes" className="data-[state=active]:bg-blue-600">
                  <FileQuestion className="w-4 h-4 mr-2" />
                  Quizzes
                  {activeQuizzesCount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                      {activeQuizzesCount}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="events" className="data-[state=active]:bg-blue-600">
                  <Gift className="w-4 h-4 mr-2" />
                  Events
                </TabsTrigger>
              </TabsList>

              <TabsContent value="polls" className="mt-6 space-y-4">
                {polls.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-12 pb-12 text-center">
                      <Vote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl text-slate-400 mb-2">No Polls Available</h3>
                      <p className="text-slate-500">Check back soon for new polls!</p>
                    </CardContent>
                  </Card>
                ) : (
                  polls.map(poll => (
                    <Card key={poll.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => handleViewPoll(poll.id)}>
                      {poll.image && (
                        <div className="w-full h-48 bg-slate-900 overflow-hidden rounded-t-lg">
                          <img
                            src={poll.image}
                            alt={poll.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-2xl text-white mb-2">{poll.title}</CardTitle>
                            <CardDescription className="text-slate-300 text-base">
                              {poll.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(poll.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() => handleViewPoll(poll.id)}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                        >
                          View Poll
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="quizzes" className="mt-6 space-y-4">
                {quizzes.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="pt-12 pb-12 text-center">
                      <FileQuestion className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                      <h3 className="text-xl text-slate-400 mb-2">No Quizzes Available</h3>
                      <p className="text-slate-500">Check back soon for new quizzes!</p>
                    </CardContent>
                  </Card>
                ) : (
                  quizzes.map(quiz => (
                    <Card key={quiz.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <CardTitle className="text-2xl text-white mb-2">{quiz.title}</CardTitle>
                            <CardDescription className="text-slate-300 text-base">
                              {quiz.description}
                            </CardDescription>
                          </div>
                          {getStatusBadge(quiz.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={onLoginPrompt}
                          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                        >
                          Sign in to Take Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Gift className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl text-slate-400 mb-2">Events Coming Soon</h3>
                    <p className="text-slate-500">Giveaways and special events will appear here</p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}