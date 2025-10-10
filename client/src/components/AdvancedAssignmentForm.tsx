import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Brain } from 'lucide-react';

interface AdvancedAssignmentFormProps {
  onSubmit: (assignment: any) => void;
  courses: any[];
  loading?: boolean;
}

export function AdvancedAssignmentForm({ onSubmit, courses, loading }: AdvancedAssignmentFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseId: '',
    dueDate: '',
    maxScore: 100,
    enableAI: true,
    rubric: {
      content_quality: { max_points: 35, min_words: 150 },
      grammar_style: { max_points: 25 },
      structure_organization: { max_points: 25 },
      critical_thinking: { max_points: 15 }
    }
  });

  const [customRubric, setCustomRubric] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRubricChange = (criterion: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        [criterion]: {
          ...prev.rubric[criterion as keyof typeof prev.rubric],
          [field]: value
        }
      }
    }));
  };

  const addRubricCriterion = () => {
    const newCriterion = `criterion_${Object.keys(formData.rubric).length + 1}`;
    setFormData(prev => ({
      ...prev,
      rubric: {
        ...prev.rubric,
        [newCriterion]: { max_points: 20, min_words: 50 }
      }
    }));
  };

  const removeRubricCriterion = (criterion: string) => {
    const newRubric = { ...formData.rubric };
    delete newRubric[criterion as keyof typeof newRubric];
    setFormData(prev => ({ ...prev, rubric: newRubric }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      rubric: formData.enableAI ? formData.rubric : undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Create Advanced AI Assignment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Assignment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Assignment Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter assignment title"
                required
              />
            </div>
            <div>
              <Label htmlFor="courseId">Course</Label>
              <Select value={formData.courseId} onValueChange={(value) => handleInputChange('courseId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Assignment Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the assignment requirements..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="maxScore">Maximum Score</Label>
              <Input
                id="maxScore"
                type="number"
                value={formData.maxScore}
                onChange={(e) => handleInputChange('maxScore', parseInt(e.target.value))}
                min="1"
                max="1000"
                required
              />
            </div>
          </div>

          {/* AI Features */}
          <div className="flex items-center space-x-2">
            <Switch
              id="enableAI"
              checked={formData.enableAI}
              onCheckedChange={(checked) => handleInputChange('enableAI', checked)}
            />
            <Label htmlFor="enableAI">Enable Advanced AI Grading</Label>
          </div>

          {/* Advanced Rubric */}
          {formData.enableAI && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Grading Rubric</CardTitle>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="customRubric"
                    checked={customRubric}
                    onCheckedChange={setCustomRubric}
                  />
                  <Label htmlFor="customRubric">Use Custom Rubric</Label>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(formData.rubric).map(([criterion, config]) => (
                    <div key={criterion} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium capitalize">
                          {criterion.replace('_', ' ')}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRubricCriterion(criterion)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Max Points</Label>
                          <Input
                            type="number"
                            value={config.max_points}
                            onChange={(e) => handleRubricChange(criterion, 'max_points', parseInt(e.target.value))}
                            min="1"
                            max="100"
                          />
                        </div>
                        {config.min_words && (
                          <div>
                            <Label>Min Words</Label>
                            <Input
                              type="number"
                              value={config.min_words}
                              onChange={(e) => handleRubricChange(criterion, 'min_words', parseInt(e.target.value))}
                              min="10"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addRubricCriterion}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rubric Criterion
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Assignment...' : 'Create Advanced AI Assignment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
