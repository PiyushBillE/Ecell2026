import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Plus, Trash2, Loader2, FileQuestion, Users, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { QuizMonitoring } from './QuizMonitoring';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

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
  description: string;
  questions: QuizQuestion[];
  status: 'open' | 'closed';
  created_at: string;
}

export function QuizManagement() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showMonitoring, setShowMonitoring] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([
    {
      id: 'q1',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      image: '',
    }
  ]);
  const [isOpen, setIsOpen] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadQuizzes();
    setupRealtimeSubscription();
  }, []);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kv_store_19c6936e')
        .select('value')
        .like('key', 'quiz:%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const quizzesList = data
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
      console.error('Error loading quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('admin-quizzes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kv_store_19c6936e',
          filter: 'key=like.quiz:%'
        },
        () => {
          loadQuizzes();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleNewQuiz = () => {
    setEditingQuiz(null);
    setTitle('');
    setDescription('');
    setQuestions([
      {
        id: 'q1',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        image: '',
      }
    ]);
    setIsOpen(true);
    setShowBuilder(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description);
    setQuestions(quiz.questions);
    setIsOpen(quiz.status === 'open');
    setShowBuilder(true);
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: `q${questions.length + 1}`,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        image: '',
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuizQuestion, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleOptionChange = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(newQuestions);
  };

  const handleSaveQuiz = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    const validQuestions = questions.filter(q => 
      q.question.trim() && q.options.every(o => o.trim())
    );

    if (validQuestions.length === 0) {
      toast.error('At least one complete question is required');
      return;
    }

    setSaving(true);
    try {
      const quizId = editingQuiz?.id || `quiz_${Date.now()}`;
      const quizData: Quiz = {
        id: quizId,
        title: title.trim(),
        description: description.trim(),
        questions: validQuestions,
        status: isOpen ? 'open' : 'closed',
        created_at: editingQuiz?.created_at || new Date().toISOString(),
      };

      const { error } = await supabase
        .from('kv_store_19c6936e')
        .upsert({
          key: `quiz:${quizId}`,
          value: JSON.stringify(quizData),
          created_at: quizData.created_at,
        });

      if (error) throw error;

      toast.success(editingQuiz ? 'Quiz updated!' : 'Quiz created!');
      setShowBuilder(false);
      loadQuizzes();
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast.error('Failed to save quiz');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (quiz: Quiz) => {
    try {
      const updatedQuiz = {
        ...quiz,
        status: quiz.status === 'open' ? 'closed' : 'open',
      };

      const { error } = await supabase
        .from('kv_store_19c6936e')
        .update({
          value: JSON.stringify(updatedQuiz),
        })
        .eq('key', `quiz:${quiz.id}`);

      if (error) throw error;

      toast.success(`Quiz ${updatedQuiz.status === 'open' ? 'opened' : 'closed'}`);
      loadQuizzes();
    } catch (error) {
      console.error('Error toggling quiz status:', error);
      toast.error('Failed to update quiz status');
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('kv_store_19c6936e')
        .delete()
        .eq('key', `quiz:${quizId}`);

      if (error) throw error;

      toast.success('Quiz deleted');
      setDeleteConfirm(null);
      loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-white mb-2">Quiz Management</h2>
          <p className="text-slate-400">Create and monitor quizzes</p>
        </div>
        <Button onClick={handleNewQuiz} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-5 h-5 mr-2" />
          Create Quiz
        </Button>
      </div>

      {/* Quiz Builder */}
      {showBuilder && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl text-white">
              {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
            </CardTitle>
            <CardDescription className="text-slate-300">
              Build your quiz with multiple questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quiz-title" className="text-slate-200">
                Quiz Title
              </Label>
              <Input
                id="quiz-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., JavaScript Basics Quiz"
                className="h-12 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quiz-description" className="text-slate-200">
                Description
              </Label>
              <Textarea
                id="quiz-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your quiz..."
                className="min-h-24 bg-slate-900/50 border-slate-600 text-white"
              />
            </div>

            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-slate-200 text-lg">Questions</Label>
                <Button
                  onClick={handleAddQuestion}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-slate-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {questions.map((question, qIndex) => (
                <Card key={question.id} className="bg-slate-900/50 border-slate-600">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white">
                        Question {qIndex + 1}
                      </CardTitle>
                      {questions.length > 1 && (
                        <Button
                          onClick={() => handleRemoveQuestion(qIndex)}
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-slate-200">Question Text</Label>
                      <Textarea
                        value={question.question}
                        onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                        placeholder="Enter your question..."
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-200 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Image URL (Optional)
                      </Label>
                      <Input
                        value={question.image || ''}
                        onChange={(e) => handleQuestionChange(qIndex, 'image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="bg-slate-800 border-slate-600 text-white"
                      />
                    </div>

                    <div className="space-y-3">
                      <Label className="text-slate-200">Options & Correct Answer</Label>
                      <RadioGroup
                        value={question.correctAnswer.toString()}
                        onValueChange={(value) => handleQuestionChange(qIndex, 'correctAnswer', parseInt(value))}
                      >
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} />
                            <Input
                              value={option}
                              onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1 bg-slate-800 border-slate-600 text-white"
                            />
                            <Label htmlFor={`q${qIndex}-o${oIndex}`} className="text-xs text-slate-400 min-w-[60px]">
                              {question.correctAnswer === oIndex ? '✓ Correct' : ''}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
              <div>
                <Label htmlFor="quiz-status" className="text-slate-200">
                  Quiz Status
                </Label>
                <p className="text-sm text-slate-400">
                  {isOpen ? 'Quiz is open for submissions' : 'Quiz is closed'}
                </p>
              </div>
              <Switch
                id="quiz-status"
                checked={isOpen}
                onCheckedChange={setIsOpen}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSaveQuiz}
                disabled={saving}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Publish'
                )}
              </Button>
              <Button
                onClick={() => setShowBuilder(false)}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quiz List */}
      <div className="space-y-4">
        {quizzes.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <FileQuestion className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl text-slate-400 mb-2">No Quizzes Yet</h3>
              <p className="text-slate-500 mb-4">Create your first quiz to get started</p>
              <Button onClick={handleNewQuiz} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-5 h-5 mr-2" />
                Create Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          quizzes.map(quiz => (
            <Card key={quiz.id} className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl text-white">{quiz.title}</CardTitle>
                      {quiz.status === 'open' ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50 animate-pulse">
                          Live
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
                          Closed
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-slate-300">
                      {quiz.description}
                    </CardDescription>
                    <p className="text-slate-400 text-sm mt-2">
                      {quiz.questions.length} {quiz.questions.length === 1 ? 'question' : 'questions'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleToggleStatus(quiz)}
                    variant={quiz.status === 'open' ? 'outline' : 'default'}
                    className={
                      quiz.status === 'open'
                        ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                        : 'bg-green-600 hover:bg-green-700'
                    }
                  >
                    {quiz.status === 'open' ? 'Close Quiz' : 'Open Quiz'}
                  </Button>
                  <Button
                    onClick={() => handleEditQuiz(quiz)}
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => setShowMonitoring(quiz.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Monitor Students
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(quiz.id)}
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Monitoring Modal */}
      {showMonitoring && (
        <QuizMonitoring
          quizId={showMonitoring}
          onClose={() => setShowMonitoring(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Quiz</DialogTitle>
            <DialogDescription className="text-slate-300">
              Are you sure you want to delete this quiz? This action cannot be undone.
              All submissions will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setDeleteConfirm(null)}
              variant="outline"
              className="border-slate-600 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirm && handleDeleteQuiz(deleteConfirm)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}