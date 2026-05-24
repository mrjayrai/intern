import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  Sparkles,
  Send,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  FileText,
  User,
  Brain
} from 'lucide-react';

const suggestions = [
  {
    id: 1,
    title: 'Predict Onboarding Delays',
    description: 'Identify candidates at risk of missing onboarding deadlines',
    icon: AlertTriangle,
    color: 'amber',
  },
  {
    id: 2,
    title: 'Optimize SLA Performance',
    description: 'Get recommendations to improve workflow efficiency',
    icon: TrendingUp,
    color: 'blue',
  },
  {
    id: 3,
    title: 'Validate Completeness',
    description: 'Check if all onboarding requirements are met',
    icon: CheckCircle,
    color: 'emerald',
  },
  {
    id: 4,
    title: 'Draft Email Templates',
    description: 'Generate professional communication templates',
    icon: FileText,
    color: 'purple',
  },
];

const recentQueries = [
  {
    id: 1,
    query: 'Which candidates are likely to miss their onboarding SLA?',
    response: 'Based on current progress, 3 candidates (Sarah Chen, Michael Rodriguez, Emma Wilson) are at high risk of missing their onboarding SLA. I recommend prioritizing their NDA signing and ID creation processes.',
    timestamp: '10 minutes ago',
  },
  {
    id: 2,
    query: 'Generate an email reminder for pending NDA signatures',
    response: 'Here\'s a professional reminder email:\n\nSubject: Friendly Reminder: NDA Signature Required\n\nDear [Candidate Name],\n\nWe\'re excited to have you join our internship program! To proceed with your onboarding, we need your signature on the Non-Disclosure Agreement...',
    timestamp: '1 hour ago',
  },
  {
    id: 3,
    query: 'What\'s the average onboarding time for Engineering interns?',
    response: 'The average onboarding time for Engineering interns is 3.2 days, which is 15% faster than the company average of 3.8 days. The main efficiency comes from streamlined NDA processing.',
    timestamp: '2 hours ago',
  },
];

export function AIAssistant() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  const handleSend = () => {
    if (!query.trim()) return;

    setMessages([...messages, { role: 'user', content: query }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I\'ve analyzed your request. Based on current data, I can provide insights and recommendations. This is a demonstration of the AI assistant capabilities.',
        },
      ]);
    }, 1000);

    setQuery('');
  };

  return (
    <div className="relative space-y-6 p-8">
      {/* Coming Soon Watermark Overlay */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <div className="rotate-[-32deg] select-none text-[8rem] font-black uppercase tracking-wider text-purple-200/80">
          Coming Soon
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Assistant</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Your intelligent copilot for internship program management
              </p>
            </div>
          </div>
        </div>
        <Badge variant="purple" className="gap-1 px-3 py-1">
          <Brain className="h-3 w-3" />
          Powered by Advanced AI
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          return (
            <Card
              key={suggestion.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-${suggestion.color}-100`}
                >
                  <Icon className={`h-6 w-6 text-${suggestion.color}-600`} />
                </div>
                <h3 className="font-semibold">{suggestion.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{suggestion.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <Sparkles className="h-5 w-5" />
            Chat with AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg bg-white p-12 text-center">
              <Sparkles className="mb-4 h-16 w-16 text-purple-400" />
              <h3 className="text-xl font-semibold text-purple-900">
                How can I assist you today?
              </h3>
              <p className="mt-2 text-sm text-purple-700">
                Ask me anything about your internship program, workflow optimization, or candidate
                insights.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-4 overflow-y-auto rounded-lg bg-white p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-2xl rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-purple-100 text-purple-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about your internship program..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1"
            />
            <Button variant="ai" onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentQueries.map((item) => (
            <div key={item.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-1 h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-600">{item.query}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.response}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{item.timestamp}</p>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Zap className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">234</p>
                <p className="text-sm text-muted-foreground">Queries Answered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-emerald-600" />
              <div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-sm text-muted-foreground">Accuracy Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">45</p>
                <p className="text-sm text-muted-foreground">Actions Automated</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}