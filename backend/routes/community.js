const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const CommunityPost = require('../models/Community');
const User = require('../models/User');

const router = express.Router();

// Get all community posts
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, category, type, search, sortBy = 'createdAt' } = req.query;
    
    const query = { isActive: true };
    if (category) query.category = category;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { content: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') }
      ];
    }
    
    const sortOptions = {};
    if (sortBy === 'popular') {
      sortOptions['likes'] = -1;
    } else if (sortBy === 'recent') {
      sortOptions['createdAt'] = -1;
    } else {
      sortOptions['isPinned'] = -1;
      sortOptions['createdAt'] = -1;
    }
    
    const posts = await CommunityPost.find(query)
      .populate('author', 'name institution')
      .populate('comments.user', 'name institution')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CommunityPost.countDocuments(query);
    
    // Add like status for authenticated users
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toJSON();
      if (req.user) {
        postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      } else {
        postObj.isLiked = false;
      }
      return postObj;
    });
    
    res.json({
      posts: postsWithLikeStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
    
  } catch (error) {
    console.error('Community posts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:postId', optionalAuth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId)
      .populate('author', 'name institution')
      .populate('comments.user', 'name institution');
    
    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const postObj = post.toObject();
    if (req.user) {
      postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
    } else {
      postObj.isLiked = false;
    }
    
    res.json({ post: postObj });
    
  } catch (error) {
    console.error('Community post fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, type, category, tags } = req.body;
    
    // Basic validation
    if (!title || !content || !category) {
      return res.status(400).json({ message: 'Title, content, and category are required' });
    }
    
    if (title.length < 5 || content.length < 10) {
      return res.status(400).json({ message: 'Title must be at least 5 characters and content at least 10 characters' });
    }
    
    const post = new CommunityPost({
      title,
      content,
      type: type || 'discussion',
      category,
      author: req.user._id,
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(tag => tag.trim()) : [])
    });
    
    await post.save();
    await post.populate('author', 'name institution');
    
    res.status(201).json({
      message: 'Post created successfully',
      post: post
    });
    
  } catch (error) {
    console.error('Community post creation error:', error);
    res.status(500).json({ message: 'Server error during post creation' });
  }
});

// Update post
router.put('/:postId', auth, async (req, res) => {
  try {
    const { title, content, tags, isResolved } = req.body;
    
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = tags.split(',').map(tag => tag.trim());
    if (typeof isResolved === 'boolean') post.isResolved = isResolved;
    
    await post.save();
    await post.populate('author', 'name institution');
    
    res.json({
      message: 'Post updated successfully',
      post
    });
    
  } catch (error) {
    console.error('Community post update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/:postId', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Check if user is the author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Soft delete
    post.isActive = false;
    await post.save();
    
    res.json({ message: 'Post deleted successfully' });
    
  } catch (error) {
    console.error('Community post delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:postId/like', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findByPk(req.params.postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await post.toggleLike(req.user.id);
    
    const postWithAuthor = await CommunityPost.findByPk(post.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'name', 'institution']
      }]
    });
    
    const postObj = postWithAuthor.toJSON();
    postObj.isLiked = (post.likes || []).some(like => like.user === req.user.id);
    
    res.json({
      message: 'Post liked/unliked successfully',
      post: postObj
    });
    
  } catch (error) {
    console.error('Community post like error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:postId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content || content.trim().length < 1) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const post = await CommunityPost.findById(req.params.postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await post.addComment(req.user._id, content.trim());
    await post.populate('author', 'name institution');
    await post.populate('comments.user', 'name institution');
    
    const postObj = post.toObject();
    postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
    
    res.status(201).json({
      message: 'Comment added successfully',
      post: postObj
    });
    
  } catch (error) {
    console.error('Community comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove comment
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post || !post.isActive) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is the comment author or admin
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await post.removeComment(req.params.commentId);
    await post.populate('author', 'name institution');
    await post.populate('comments.user', 'name institution');
    
    const postObj = post.toObject();
    postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
    
    res.json({
      message: 'Comment removed successfully',
      post: postObj
    });
    
  } catch (error) {
    console.error('Community comment delete error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const posts = await CommunityPost.find({ 
      author: req.params.userId, 
      isActive: true 
    })
      .populate('author', 'name institution')
      .populate('comments.user', 'name institution')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await CommunityPost.countDocuments({ 
      author: req.params.userId, 
      isActive: true 
    });
    
    // Add like status for authenticated users
    const postsWithLikeStatus = posts.map(post => {
      const postObj = post.toObject();
      if (req.user) {
        postObj.isLiked = post.likes.some(like => like.user.toString() === req.user._id.toString());
      } else {
        postObj.isLiked = false;
      }
      return postObj;
    });
    
    res.json({
      posts: postsWithLikeStatus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
    
  } catch (error) {
    console.error('User posts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get community stats
router.get('/stats/overview', async (req, res) => {
  try {
    const totalPosts = await CommunityPost.countDocuments({ isActive: true });
    const totalComments = await CommunityPost.aggregate([
      { $match: { isActive: true } },
      { $project: { commentsCount: { $size: '$comments' } } },
      { $group: { _id: null, total: { $sum: '$commentsCount' } } }
    ]);
    
    const categoryStats = await CommunityPost.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const typeStats = await CommunityPost.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      stats: {
        totalPosts,
        totalComments: totalComments[0]?.total || 0,
        categoryStats,
        typeStats
      }
    });
    
  } catch (error) {
    console.error('Community stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
