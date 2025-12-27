import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface Quiz {
  id: string;
  title: string;
  questions: any[];
}

interface Submission {
  userId: string;
  quizId: string;
  answers: number[];
  score: number;
  totalQuestions: number;
  timestamp: string;
}

interface QuizMonitoringProps {
  quizId: string;
  onClose: () => void;
}

export function QuizMonitoring({ quizId, onClose }: QuizMonitoringProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizData();
    setupRealtimeSubscription();
  }, [quizId]);

  const loadQuizData = async () => {
    try {
      // Load quiz details
      const { data: quizData, error: quizError } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `quiz:${quizId}`)
        .single();

      if (quizError) throw quizError;

      if (quizData) {
        const quiz = JSON.parse(quizData.value);
        setQuiz(quiz);
      }

      // Load submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', `quiz_submission:%:${quizId}`);

      if (submissionsError) throw submissionsError;

      if (submissionsData) {
        const subs = submissionsData
          .map(item => {
            try {
              return JSON.parse(item.value);
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        setSubmissions(subs);
      }
    } catch (error) {
      console.error('Error loading quiz data:', error);
      toast.error('Failed to load quiz data');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`quiz-monitoring-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: `key=like.quiz_submission:%:${quizId}`
        },
        () => {
          loadQuizData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const getAverageScore = () => {
    if (submissions.length === 0) return 0;
    const total = submissions.reduce((sum, sub) => sum + sub.score, 0);
    return Math.round((total / submissions.length / (quiz?.questions.length || 1)) * 100);
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-white">Quiz Monitoring</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Loading quiz data...</p>
            </div>
          </div>
        ) : quiz ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl text-white mb-2">{quiz.title}</h3>
              <p className="text-slate-400">
                {quiz.questions.length} questions
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">Total Submissions</span>
                </div>
                <p className="text-3xl text-white">{submissions.length}</p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">Average Score</span>
                </div>
                <p className="text-3xl text-white">{getAverageScore()}%</p>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-5 h-5 text-slate-400" />
                  <span className="text-slate-300">Status</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                  Live Monitoring
                </Badge>
              </div>
            </div>

            {/* Submissions Table */}
            <div>
              <h4 className="text-lg text-white mb-4">Student Submissions</h4>
              {submissions.length === 0 ? (
                <div className="p-8 text-center bg-slate-900/50 rounded-lg border border-slate-700">
                  <p className="text-slate-400">No submissions yet</p>
                </div>
              ) : (
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-900/50 border-slate-700">
                        <TableHead className="text-slate-300">Student ID</TableHead>
                        <TableHead className="text-slate-300">Score</TableHead>
                        <TableHead className="text-slate-300">Percentage</TableHead>
                        <TableHead className="text-slate-300">Completed At</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission, index) => {
                        const percentage = Math.round(
                          (submission.score / submission.totalQuestions) * 100
                        );
                        return (
                          <TableRow key={index} className="border-slate-700">
                            <TableCell className="text-slate-300">
                              {submission.userId.substring(0, 8)}...
                            </TableCell>
                            <TableCell className="text-white">
                              {submission.score}/{submission.totalQuestions}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-semibold ${
                                  percentage >= 70
                                    ? 'text-green-400'
                                    : percentage >= 50
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                                }`}
                              >
                                {percentage}%
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-400 text-sm">
                              {formatDate(submission.timestamp)}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                                Completed
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-slate-400">Quiz not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}