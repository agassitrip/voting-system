import { useState, useEffect } from 'react'
import { Plus, ThumbsUp, Lightbulb, Trash2, Calendar, TrendingUp, TrendingDown, Link, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Feature {
  id: string
  title: string
  description: string
  vote_count: number
  created_at: string
  created_by: string
  anchor_to?: string
  archived: boolean
  anchored_features: string[]
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [newFeature, setNewFeature] = useState({ title: '', description: '', anchor_to: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sortBy, setSortBy] = useState('votes')
  const [sortOrder, setSortOrder] = useState('desc')
  const [expandedFeatures, setExpandedFeatures] = useState<Set<string>>(new Set())
  const [archivingFeatures, setArchivingFeatures] = useState<Set<string>>(new Set())

  const fetchFeatures = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`${API_BASE_URL}/features?sort_by=${sortBy}&order=${sortOrder}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setFeatures(data)
      }
    } catch (error) {
      console.error('Error fetching features:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createFeature = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFeature.title.trim() || !newFeature.description.trim()) return

    try {
      setIsSubmitting(true)
      const payload = {
        title: newFeature.title,
        description: newFeature.description,
        ...(newFeature.anchor_to && newFeature.anchor_to !== 'none' && { anchor_to: newFeature.anchor_to })
      }
      
      const response = await fetch(`${API_BASE_URL}/features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        setNewFeature({ title: '', description: '', anchor_to: '' })
        fetchFeatures()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error creating feature')
      }
    } catch (error) {
      console.error('Error creating feature:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const voteForFeature = async (featureId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/features/${featureId}/vote`, {
        method: 'POST',
        credentials: 'include'
      })

      if (response.ok) {
        fetchFeatures()
      } else {
        const error = await response.json()
        alert(error.detail || 'Error voting for feature')
      }
    } catch (error) {
      console.error('Error voting for feature:', error)
    }
  }

  const archiveFeature = async (featureId: string) => {
    try {
      setArchivingFeatures(prev => new Set([...prev, featureId]))
      
      setTimeout(async () => {
        const response = await fetch(`${API_BASE_URL}/features/${featureId}/archive`, {
          method: 'POST',
          credentials: 'include'
        })

        if (response.ok) {
          fetchFeatures()
        } else {
          const error = await response.json()
          alert(error.detail || 'Error archiving feature')
        }
        
        setArchivingFeatures(prev => {
          const newSet = new Set(prev)
          newSet.delete(featureId)
          return newSet
        })
      }, 500)
    } catch (error) {
      console.error('Error archiving feature:', error)
      setArchivingFeatures(prev => {
        const newSet = new Set(prev)
        newSet.delete(featureId)
        return newSet
      })
    }
  }

  const toggleExpanded = (featureId: string) => {
    setExpandedFeatures(prev => {
      const newSet = new Set(prev)
      if (newSet.has(featureId)) {
        newSet.delete(featureId)
      } else {
        newSet.add(featureId)
      }
      return newSet
    })
  }

  const handleSortChange = (newSortBy: string, newOrder: string) => {
    setSortBy(newSortBy)
    setSortOrder(newOrder)
  }

  useEffect(() => {
    fetchFeatures()
  }, [sortBy, sortOrder])

  const topLevelFeatures = features.filter(f => !f.anchor_to)
  
  const getAnchoredFeatures = (parentId: string) => {
    return features.filter(f => f.anchor_to === parentId)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Lightbulb className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Feature Voting System</h1>
          </div>
          <p className="text-gray-600">Submit your ideas and vote for the features you want to see!</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Submit New Feature
            </CardTitle>
            <CardDescription>
              Share your idea for a new feature that you'd like to see implemented.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createFeature} className="space-y-4">
              <div>
                <Input
                  placeholder="Feature title"
                  value={newFeature.title}
                  onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Describe your feature idea..."
                  value={newFeature.description}
                  onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })}
                  required
                  rows={3}
                />
              </div>
              <div>
                <Select value={newFeature.anchor_to} onValueChange={(value) => setNewFeature({ ...newFeature, anchor_to: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Link to existing feature (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No anchor</SelectItem>
                    {topLevelFeatures.map((feature) => (
                      <SelectItem key={feature.id} value={feature.id}>
                        <div className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          {feature.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Submitting...' : 'Submit Feature'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              Feature Requests ({topLevelFeatures.length})
            </h2>
            <div className="flex items-center gap-2">
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [newSortBy, newOrder] = value.split('-')
                handleSortChange(newSortBy, newOrder)
              }}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="votes-desc">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Most Votes
                    </div>
                  </SelectItem>
                  <SelectItem value="votes-asc">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" />
                      Least Votes
                    </div>
                  </SelectItem>
                  <SelectItem value="date-desc">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Newest First
                    </div>
                  </SelectItem>
                  <SelectItem value="date-asc">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Oldest First
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading features...</p>
            </div>
          ) : topLevelFeatures.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No features yet. Be the first to submit an idea!</p>
              </CardContent>
            </Card>
          ) : (
            topLevelFeatures.map((feature) => {
              const anchoredFeatures = getAnchoredFeatures(feature.id)
              const isExpanded = expandedFeatures.has(feature.id)
              const isArchiving = archivingFeatures.has(feature.id)
              
              return (
                <div key={feature.id} className={`transition-all duration-500 ${isArchiving ? 'opacity-0 scale-95 translate-x-full' : 'opacity-100 scale-100 translate-x-0'}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                            {anchoredFeatures.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(feature.id)}
                                className="p-1 h-6 w-6"
                              >
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </Button>
                            )}
                          </div>
                          <CardDescription className="mt-2">{feature.description}</CardDescription>
                          {anchoredFeatures.length > 0 && (
                            <Badge variant="outline" className="mt-2">
                              {anchoredFeatures.length} linked idea{anchoredFeatures.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge variant="secondary" className="text-sm">
                            {feature.vote_count} votes
                          </Badge>
                          <Button
                            onClick={() => voteForFeature(feature.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Vote
                          </Button>
                          <Button
                            onClick={() => archiveFeature(feature.id)}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && anchoredFeatures.length > 0 && (
                      <CardContent className="pt-0">
                        <div className="border-l-2 border-blue-200 pl-4 space-y-3">
                          <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Link className="h-4 w-4" />
                            Linked Ideas
                          </h4>
                          {anchoredFeatures.map((anchoredFeature) => (
                            <div key={anchoredFeature.id} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium text-sm">{anchoredFeature.title}</h5>
                                  <p className="text-xs text-gray-600 mt-1">{anchoredFeature.description}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3">
                                  <Badge variant="secondary" className="text-xs">
                                    {anchoredFeature.vote_count} votes
                                  </Badge>
                                  <Button
                                    onClick={() => voteForFeature(anchoredFeature.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                  >
                                    <ThumbsUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    onClick={() => archiveFeature(anchoredFeature.id)}
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default App
