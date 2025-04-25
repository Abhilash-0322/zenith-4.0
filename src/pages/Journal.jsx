import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState('');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    mood: '',
    tags: ''
  });

  // API base URL
  const API_URL = 'http://localhost:8000';

  // Load journal entries, prompts and insights
  useEffect(() => {
    fetchJournalData();
  }, []);

  const fetchJournalData = async () => {
    setLoading(true);
    try {
      const [entriesRes, promptsRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/journal/entries`),
        axios.get(`${API_URL}/journal/prompts`),
        axios.get(`${API_URL}/journal/insights`)
      ]);
      
      setEntries(entriesRes.data);
      setPrompts(promptsRes.data);
      setInsights(insightsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching journal data:', err);
      setError('Failed to load journal data. Please try again later.');
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Format tags from comma-separated string to array
    const formattedData = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
    };
    
    try {
      if (editingId) {
        await axios.put(`${API_URL}/journal/entries/${editingId}`, formattedData);
      } else {
        await axios.post(`${API_URL}/journal/entries`, formattedData);
      }
      
      // Reset form and refresh data
      setFormData({ title: '', content: '', mood: '', tags: '' });
      setShowForm(false);
      setEditingId(null);
      fetchJournalData();
    } catch (err) {
      console.error('Error saving journal entry:', err);
      setError('Failed to save journal entry. Please try again.');
    }
  };

  // Delete a journal entry
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await axios.delete(`${API_URL}/journal/entries/${id}`);
        fetchJournalData();
      } catch (err) {
        console.error('Error deleting journal entry:', err);
        setError('Failed to delete journal entry. Please try again.');
      }
    }
  };

  // Edit a journal entry
  const handleEdit = (entry) => {
    setFormData({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || '',
      tags: entry.tags ? entry.tags.join(', ') : ''
    });
    setEditingId(entry._id);
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // Apply a journal prompt
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      ...formData,
      content: formData.content ? `${formData.content}\n\n${prompt}` : prompt
    });
    setShowForm(true);
    window.scrollTo(0, 0);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <BookOpen className="h-12 w-12 text-teal-600" />
        </div>
        <h1 className="text-4xl font-bold text-indigo-900">Your Mindful Journal</h1>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          Express your thoughts, track your moods, and find clarity through reflective writing.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}

      {/* Journal Form */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-indigo-900">
            {editingId ? 'Edit Journal Entry' : 'Create New Entry'}
          </h2>
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setFormData({ title: '', content: '', mood: '', tags: '' });
                setEditingId(null);
              }
            }}
            className="flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg shadow-md transition-colors"
          >
            {showForm ? 'Cancel' : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                New Entry
              </>
            )}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md">
            <div className="mb-4">
              <label htmlFor="title" className="block text-gray-700 font-medium mb-2">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Give your entry a title"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="content" className="block text-gray-700 font-medium mb-2">Journal Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows="8"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Write your thoughts here..."
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="mood" className="block text-gray-700 font-medium mb-2">Current Mood</label>
              <input
                type="text"
                id="mood"
                name="mood"
                value={formData.mood}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="How are you feeling? (e.g., calm, anxious, hopeful)"
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="tags" className="block text-gray-700 font-medium mb-2">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Add tags separated by commas (e.g., meditation, anxiety, growth)"
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Journal Entries and Prompts/Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Journal Entries - Left Two Columns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-indigo-900">Your Journal Entries</h2>
            <button 
              onClick={fetchJournalData}
              className="flex items-center text-indigo-600 hover:text-indigo-800"
            >
              <RefreshCw className="h-5 w-5 mr-1"/>
              Refresh
            </button>
          </div>

          {entries.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-xl text-center">
              <p className="text-gray-600">You haven't created any journal entries yet.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors"
              >
                Create Your First Entry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry._id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{entry.title}</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEdit(entry)}
                        className="text-indigo-600 hover:text-indigo-800"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(entry._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-3">
                    {formatDate(entry.created_at)}
                  </p>
                  
                  {entry.mood && (
                    <p className="mb-3">
                      <span className="text-gray-700 font-medium">Mood: </span>
                      <span className="inline-block bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm">
                        {entry.mood}
                      </span>
                    </p>
                  )}
                  
                  <div className="mb-4 text-gray-700 whitespace-pre-line">
                    {entry.content.length > 200 
                      ? `${entry.content.substring(0, 200)}...` 
                      : entry.content
                    }
                  </div>
                  
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Prompts and Insights */}
        <div className="space-y-8">
          {/* Writing Prompts */}
          <div className="bg-teal-50 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-indigo-900 mb-4">Journal Prompts</h2>
            <p className="text-gray-600 mb-4">
              Need inspiration? Try one of these prompts:
            </p>
            <div className="space-y-3">
              {prompts.slice(0, 5).map((promptObj, index) => (
                <div 
                  key={index}
                  onClick={() => handleSelectPrompt(promptObj.prompt)}
                  className="bg-white p-4 rounded-lg shadow-sm hover:shadow cursor-pointer transition-shadow"
                >
                  <p className="text-gray-700">{promptObj.prompt}</p>
                  <div className="mt-2">
                    <span className="inline-block bg-teal-100 text-teal-800 rounded-full px-3 py-1 text-xs">
                      {promptObj.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Journal Insights */}
          {insights && insights.total_entries > 0 && (
            <div className="bg-indigo-50 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-indigo-900 mb-4">Journal Insights</h2>
              
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-gray-700">Total Entries</p>
                  <p className="text-2xl font-bold text-indigo-600">{insights.total_entries}</p>
                </div>
                
                {insights.top_moods && insights.top_moods.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Top Moods</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.top_moods.map((mood, i) => (
                        <span 
                          key={i} 
                          className="bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm"
                        >
                          {mood._id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {insights.top_tags && insights.top_tags.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-700 mb-2">Top Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {insights.top_tags.map((tag, i) => (
                        <span 
                          key={i} 
                          className="bg-gray-100 text-gray-600 rounded-full px-3 py-1 text-sm"
                        >
                          #{tag._id}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-gray-600 text-sm italic">
                  {insights.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;