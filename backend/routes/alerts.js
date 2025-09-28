const express = require('express');
const { auth, optionalAuth } = require('../middleware/auth');
const Alert = require('../models/Alert');
const scrapingService = require('../services/scrapingService');
const notificationService = require('../services/notificationService');

const router = express.Router();

// Get all active alerts (live data)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, severity, state, city } = req.query;
    
    // Get live alerts from scraping service
    const result = scrapingService.getLiveAlerts({
      page,
      limit,
      type,
      severity,
      state,
      city
    });
    
    res.json({
      alerts: result.alerts,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      total: result.total,
      isLive: true,
      lastUpdate: scrapingService.lastUpdate
    });
    
  } catch (error) {
    console.error('Live alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alerts for user's location
router.get('/my-location', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type, severity } = req.query;
    
    const query = {
      isActive: true
    };
    
    // Add location filter if user has location data
    if (req.user.state || req.user.city) {
      const locationFilters = [];
      
      if (req.user.state) {
        locationFilters.push({ 'affectedAreas.state': new RegExp(req.user.state, 'i') });
      }
      
      if (req.user.city) {
        locationFilters.push({ 'affectedAreas.city': new RegExp(req.user.city, 'i') });
      }
      
      // Also include general alerts that affect multiple areas
      locationFilters.push({ 'affectedAreas.state': /India|Multiple|All/i });
      
      query.$or = locationFilters;
    }
    
    if (type) query.type = type;
    if (severity) query.severity = severity;
    
    const alerts = await Alert.find(query)
      .sort({ priority: -1, issuedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Alert.countDocuments(query);
    
    // Mark alerts as viewed
    if (alerts.length > 0) {
      const alertIds = alerts.map(alert => alert._id);
      await Alert.updateMany(
        { _id: { $in: alertIds } },
        { $inc: { views: 1 } }
      );
    }
    
    res.json({
      alerts,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      location: {
        state: req.user.state || 'Not specified',
        city: req.user.city || 'Not specified'
      }
    });
    
  } catch (error) {
    console.error('Location alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single alert details
router.get('/:alertId', optionalAuth, async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Increment view count
    alert.views += 1;
    await alert.save();
    
    res.json({ alert });
    
  } catch (error) {
    console.error('Alert fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alert statistics (live data)
router.get('/stats/overview', optionalAuth, async (req, res) => {
  try {
    const liveAlerts = scrapingService.getLiveAlerts({});
    const alerts = liveAlerts.alerts;
    
    // Calculate stats from live data
    const stats = {
      totalAlerts: alerts.length,
      criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
      highAlerts: alerts.filter(a => a.severity === 'high').length,
      mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
      lowAlerts: alerts.filter(a => a.severity === 'low').length
    };
    
    // Type statistics
    const typeStats = {};
    alerts.forEach(alert => {
      typeStats[alert.type] = (typeStats[alert.type] || 0) + 1;
    });
    const byType = Object.entries(typeStats).map(([type, count]) => ({ _id: type, count }))
      .sort((a, b) => b.count - a.count);
    
    // Source statistics
    const sourceStats = {};
    alerts.forEach(alert => {
      sourceStats[alert.source] = (sourceStats[alert.source] || 0) + 1;
    });
    const bySource = Object.entries(sourceStats).map(([source, count]) => ({ _id: source, count }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      overview: stats,
      byType,
      bySource,
      isLive: true,
      lastUpdate: scrapingService.lastUpdate
    });
    
  } catch (error) {
    console.error('Alert stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent alerts (last 24 hours)
router.get('/recent/24h', optionalAuth, async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const alerts = await Alert.find({
      isActive: true,
      issuedAt: { $gte: twentyFourHoursAgo }
    })
      .sort({ issuedAt: -1 })
      .limit(20);
    
    res.json({
      alerts,
      count: alerts.length,
      timeframe: '24 hours'
    });
    
  } catch (error) {
    console.error('Recent alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available cities with alert counts
router.get('/cities/available', optionalAuth, async (req, res) => {
  try {
    const cityStats = await Alert.aggregate([
      { $match: { isActive: true } },
      { $unwind: '$affectedAreas' },
      { 
        $match: { 
          'affectedAreas.state': { $exists: true, $ne: null, $ne: '' },
          'affectedAreas.city': { $exists: true, $ne: null, $ne: '' }
        }
      },
      { 
        $group: { 
          _id: {
            state: '$affectedAreas.state',
            city: '$affectedAreas.city'
          },
          alertCount: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] }
          },
          highCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] }
          },
          mediumCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'medium'] }, 1, 0] }
          },
          lowCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'low'] }, 1, 0] }
          }
        }
      },
      { $sort: { alertCount: -1, '_id.state': 1, '_id.city': 1 } },
      { $limit: 100 } // Limit to top 100 cities
    ]);
    
    // Filter out generic entries
    const filteredStats = cityStats.filter(stat => 
      stat._id.state && 
      stat._id.city && 
      !stat._id.state.match(/India|Multiple|All|Unknown/i) &&
      !stat._id.city.match(/Multiple|All|Unknown|Areas/i)
    );
    
    res.json({
      cities: filteredStats.map(stat => ({
        state: stat._id.state,
        city: stat._id.city,
        alertCount: stat.alertCount,
        criticalCount: stat.criticalCount,
        highCount: stat.highCount,
        mediumCount: stat.mediumCount,
        lowCount: stat.lowCount
      }))
    });
    
  } catch (error) {
    console.error('Available cities fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get alerts for specific city (live data)
router.get('/city/:cityName', optionalAuth, async (req, res) => {
  try {
    const { cityName } = req.params;
    const { page = 1, limit = 20, type, severity, state } = req.query;
    
    // Get live alerts filtered by city
    const result = scrapingService.getLiveAlerts({
      page,
      limit,
      type,
      severity,
      city: cityName,
      state
    });
    
    res.json({
      alerts: result.alerts,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
      total: result.total,
      city: cityName,
      state: state || 'All States',
      isLive: true,
      lastUpdate: scrapingService.lastUpdate
    });
    
  } catch (error) {
    console.error('City alerts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Real-time city search - scrapes live data for specific city
router.get('/search/:cityName', optionalAuth, async (req, res) => {
  try {
    const { cityName } = req.params;
    
    console.log(`🔍 Real-time search request for: ${cityName}`);
    
    // Perform real-time scraping for the city
    const result = await scrapingService.searchCityAlerts(cityName);
    
    res.json({
      ...result,
      isRealTime: true,
      message: `Real-time alerts for ${cityName}`,
      searchDuration: new Date() - result.searchedAt
    });
    
  } catch (error) {
    console.error('Real-time city search error:', error);
    res.status(500).json({ 
      message: 'Error fetching real-time alerts',
      city: req.params.cityName,
      error: error.message 
    });
  }
});

// Admin routes for alert management
router.use(auth);

// Trigger manual scraping (admin only)
router.post('/scrape', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const result = await scrapingService.triggerScraping();
    
    res.json({
      message: 'Scraping completed successfully',
      result
    });
    
  } catch (error) {
    console.error('Manual scraping error:', error);
    res.status(500).json({ 
      message: error.message || 'Server error during scraping'
    });
  }
});

// Get scraping service status (admin only)
router.get('/scrape/status', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const status = scrapingService.getStatus();
    
    res.json({ status });
    
  } catch (error) {
    console.error('Scraping status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create manual alert (admin only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const alertData = {
      ...req.body,
      source: 'Manual',
      issuedAt: new Date(),
      isVerified: true,
      isActive: true
    };
    
    const alert = new Alert(alertData);
    await alert.save();
    
    // Send notifications for high priority alerts
    if (alert.severity === 'high' || alert.severity === 'critical') {
      const notificationResult = await notificationService.sendAlertNotifications(alert);
      
      res.status(201).json({
        message: 'Alert created and notifications sent successfully',
        alert,
        notifications: notificationResult
      });
    } else {
      res.status(201).json({
        message: 'Alert created successfully',
        alert
      });
    }
    
  } catch (error) {
    console.error('Alert creation error:', error);
    res.status(500).json({ message: 'Server error during alert creation' });
  }
});

// Update alert (admin only)
router.put('/:alertId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'title', 'description', 'type', 'severity', 'affectedAreas',
      'instructions', 'emergencyContacts', 'tags', 'priority',
      'isActive', 'isVerified', 'expiresAt'
    ];
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        alert[field] = req.body[field];
      }
    });
    
    await alert.save();
    
    res.json({
      message: 'Alert updated successfully',
      alert
    });
    
  } catch (error) {
    console.error('Alert update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete/deactivate alert (admin only)
router.delete('/:alertId', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    // Deactivate instead of deleting
    alert.isActive = false;
    await alert.save();
    
    res.json({ message: 'Alert deactivated successfully' });
    
  } catch (error) {
    console.error('Alert deletion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send test notification for alert (admin only)
router.post('/:alertId/test-notification', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    const result = await notificationService.sendAlertNotifications(alert);
    
    res.json({
      message: 'Test notifications sent',
      result
    });
    
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify alert (admin only)
router.post('/:alertId/verify', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    alert.isVerified = true;
    await alert.save();
    
    res.json({
      message: 'Alert verified successfully',
      alert
    });
    
  } catch (error) {
    console.error('Alert verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
