import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { ActivityFeed } from './ActivityFeed';
import { PollDetail } from './PollDetail';
import { QuizEntry } from './QuizEntry';
import { QuizQuestion } from './QuizQuestion';
import { QuizResults } from './QuizResults';
import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface AudienceDashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewState = 
  | { type: 'feed' }
  | { type: 'poll'; pollId: string }
  | { type: 'quiz-entry'; quizId: string }
  | { type: 'quiz-question'; quizId: string; currentQuestion: number }
  | { type: 'quiz-results'; quizId: string; score: number; totalQuestions: number };

export function AudienceDashboard({ user, onLogout }: AudienceDashboardProps) {
  const [viewState, setViewState] = useState<ViewState>({ type: 'feed' });

  const handleViewPoll = (pollId: string) => {
    setViewState({ type: 'poll', pollId });
  };

  const handleStartQuiz = (quizId: string) => {
    setViewState({ type: 'quiz-entry', quizId });
  };

  const handleBeginQuiz = (quizId: string) => {
    setViewState({ type: 'quiz-question', quizId, currentQuestion: 0 });
  };

  const handleNextQuestion = (quizId: string, nextQuestion: number) => {
    setViewState({ type: 'quiz-question', quizId, currentQuestion: nextQuestion });
  };

  const handleQuizComplete = (quizId: string, score: number, totalQuestions: number) => {
    setViewState({ type: 'quiz-results', quizId, score, totalQuestions });
  };

  const handleBackToFeed = () => {
    setViewState({ type: 'feed' });
  };

  const getUserInitials = () => {
    const name = user.user_metadata?.name || user.email || 'User';
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10 border-2 border-blue-500">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.name} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm text-white">{user.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-slate-400">{user.email}</p>
                </div>
              </div>
              <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-400 focus:bg-red-500/10">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {viewState.type === 'feed' && (
          <ActivityFeed
            userId={user.id}
            onViewPoll={handleViewPoll}
            onStartQuiz={handleStartQuiz}
          />
        )}

        {viewState.type === 'poll' && (
          <PollDetail
            pollId={viewState.pollId}
            userId={user.id}
            onBack={handleBackToFeed}
          />
        )}

        {viewState.type === 'quiz-entry' && (
          <QuizEntry
            quizId={viewState.quizId}
            userId={user.id}
            onBack={handleBackToFeed}
            onBegin={handleBeginQuiz}
          />
        )}

        {viewState.type === 'quiz-question' && (
          <QuizQuestion
            quizId={viewState.quizId}
            userId={user.id}
            currentQuestion={viewState.currentQuestion}
            onNext={handleNextQuestion}
            onComplete={handleQuizComplete}
          />
        )}

        {viewState.type === 'quiz-results' && (
          <QuizResults
            quizId={viewState.quizId}
            score={viewState.score}
            totalQuestions={viewState.totalQuestions}
            onBackToFeed={handleBackToFeed}
          />
        )}
      </main>
    </div>
  );
}
