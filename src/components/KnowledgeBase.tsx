import { useState, useEffect } from "react";
import { User } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner@2.0.3";
import { Plus, MessageCircle, User as UserIcon, Clock } from "lucide-react";

interface KnowledgeBaseProps {
  user: User;
}

interface ForumReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

interface ForumTopic {
  id: string;
  title: string;
  category: string;
  author: string;
  content: string;
  replies: ForumReply[];
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  "General Discussion",
  "Hardware Support",
  "Software Support",
  "Network Issues",
  "Best Practices",
  "Tips & Tricks",
  "Troubleshooting",
];

export default function KnowledgeBase({ user }: KnowledgeBaseProps) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTopicDialog, setShowTopicDialog] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<ForumTopic | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [replyContent, setReplyContent] = useState("");

  const emptyTopic: Partial<ForumTopic> = {
    title: "",
    category: "General Discussion",
    author: user.name,
    content: "",
  };

  const [formData, setFormData] = useState<Partial<ForumTopic>>(emptyTopic);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/forums`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const data = await response.json();
      setTopics(data.forums || []);
    } catch (error) {
      console.error("Error fetching forum topics:", error);
      toast.error("Failed to load forum topics");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTopic = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/forums`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) throw new Error("Failed to create topic");

      toast.success("Topic created successfully");
      setShowAddDialog(false);
      setFormData(emptyTopic);
      fetchTopics();
    } catch (error) {
      console.error("Error creating topic:", error);
      toast.error("Failed to create topic");
    }
  };

  const handleAddReply = async () => {
    if (!selectedTopic || !replyContent.trim()) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e/forums/${selectedTopic.id}/reply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            author: user.name,
            content: replyContent,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to add reply");

      const data = await response.json();
      setSelectedTopic(data.forum);
      setReplyContent("");
      toast.success("Reply added successfully");
      fetchTopics();
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  const openTopicDialog = (topic: ForumTopic) => {
    setSelectedTopic(topic);
    setShowTopicDialog(true);
    setReplyContent("");
  };

  const filteredTopics = topics.filter((topic) => {
    const matchesSearch =
      topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory =
      selectedCategory === "All" || topic.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      "General Discussion": "bg-blue-100 text-blue-800",
      "Hardware Support": "bg-purple-100 text-purple-800",
      "Software Support": "bg-indigo-100 text-indigo-800",
      "Network Issues": "bg-teal-100 text-teal-800",
      "Best Practices": "bg-green-100 text-green-800",
      "Tips & Tricks": "bg-yellow-100 text-yellow-800",
      "Troubleshooting": "bg-red-100 text-red-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl mb-1 sm:mb-2 break-words">Knowledge Base & Community</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Share knowledge, ask questions, and learn from the community
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-red-900 to-rose-900 hover:from-red-800 hover:to-rose-800 whitespace-nowrap text-sm sm:text-base w-full sm:w-auto"
              onClick={() => setFormData({ ...emptyTopic, author: user.name })}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Topic
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl mx-3 sm:mx-4 w-[calc(100%-1.5rem)] sm:w-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg md:text-xl">Create New Topic</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Start a new discussion in the community</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a descriptive title..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="Describe your topic in detail..."
                  required
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 p-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddTopic}>Create Topic</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === "All" ? "default" : "outline"}
                onClick={() => setSelectedCategory("All")}
              >
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
      <div className="space-y-4">
        {filteredTopics.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              No topics found. Be the first to start a discussion!
            </CardContent>
          </Card>
        ) : (
          filteredTopics.map((topic) => (
            <Card
              key={topic.id}
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => openTopicDialog(topic)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getCategoryColor(topic.category)}>
                        {topic.category}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDate(topic.createdAt)}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">{topic.content}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-4 h-4" />
                      {topic.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {topic.replies?.length || 0} replies
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Topic Detail Dialog */}
      <Dialog open={showTopicDialog} onOpenChange={setShowTopicDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedTopic && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={getCategoryColor(selectedTopic.category)}>
                    {selectedTopic.category}
                  </Badge>
                </div>
                <DialogTitle className="text-2xl">{selectedTopic.title}</DialogTitle>
              </DialogHeader>

              {/* Original Post */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                    {selectedTopic.author.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm">{selectedTopic.author}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(selectedTopic.createdAt)}
                    </p>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{selectedTopic.content}</p>
              </div>

              {/* Replies */}
              <div className="space-y-4">
                <h3 className="text-lg">
                  Replies ({selectedTopic.replies?.length || 0})
                </h3>
                {selectedTopic.replies?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTopic.replies.map((reply) => (
                      <div key={reply.id} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white text-sm">
                            {reply.author.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm">{reply.author}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(reply.createdAt)}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap ml-10">{reply.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No replies yet. Be the first to reply!
                  </p>
                )}
              </div>

              {/* Reply Form */}
              <div className="space-y-3 border-t pt-4">
                <Label htmlFor="reply">Add a Reply</Label>
                <Textarea
                  id="reply"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  rows={4}
                  placeholder="Write your reply..."
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddReply} disabled={!replyContent.trim()}>
                    Post Reply
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}