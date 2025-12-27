import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  image?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

interface QuizQuestionProps {
  quizId: string;
  userId: string;
  currentQuestion: number;
  onNext: (quizId: string, nextQuestion: number) => void;
  onComplete: (quizId: string, score: number, totalQuestions: number) => void;
}

export function QuizQuestion({ 
  quizId, 
  userId, 
  currentQuestion, 
  onNext, 
  onComplete 
}: QuizQuestionProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuiz();
    loadProgress();
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

  const loadProgress = async () => {
    try {
      const { data } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .eq('key', `quiz_progress:${userId}:${quizId}`)
        .single();

      if (data) {
        const progressData = JSON.parse(data.value);
        setAnswers(progressData.answers || []);
      }
    } catch (error) {
      // No progress found, start fresh
    }
  };

  const saveProgress = async (newAnswers: number[]) => {
    try {
      await supabase
        .from('kv_store_19c6936e')
        .upsert({
          key: `quiz_progress:${userId}:${quizId}`,
          value: JSON.stringify({
            answers: newAnswers,
            currentQuestion,
            timestamp: new Date().toISOString()
          })
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer || !quiz) return;

    const answerIndex = parseInt(selectedAnswer);
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    await saveProgress(newAnswers);

    const nextIndex = currentQuestion + 1;
    
    if (nextIndex >= quiz.questions.length) {
      // Quiz complete - calculate score
      await submitQuiz(newAnswers);
    } else {
      // Move to next question
      setSelectedAnswer('');
      onNext(quizId, nextIndex);
    }
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    if (!quiz) return;

    setSubmitting(true);
    try {
      // Calculate score
      let correctCount = 0;
      quiz.questions.forEach((question, index) => {
        if (finalAnswers[index] === question.correctAnswer) {
          correctCount++;
        }
      });

      // Save submission
      const submission = {
        userId,
        quizId,
        answers: finalAnswers,
        score: correctCount,
        totalQuestions: quiz.questions.length,
        timestamp: new Date().toISOString()
      };

      await supabase
        .from('kv_store_19c6936e')
        .insert({
          key: `quiz_submission:${userId}:${quizId}`,
          value: JSON.stringify(submission)
        });

      // Clean up progress
      await supabase
        .from('kv_store_19c6936e')
        .delete()
        .eq('key', `quiz_progress:${userId}:${quizId}`);

      onComplete(quizId, correctCount, quiz.questions.length);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz');
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
            <p className="text-slate-400">Loading question...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz || currentQuestion >= quiz.questions.length) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-12 pb-12 text-center">
            <p className="text-slate-400">Question not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const progressPercentage = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </span>
          <span className="text-blue-400">{Math.round(progressPercentage)}%</span>
        </div>
        <Progress value={progressPercentage} className="h-2" />
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="mb-4">
            <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm mb-4">
              Question {currentQuestion + 1}
            </div>
          </div>
          <CardTitle className="text-2xl md:text-3xl text-white leading-tight">
            {question.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {question.image && (
            <div className="w-full h-64 bg-slate-900 rounded-lg overflow-hidden">
              <img
                src={question.image}
                alt="Question"
                className="w-full h-full object-contain"
              />
            </div>
          )}

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
            <div className="space-y-3">
              {question.options.map((option, index) => (
                <Label
                  key={index}
                  htmlFor={`option-${index}`}
                  className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedAnswer === index.toString()
                      ? 'bg-blue-500/10 border-blue-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <span className="text-white text-base md:text-lg flex-1">{option}</span>
                </Label>
              ))}
            </div>
          </RadioGroup>

          {isLastQuestion && selectedAnswer && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-400">Final Question</p>
                  <p className="text-slate-300 text-sm mt-1">
                    Clicking submit will complete the quiz. You cannot retake it.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleNext}
            disabled={!selectedAnswer || submitting}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting Quiz...</span>
              </div>
            ) : isLastQuestion ? (
              'Submit Quiz'
            ) : (
              'Next Question'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}