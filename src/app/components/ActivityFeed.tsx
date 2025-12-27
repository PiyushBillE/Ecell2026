import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { User } from '@supabase/supabase-js';
import { Vote, FileQuestion, CheckCircle2, Loader2 } from 'lucide-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'closed';
  created_at: string;
}

interface ActivityFeedProps {
  userId: string;
  onViewPoll: (pollId: string) => void;
  onStartQuiz: (quizId: string) => void;
}

export function ActivityFeed({ userId, onViewPoll, onStartQuiz }: ActivityFeedProps) {
  const [activeTab, setActiveTab] = useState('polls');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [completedPolls, setCompletedPolls] = useState<Set<string>>(new Set());
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    setupRealtimeSubscriptions();
  }, []);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Load polls - use getByPrefix from kv_store instead of direct query
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19c6936e/polls`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPolls(data.polls || []);
      }

      // Load quizzes
      const quizzesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-19c6936e/quizzes`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (quizzesResponse.ok) {
        const data = await quizzesResponse.json();
        setQuizzes(data.quizzes || []);
      }

      // Load user's completed activities
      const votesData = await supabase
        .from('kv_store_19c6936e')
        .select('key')
        .like('key', `vote:${userId}:%`);

      if (votesData.data) {
        const voted = new Set(votesData.data.map(v => v.key.split(':')[2]));
        setCompletedPolls(voted);
      }

      const submissionsData = await supabase
        .from('kv_store_19c6936e')
        .select('key')
        .like('key', `quiz_submission:${userId}:%`);

      if (submissionsData.data) {
        const completed = new Set(submissionsData.data.map(s => s.key.split(':')[2]));
        setCompletedQuizzes(completed);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to poll changes
    const pollsChannel = supabase
      .channel('polls-changes')
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

    // Subscribe to quiz changes
    const quizzesChannel = supabase
      .channel('quizzes-changes')
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

  const getStatusBadge = (status: string, completed: boolean) => {
    if (completed) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Completed</Badge>;
    }
    if (status === 'open') {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse">Live</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">Closed</Badge>;
  };

  const activePollsCount = polls.filter(p => p.status === 'open').length;
  const activeQuizzesCount = quizzes.filter(q => q.status === 'open').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading activities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl text-white mb-2">Activity Feed</h2>
        <p className="text-slate-400">Participate in live polls and quizzes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 border border-slate-700">
          <TabsTrigger value="polls" className="data-[state=active]:bg-blue-600">
            <Vote className="w-4 h-4 mr-2" />
            Active Polls
            {activePollsCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activePollsCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="quizzes" className="data-[state=active]:bg-blue-600">
            <FileQuestion className="w-4 h-4 mr-2" />
            Active Quizzes
            {activeQuizzesCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {activeQuizzesCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="polls" className="mt-6 space-y-4">
          {polls.filter(p => p.status === 'open').length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-12 pb-12 text-center">
                <Vote className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl text-slate-400 mb-2">No Active Polls</h3>
                <p className="text-slate-500">Check back soon for new polls!</p>
              </CardContent>
            </Card>
          ) : (
            polls
              .filter(p => p.status === 'open')
              .map(poll => (
                <Card key={poll.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-white mb-2">{poll.title}</CardTitle>
                        <CardDescription className="text-slate-300 text-base">
                          {poll.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(poll.status, completedPolls.has(poll.id))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => onViewPoll(poll.id)}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                      disabled={completedPolls.has(poll.id)}
                    >
                      {completedPolls.has(poll.id) ? 'View Results' : 'Vote Now'}
                    </Button>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6 space-y-4">
          {quizzes.filter(q => q.status === 'open').length === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-12 pb-12 text-center">
                <FileQuestion className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl text-slate-400 mb-2">No Active Quizzes</h3>
                <p className="text-slate-500">Check back soon for new quizzes!</p>
              </CardContent>
            </Card>
          ) : (
            quizzes
              .filter(q => q.status === 'open')
              .map(quiz => (
                <Card key={quiz.id} className="bg-slate-800/50 border-slate-700 hover:border-blue-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl text-white mb-2">{quiz.title}</CardTitle>
                        <CardDescription className="text-slate-300 text-base">
                          {quiz.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(quiz.status, completedQuizzes.has(quiz.id))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => onStartQuiz(quiz.id)}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg"
                      disabled={completedQuizzes.has(quiz.id)}
                    >
                      {completedQuizzes.has(quiz.id) ? 'View Results' : 'Start Quiz'}
                    </Button>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6 space-y-4">
          {completedPolls.size === 0 && completedQuizzes.size === 0 ? (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="pt-12 pb-12 text-center">
                <CheckCircle2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl text-slate-400 mb-2">No Completed Activities</h3>
                <p className="text-slate-500">Your completed polls and quizzes will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {polls
                .filter(p => completedPolls.has(p.id))
                .map(poll => (
                  <Card key={poll.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Vote className="w-5 h-5 text-blue-400" />
                            <CardTitle className="text-xl text-white">Poll: {poll.title}</CardTitle>
                          </div>
                          <CardDescription className="text-slate-400">
                            {poll.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => onViewPoll(poll.id)}
                        variant="outline"
                        className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}

              {quizzes
                .filter(q => completedQuizzes.has(q.id))
                .map(quiz => (
                  <Card key={quiz.id} className="bg-slate-800/50 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileQuestion className="w-5 h-5 text-blue-400" />
                            <CardTitle className="text-xl text-white">Quiz: {quiz.title}</CardTitle>
                          </div>
                          <CardDescription className="text-slate-400">
                            {quiz.description}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Completed
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => onStartQuiz(quiz.id)}
                        variant="outline"
                        className="w-full h-12 border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        View Results
                      </Button>
                    </CardContent>
                  </Card>
                ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}