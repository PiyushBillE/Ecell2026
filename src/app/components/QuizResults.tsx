import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Trophy, CheckCircle2, XCircle, Award } from 'lucide-react';

interface QuizResultsProps {
  quizId: string;
  score: number;
  totalQuestions: number;
  onBackToFeed: () => void;
}

export function QuizResults({ score, totalQuestions, onBackToFeed }: QuizResultsProps) {
  const percentage = Math.round((score / totalQuestions) * 100);
  const incorrect = totalQuestions - score;

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: 'Excellent!', icon: Trophy, color: 'text-yellow-400' };
    if (percentage >= 70) return { text: 'Great Job!', icon: Award, color: 'text-blue-400' };
    if (percentage >= 50) return { text: 'Good Effort!', icon: CheckCircle2, color: 'text-green-400' };
    return { text: 'Keep Learning!', icon: CheckCircle2, color: 'text-slate-400' };
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="text-center pb-0">
          <div className="mb-6">
            <div className={`w-24 h-24 mx-auto mb-4 bg-gradient-to-br ${
              percentage >= 70 ? 'from-blue-500 to-blue-600' : 'from-slate-600 to-slate-700'
            } rounded-full flex items-center justify-center shadow-lg`}>
              <PerformanceIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className={`text-4xl ${performance.color} mb-2`}>
            {performance.text}
          </CardTitle>
          <p className="text-slate-300 text-lg">Quiz Completed</p>
        </CardHeader>

        <CardContent className="space-y-6 pt-8">
          {/* Score Display */}
          <div className="text-center">
            <div className="inline-block p-8 bg-slate-900/50 rounded-2xl border border-slate-700">
              <div className="text-6xl text-white mb-2">
                {percentage}%
              </div>
              <p className="text-slate-400">Your Score</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Overall Performance</span>
              <span className="text-blue-400">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-4" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl text-white">{score}</p>
                </div>
              </div>
              <p className="text-green-400 text-sm">Correct Answers</p>
            </div>

            <div className="p-6 bg-red-500/10 border border-red-500/50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl text-white">{incorrect}</p>
                </div>
              </div>
              <p className="text-red-400 text-sm">Incorrect Answers</p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700">
            <h3 className="text-white text-lg mb-3">Summary</h3>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span>Total Questions:</span>
                <span className="text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Questions Answered:</span>
                <span className="text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span>Accuracy:</span>
                <span className="text-white">{percentage}%</span>
              </div>
            </div>
          </div>

          {/* Completion Message */}
          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-blue-400">Quiz submission recorded successfully!</p>
            <p className="text-slate-400 text-sm mt-1">Your results have been saved</p>
          </div>

          {/* Back Button */}
          <Button
            onClick={onBackToFeed}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-lg"
          >
            Back to Activity Feed
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
