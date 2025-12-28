import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { QuizQuestion } from './QuizQuestion';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  status: 'open' | 'closed';
}

interface QuizEntryProps {
  quizId: string;
  userId: string;
  onBack: () => void;
  onBegin: (quizId: string) => void;
}

export function QuizEntry({ quizId, userId, onBack, onBegin }: QuizEntryProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
    checkIfAttempted();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const { data, error } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `quiz:${quizId}`)
        .single();

      if (error) throw error;

      if (data) {
        const quizData = JSON.parse(data.value);
        setQuiz(quizData);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      toast.error('Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const checkIfAttempted = async () => {
    try {
      const { data } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `quiz_submission:${userId}:${quizId}`)
        .single();

      if (data) {
        setHasAttempted(true);
      }
    } catch (error) {
      // No attempt found, that's okay
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Loading quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-400">Quiz not found</p>
            <Button onClick={onBack} className="mt-4">Back to Feed</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {quiz.status === 'open' ? (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse">
                Live
              </Badge>
            ) : (
              <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                Closed
              </Badge>
            )}
          </div>
          <CardTitle className="text-4xl text-white mb-4">{quiz.title}</CardTitle>
          <CardDescription className="text-slate-300 text-lg">
            {quiz.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-white">Quiz Information</p>
                <p className="text-slate-400 text-sm">Please read carefully before starting</p>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-700 pt-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">1</span>
                </div>
                <div>
                  <p className="text-white">Total Questions</p>
                  <p className="text-slate-400 text-sm">{quiz.questions?.length || 0} questions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">2</span>
                </div>
                <div>
                  <p className="text-white">One Attempt Only</p>
                  <p className="text-slate-400 text-sm">You cannot retake this quiz once submitted</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">3</span>
                </div>
                <div>
                  <p className="text-white">No Going Back</p>
                  <p className="text-slate-400 text-sm">You cannot return to previous questions</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">4</span>
                </div>
                <div>
                  <p className="text-white">Answer All Questions</p>
                  <p className="text-slate-400 text-sm">Each question must be answered to proceed</p>
                </div>
              </div>
            </div>
          </div>

          {hasAttempted ? (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-xl text-green-400 mb-2">Quiz Already Completed</h3>
              <p className="text-slate-300">You have already submitted this quiz</p>
            </div>
          ) : quiz.status === 'closed' ? (
            <div className="bg-gray-500/10 border border-gray-500/50 rounded-lg p-6 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-xl text-gray-400 mb-2">Quiz Closed</h3>
              <p className="text-slate-300">This quiz is no longer accepting submissions</p>
            </div>
          ) : (
            <Button
              onClick={() => onBegin(quizId)}
              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
            >
              Start Quiz
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}