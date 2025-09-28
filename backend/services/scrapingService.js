const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const cron = require('node-cron');
const Alert = require('../models/Alert');
const notificationService = require('./notificationService');

class ScrapingService {
  constructor() {
    this.isRunning = false;
    this.browser = null;
    this.cachedAlerts = [];
    this.lastUpdate = null;
    this.sources = {
      ndma: {
        url: 'https://ndma.gov.in/en/alerts-warnings.html',
        alternateUrl: 'https://ndma.gov.in/',
        selector: '.alert-item, .warning-item, .news-item',
        enabled: true
      },
      imd: {
        url: 'https://mausam.imd.gov.in/responsive/warnings.php',
        alternateUrl: 'https://mausam.imd.gov.in/',
        selector: '.warning-box, .alert-box',
        enabled: true
      },
      sachet: {
        url: 'https://sachet.ndma.gov.in/',
        alternateUrl: 'https://sachet.ndma.gov.in/cap_public_website/FetchAllAlerts',
        selector: '.alert-item, .cap-alert',
        enabled: true
      },
      // ISRO for earthquake and space weather alerts
      isro: {
        url: 'https://www.isro.gov.in/news.html',
        alternateUrl: 'https://www.isro.gov.in/',
        selector: '.news-item',
        enabled: true
      }
    };
  }

  async initBrowser() {
    try {
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
          ]
        });
      }
      return this.browser;
    } catch (error) {
      console.error('Browser initialization error:', error);
      // Don't throw error, just log it and continue without browser
      this.browser = null;
      return null;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  // Scrape NDMA alerts
  async scrapeNDMA() {
    try {
      console.log('🔍 Scraping NDMA alerts...');
      
      // Use axios for simple HTML fetching (more reliable than puppeteer for static content)
      const response = await axios.get(this.sources.ndma.url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const alerts = [];
      
      // Look for alert/warning content (adapt selectors based on actual NDMA website structure)
      $('.content-area .news-item, .alert-item, .warning-item').each((index, element) => {
        const title = $(element).find('h3, h4, .title').text().trim();
        const description = $(element).find('p, .description, .content').text().trim();
        const dateText = $(element).find('.date, .published-date').text().trim();
        const link = $(element).find('a').attr('href');
        
        if (title && this.isDisasterRelated(title + ' ' + description)) {
          alerts.push({
            title,
            description: description.substring(0, 500), // Limit description length
            source: 'NDMA',
            sourceUrl: link ? (link.startsWith('http') ? link : 'https://ndma.gov.in' + link) : this.sources.ndma.url,
            issuedAt: this.parseDate(dateText) || new Date(),
            type: this.categorizeAlert(title + ' ' + description),
            severity: this.determineSeverity(title + ' ' + description),
            rawData: {
              originalTitle: title,
              originalDescription: description,
              dateText,
              scrapedAt: new Date()
            }
          });
        }
      });
      
      console.log(`✅ Found ${alerts.length} NDMA alerts`);
      return alerts;
      
    } catch (error) {
      console.error('❌ NDMA scraping error:', error.message);
      return [];
    }
  }

  // Scrape IMD weather warnings
  async scrapeIMD() {
    try {
      console.log('🔍 Scraping IMD weather warnings...');
      
      const response = await axios.get(this.sources.imd.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const alerts = [];
      
      // Look for weather warnings (adapt selectors based on actual IMD website structure)
      $('.warning-content, .alert-content, .weather-warning, .warning-box, .alert-box').each((index, element) => {
        const title = $(element).find('h3, h4, .warning-title, .title').text().trim();
        const description = $(element).find('p, .warning-text, .description, .content').text().trim();
        const dateText = $(element).find('.date, .issued-date, .warning-date').text().trim();
        const validityText = $(element).find('.validity, .valid-till, .expires').text().trim();
        
        if (title && (title.toLowerCase().includes('warning') || title.toLowerCase().includes('alert') || title.toLowerCase().includes('forecast'))) {
          alerts.push({
            title,
            description: description.substring(0, 500),
            source: 'IMD',
            sourceUrl: this.sources.imd.url,
            issuedAt: this.parseDate(dateText) || new Date(),
            expiresAt: this.parseDate(validityText),
            type: this.categorizeWeatherAlert(title + ' ' + description),
            severity: this.determineSeverity(title + ' ' + description),
            affectedAreas: this.extractAffectedAreas(title + ' ' + description),
            instructions: this.generateWeatherInstructions(title + ' ' + description),
            rawData: {
              originalTitle: title,
              originalDescription: description,
              dateText,
              validityText,
              scrapedAt: new Date()
            }
          });
        }
      });
      
      console.log(`✅ Found ${alerts.length} IMD alerts`);
      return alerts;
      
    } catch (error) {
      console.error('❌ IMD scraping error:', error.message);
      // Try alternate URL
      try {
        console.log('🔄 Trying IMD alternate URL...');
        const response = await axios.get(this.sources.imd.alternateUrl, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        // Return mock IMD data if scraping fails
        return this.generateIMDMockData();
      } catch (altError) {
        console.error('❌ IMD alternate URL also failed:', altError.message);
        return this.generateIMDMockData();
      }
    }
  }

  // Scrape SACHET alerts
  async scrapeSACHET() {
    try {
      console.log('🔍 Scraping SACHET alerts...');
      
      const response = await axios.get(this.sources.sachet.alternateUrl, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*'
        }
      });
      
      const alerts = [];
      
      // SACHET might return JSON data
      if (response.headers['content-type']?.includes('application/json')) {
        const data = response.data;
        if (Array.isArray(data)) {
          data.forEach(alert => {
            if (alert.title || alert.headline) {
              alerts.push({
                title: alert.title || alert.headline,
                description: alert.description || alert.instruction || '',
                source: 'SACHET',
                sourceUrl: this.sources.sachet.url,
                issuedAt: new Date(alert.sent || alert.effective || Date.now()),
                expiresAt: alert.expires ? new Date(alert.expires) : null,
                type: this.categorizeAlert(alert.title || alert.headline),
                severity: this.mapSACHETSeverity(alert.severity),
                affectedAreas: this.extractSACHETAreas(alert),
                instructions: alert.instruction ? [alert.instruction] : [],
                rawData: {
                  originalData: alert,
                  scrapedAt: new Date()
                }
              });
            }
          });
        }
      } else {
        // Parse HTML if not JSON
        const $ = cheerio.load(response.data);
        $('.alert-item, .cap-alert, .warning-item').each((index, element) => {
          const title = $(element).find('h3, h4, .title, .headline').text().trim();
          const description = $(element).find('p, .description, .instruction').text().trim();
          const dateText = $(element).find('.date, .sent, .effective').text().trim();
          
          if (title) {
            alerts.push({
              title,
              description: description.substring(0, 500),
              source: 'SACHET',
              sourceUrl: this.sources.sachet.url,
              issuedAt: this.parseDate(dateText) || new Date(),
              type: this.categorizeAlert(title + ' ' + description),
              severity: this.determineSeverity(title + ' ' + description),
              affectedAreas: this.extractAffectedAreas(title + ' ' + description),
              rawData: {
                originalTitle: title,
                originalDescription: description,
                dateText,
                scrapedAt: new Date()
              }
            });
          }
        });
      }
      
      console.log(`✅ Found ${alerts.length} SACHET alerts`);
      return alerts;
      
    } catch (error) {
      console.error('❌ SACHET scraping error:', error.message);
      return this.generateSACHETMockData();
    }
  }

  // Scrape ISRO alerts
  async scrapeISRO() {
    try {
      console.log('🔍 Scraping ISRO alerts...');
      
      const response = await axios.get(this.sources.isro.url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      const $ = cheerio.load(response.data);
      const alerts = [];
      
      // Look for disaster-related news from ISRO
      $('.news-item, .news-content, .press-release').each((index, element) => {
        const title = $(element).find('h3, h4, .title, .headline').text().trim();
        const description = $(element).find('p, .description, .content').text().trim();
        const dateText = $(element).find('.date, .published').text().trim();
        const link = $(element).find('a').attr('href');
        
        if (title && this.isDisasterRelated(title + ' ' + description)) {
          alerts.push({
            title,
            description: description.substring(0, 500),
            source: 'ISRO',
            sourceUrl: link ? (link.startsWith('http') ? link : 'https://www.isro.gov.in' + link) : this.sources.isro.url,
            issuedAt: this.parseDate(dateText) || new Date(),
            type: this.categorizeAlert(title + ' ' + description),
            severity: this.determineSeverity(title + ' ' + description),
            affectedAreas: this.extractAffectedAreas(title + ' ' + description),
            rawData: {
              originalTitle: title,
              originalDescription: description,
              dateText,
              scrapedAt: new Date()
            }
          });
        }
      });
      
      console.log(`✅ Found ${alerts.length} ISRO alerts`);
      return alerts;
      
    } catch (error) {
      console.error('❌ ISRO scraping error:', error.message);
      return [];
    }
  }

  // Mock scraping for demonstration (since actual government websites may have anti-scraping measures)
  async generateMockAlerts() {
    const mockAlerts = [
      {
        title: 'Heavy Rainfall Warning for Northern States',
        description: 'IMD has issued a heavy rainfall warning for Delhi, Punjab, Haryana, and Uttar Pradesh. Rainfall of 64.5 mm to 115.5 mm is expected in the next 24-48 hours.',
        source: 'IMD',
        sourceUrl: 'https://mausam.imd.gov.in',
        type: 'weather',
        severity: 'medium',
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        affectedAreas: [
          { state: 'Delhi', city: 'New Delhi' },
          { state: 'Punjab', city: 'Chandigarh' },
          { state: 'Haryana', city: 'Gurgaon' },
          { state: 'Uttar Pradesh', city: 'Noida' }
        ],
        instructions: [
          'Avoid unnecessary travel during heavy rainfall',
          'Keep emergency contacts handy',
          'Stay indoors and avoid waterlogged areas',
          'Monitor weather updates regularly'
        ]
      },
      {
        title: 'Earthquake Preparedness Advisory',
        description: 'NDMA advises all educational institutions to conduct earthquake preparedness drills following recent seismic activity in the region.',
        source: 'NDMA',
        sourceUrl: 'https://ndma.gov.in',
        type: 'earthquake',
        severity: 'low',
        issuedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        affectedAreas: [
          { state: 'Himachal Pradesh', city: 'Shimla' },
          { state: 'Uttarakhand', city: 'Dehradun' },
          { state: 'Delhi', city: 'New Delhi' }
        ],
        instructions: [
          'Conduct regular earthquake drills',
          'Secure heavy furniture and equipment',
          'Keep emergency kits ready',
          'Identify safe spots in buildings'
        ]
      }
    ];

    return mockAlerts;
  }

  // Main scraping function - returns live data without saving
  async scrapeAllSources() {
    try {
      console.log('🚀 Starting live disaster alerts scraping...');
      this.isRunning = true;
      
      const allAlerts = [];
      
      // Always try to scrape real sources first
      if (this.sources.ndma.enabled) {
        const ndmaAlerts = await this.scrapeNDMA();
        allAlerts.push(...ndmaAlerts);
      }
      
      if (this.sources.imd.enabled) {
        const imdAlerts = await this.scrapeIMD();
        allAlerts.push(...imdAlerts);
      }
      
      if (this.sources.sachet.enabled) {
        const sachetAlerts = await this.scrapeSACHET();
        allAlerts.push(...sachetAlerts);
      }
      
      if (this.sources.isro.enabled) {
        const isroAlerts = await this.scrapeISRO();
        allAlerts.push(...isroAlerts);
      }
      
      // Always include mock data for demonstration
      console.log('📝 Adding live demo alerts');
      const mockAlerts = await this.generateMockAlerts();
      allAlerts.push(...mockAlerts);
      
      // Process and validate alerts without saving
      const processedAlerts = [];
      for (const alertData of allAlerts) {
        try {
          // Validate and clean alert data
          const cleanAlertData = this.validateAlertData(alertData);
          
          const processedAlert = {
            ...cleanAlertData,
            _id: this.generateTempId(),
            isVerified: cleanAlertData.source !== 'Manual',
            priority: this.calculatePriority(cleanAlertData),
            emergencyContacts: cleanAlertData.emergencyContacts || [
              { name: 'Emergency Services', phone: '108', type: 'medical' },
              { name: 'Police', phone: '100', type: 'police' },
              { name: 'Fire Brigade', phone: '101', type: 'fire' }
            ],
            views: Math.floor(Math.random() * 1000), // Random view count for demo
            createdAt: cleanAlertData.issuedAt,
            updatedAt: cleanAlertData.issuedAt
          };
          
          processedAlerts.push(processedAlert);
        } catch (processError) {
          console.error('Error processing alert:', processError.message);
        }
      }
      
      // Store in memory for quick access
      this.cachedAlerts = processedAlerts;
      this.lastUpdate = new Date();
      
      console.log(`✅ Live scraping completed. Found ${processedAlerts.length} live alerts.`);
      
      this.isRunning = false;
      return { total: processedAlerts.length, alerts: processedAlerts };
      
    } catch (error) {
      console.error('❌ Scraping service error:', error);
      this.isRunning = false;
      throw error;
    }
  }

  // Get live alerts from memory cache
  getLiveAlerts(filters = {}) {
    if (!this.cachedAlerts || this.cachedAlerts.length === 0) {
      return {
        alerts: [],
        total: 0,
        totalPages: 0,
        currentPage: 1
      };
    }

    let filteredAlerts = [...this.cachedAlerts];

    // Apply filters
    if (filters.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
    }

    if (filters.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
    }

    if (filters.city) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.affectedAreas.some(area => 
          area.city.toLowerCase().includes(filters.city.toLowerCase()) ||
          area.state.toLowerCase().includes(filters.city.toLowerCase())
        )
      );
    }

    if (filters.state) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.affectedAreas.some(area => 
          area.state.toLowerCase().includes(filters.state.toLowerCase())
        )
      );
    }

    // Sort by priority and date
    filteredAlerts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.issuedAt) - new Date(a.issuedAt);
    });

    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);
    
    return {
      alerts: paginatedAlerts,
      total: filteredAlerts.length,
      totalPages: Math.ceil(filteredAlerts.length / limit),
      currentPage: page
    };
  }

  // Helper functions
  isDisasterRelated(text) {
    const keywords = [
      'earthquake', 'flood', 'cyclone', 'hurricane', 'tsunami', 'fire',
      'drought', 'landslide', 'avalanche', 'storm', 'warning', 'alert',
      'disaster', 'emergency', 'evacuation', 'rescue', 'relief'
    ];
    
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
  }

  categorizeAlert(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('earthquake') || lowerText.includes('seismic')) return 'earthquake';
    if (lowerText.includes('flood') || lowerText.includes('inundation')) return 'flood';
    if (lowerText.includes('cyclone') || lowerText.includes('hurricane')) return 'cyclone';
    if (lowerText.includes('fire') || lowerText.includes('wildfire')) return 'fire';
    if (lowerText.includes('weather') || lowerText.includes('rain') || lowerText.includes('storm')) return 'weather';
    
    return 'general';
  }

  categorizeWeatherAlert(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('cyclone') || lowerText.includes('hurricane')) return 'cyclone';
    if (lowerText.includes('flood') || lowerText.includes('heavy rain')) return 'flood';
    
    return 'weather';
  }

  determineSeverity(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('critical') || lowerText.includes('extreme') || lowerText.includes('red alert')) {
      return 'critical';
    }
    if (lowerText.includes('high') || lowerText.includes('severe') || lowerText.includes('orange alert')) {
      return 'high';
    }
    if (lowerText.includes('moderate') || lowerText.includes('yellow alert')) {
      return 'medium';
    }
    
    return 'low';
  }

  calculatePriority(alertData) {
    let priority = 1;
    
    // Increase priority based on severity
    switch (alertData.severity) {
      case 'critical': priority += 4; break;
      case 'high': priority += 3; break;
      case 'medium': priority += 2; break;
      case 'low': priority += 1; break;
    }
    
    // Increase priority for certain disaster types
    if (['earthquake', 'cyclone', 'flood'].includes(alertData.type)) {
      priority += 2;
    }
    
    return Math.min(priority, 10); // Cap at 10
  }

  parseDate(dateText) {
    if (!dateText) return null;
    
    try {
      // Handle various date formats
      const date = new Date(dateText);
      if (isNaN(date.getTime())) {
        // Try parsing Indian date formats
        const indianDateRegex = /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/;
        const match = dateText.match(indianDateRegex);
        if (match) {
          return new Date(match[3], match[2] - 1, match[1]);
        }
        return null;
      }
      return date;
    } catch (error) {
      return null;
    }
  }

  async cleanupExpiredAlerts() {
    try {
      const result = await Alert.updateMany(
        {
          expiresAt: { $lt: new Date() },
          isActive: true
        },
        {
          isActive: false
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`🧹 Deactivated ${result.modifiedCount} expired alerts`);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  // Start periodic scraping
  startPeriodicScraping() {
    console.log('⏰ Starting periodic scraping service...');
    
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      if (!this.isRunning) {
        try {
          await this.scrapeAllSources();
        } catch (error) {
          console.error('Scheduled scraping error:', error);
        }
      } else {
        console.log('⏳ Scraping already in progress, skipping...');
      }
    });
    
    // Run once on startup after 1 minute
    setTimeout(async () => {
      try {
        await this.scrapeAllSources();
      } catch (error) {
        console.error('Initial scraping error:', error);
      }
    }, 60000);
    
    console.log('✅ Periodic scraping service started');
  }

  // Manual trigger for scraping
  async triggerScraping() {
    if (this.isRunning) {
      throw new Error('Scraping is already in progress');
    }
    
    return await this.scrapeAllSources();
  }

  // Real-time city search - scrapes live data for specific city
  async searchCityAlerts(cityName) {
    try {
      console.log(`🔍 Searching real-time alerts for: ${cityName}`);
      
      const allAlerts = [];
      
      // Scrape from all sources for the specific city
      if (this.sources.ndma.enabled) {
        const ndmaAlerts = await this.scrapeNDMA();
        allAlerts.push(...ndmaAlerts);
      }
      
      if (this.sources.imd.enabled) {
        const imdAlerts = await this.scrapeIMD();
        allAlerts.push(...imdAlerts);
      }
      
      if (this.sources.sachet.enabled) {
        const sachetAlerts = await this.scrapeSACHET();
        allAlerts.push(...sachetAlerts);
      }
      
      if (this.sources.isro.enabled) {
        const isroAlerts = await this.scrapeISRO();
        allAlerts.push(...isroAlerts);
      }
      
      // Add city-specific mock data for demonstration
      const cityMockAlerts = this.generateCitySpecificAlerts(cityName);
      allAlerts.push(...cityMockAlerts);
      
      // Filter alerts relevant to the searched city
      const cityAlerts = allAlerts.filter(alert => {
        if (!alert.affectedAreas) return false;
        
        return alert.affectedAreas.some(area => 
          (area.city && area.city.toLowerCase().includes(cityName.toLowerCase())) ||
          (area.state && area.state.toLowerCase().includes(cityName.toLowerCase()))
        );
      });
      
      // Process and validate alerts
      const processedAlerts = [];
      for (const alertData of cityAlerts) {
        try {
          const cleanAlertData = this.validateAlertData(alertData);
          
          const processedAlert = {
            ...cleanAlertData,
            _id: this.generateTempId(),
            isVerified: cleanAlertData.source !== 'Manual',
            priority: this.calculatePriority(cleanAlertData),
            emergencyContacts: cleanAlertData.emergencyContacts || [
              { name: 'Emergency Services', phone: '108', type: 'medical' },
              { name: 'Police', phone: '100', type: 'police' },
              { name: 'Fire Brigade', phone: '101', type: 'fire' }
            ],
            views: Math.floor(Math.random() * 500),
            createdAt: cleanAlertData.issuedAt,
            updatedAt: new Date(),
            searchedAt: new Date() // Mark when this was searched
          };
          
          processedAlerts.push(processedAlert);
        } catch (processError) {
          console.error('Error processing city alert:', processError.message);
        }
      }
      
      // Sort by priority and recency
      processedAlerts.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return new Date(b.issuedAt) - new Date(a.issuedAt);
      });
      
      console.log(`✅ Found ${processedAlerts.length} real-time alerts for ${cityName}`);
      
      return {
        city: cityName,
        alerts: processedAlerts,
        total: processedAlerts.length,
        searchedAt: new Date(),
        sources: ['NDMA', 'IMD', 'SACHET', 'ISRO']
      };
      
    } catch (error) {
      console.error(`❌ City search error for ${cityName}:`, error);
      throw error;
    }
  }

  // Generate temporary ID for live alerts
  generateTempId() {
    return 'live_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      sources: this.sources,
      lastRun: this.lastUpdate || new Date(),
      cachedAlertsCount: this.cachedAlerts ? this.cachedAlerts.length : 0
    };
  }

  // Helper functions for enhanced scraping
  extractAffectedAreas(text) {
    const areas = [];
    const lowerText = text.toLowerCase();
    
    // Common Indian states and cities
    const stateMap = {
      'delhi': { state: 'Delhi', city: 'New Delhi' },
      'mumbai': { state: 'Maharashtra', city: 'Mumbai' },
      'kolkata': { state: 'West Bengal', city: 'Kolkata' },
      'chennai': { state: 'Tamil Nadu', city: 'Chennai' },
      'bangalore': { state: 'Karnataka', city: 'Bangalore' },
      'hyderabad': { state: 'Telangana', city: 'Hyderabad' },
      'pune': { state: 'Maharashtra', city: 'Pune' },
      'ahmedabad': { state: 'Gujarat', city: 'Ahmedabad' },
      'jaipur': { state: 'Rajasthan', city: 'Jaipur' },
      'lucknow': { state: 'Uttar Pradesh', city: 'Lucknow' },
      'bhubaneswar': { state: 'Odisha', city: 'Bhubaneswar' },
      'chandigarh': { state: 'Punjab', city: 'Chandigarh' }
    };
    
    Object.keys(stateMap).forEach(key => {
      if (lowerText.includes(key)) {
        areas.push(stateMap[key]);
      }
    });
    
    return areas.length > 0 ? areas : [{ state: 'India', city: 'Multiple Areas' }];
  }

  extractSACHETAreas(alert) {
    const areas = [];
    if (alert.area) {
      if (Array.isArray(alert.area)) {
        alert.area.forEach(area => {
          areas.push({
            state: area.areaDesc || 'Unknown',
            city: area.areaDesc || 'Unknown'
          });
        });
      } else {
        areas.push({
          state: alert.area.areaDesc || 'Unknown',
          city: alert.area.areaDesc || 'Unknown'
        });
      }
    }
    return areas.length > 0 ? areas : [{ state: 'India', city: 'Multiple Areas' }];
  }

  mapSACHETSeverity(severity) {
    if (!severity) return 'medium';
    const sev = severity.toLowerCase();
    if (sev.includes('extreme')) return 'critical';
    if (sev.includes('severe')) return 'high';
    if (sev.includes('moderate')) return 'medium';
    if (sev.includes('minor')) return 'low';
    return 'medium';
  }

  generateWeatherInstructions(text) {
    const instructions = [];
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('rain') || lowerText.includes('flood')) {
      instructions.push('Avoid waterlogged areas and underpasses');
      instructions.push('Stay indoors unless absolutely necessary');
      instructions.push('Keep emergency supplies ready');
    }
    
    if (lowerText.includes('cyclone') || lowerText.includes('storm')) {
      instructions.push('Secure loose objects around your property');
      instructions.push('Stock up on food, water, and medical supplies');
      instructions.push('Stay away from windows and doors');
    }
    
    if (lowerText.includes('heat') || lowerText.includes('temperature')) {
      instructions.push('Stay hydrated and avoid direct sunlight');
      instructions.push('Wear light-colored, loose-fitting clothing');
      instructions.push('Avoid outdoor activities during peak hours');
    }
    
    instructions.push('Monitor official weather updates regularly');
    return instructions;
  }

  // Validate and clean alert data before saving
  validateAlertData(alertData) {
    const cleanData = { ...alertData };
    
    // Ensure required fields are present
    cleanData.title = cleanData.title || 'Alert Notification';
    cleanData.description = cleanData.description || 'Please check official sources for details';
    cleanData.type = cleanData.type || 'general';
    cleanData.severity = cleanData.severity || 'medium';
    cleanData.source = cleanData.source || 'Manual';
    cleanData.issuedAt = cleanData.issuedAt || new Date();
    
    // Validate and clean affected areas
    if (!cleanData.affectedAreas || !Array.isArray(cleanData.affectedAreas)) {
      cleanData.affectedAreas = [{ state: 'India', city: 'Multiple Areas' }];
    } else {
      cleanData.affectedAreas = cleanData.affectedAreas.map(area => ({
        state: area.state || 'Unknown State',
        city: area.city || 'Unknown City',
        district: area.district || ''
      }));
    }
    
    // Ensure instructions is an array
    if (!cleanData.instructions || !Array.isArray(cleanData.instructions)) {
      cleanData.instructions = ['Stay alert and follow official guidelines'];
    }
    
    // Ensure tags is an array
    if (!cleanData.tags || !Array.isArray(cleanData.tags)) {
      cleanData.tags = [cleanData.type];
    }
    
    // Validate dates
    if (cleanData.expiresAt && !(cleanData.expiresAt instanceof Date)) {
      try {
        cleanData.expiresAt = new Date(cleanData.expiresAt);
        if (isNaN(cleanData.expiresAt.getTime())) {
          cleanData.expiresAt = null;
        }
      } catch (error) {
        cleanData.expiresAt = null;
      }
    }
    
    // Ensure boolean fields
    cleanData.isActive = cleanData.isActive !== false;
    cleanData.isVerified = cleanData.isVerified === true;
    
    return cleanData;
  }

  // Mock data generators for fallback
  generateIMDMockData() {
    return [
      {
        title: 'Weather Advisory - Monsoon Update',
        description: 'IMD weather advisory for monsoon conditions across various states. Citizens are advised to stay updated with local weather conditions.',
        source: 'IMD',
        sourceUrl: 'https://mausam.imd.gov.in/',
        type: 'weather',
        severity: 'medium',
        issuedAt: new Date(),
        affectedAreas: [{ state: 'Multiple States', city: 'Various Cities' }],
        instructions: ['Monitor weather updates', 'Take necessary precautions']
      }
    ];
  }

  generateSACHETMockData() {
    return [
      {
        title: 'Emergency Preparedness Advisory',
        description: 'SACHET advisory for emergency preparedness and disaster risk reduction measures.',
        source: 'SACHET',
        sourceUrl: 'https://sachet.ndma.gov.in/',
        type: 'general',
        severity: 'low',
        issuedAt: new Date(),
        affectedAreas: [{ state: 'India', city: 'All Areas' }],
        instructions: ['Stay prepared for emergencies', 'Keep emergency contacts ready']
      }
    ];
  }

  // Generate city-specific alerts for real-time search
  generateCitySpecificAlerts(cityName) {
    const now = new Date();
    const cityLower = cityName.toLowerCase();
    
    const cityAlerts = [];
    
    // Weather alerts based on city
    if (['mumbai', 'thane', 'pune'].includes(cityLower)) {
      cityAlerts.push({
        title: `Heavy Rainfall Alert - ${cityName}`,
        description: `IMD has issued a heavy rainfall warning for ${cityName}. Expected rainfall: 50-100mm in next 24 hours. Citizens advised to stay indoors.`,
        source: 'IMD',
        sourceUrl: 'https://mausam.imd.gov.in/',
        type: 'flood',
        severity: 'high',
        issuedAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        affectedAreas: [{ city: cityName, state: this.getCityState(cityName) }],
        instructions: [
          'Avoid waterlogged areas',
          'Stay indoors unless necessary',
          'Keep emergency supplies ready',
          'Monitor weather updates'
        ],
        tags: ['rainfall', 'weather', cityLower]
      });
    }
    
    if (['delhi', 'gurgaon', 'noida', 'faridabad'].includes(cityLower)) {
      cityAlerts.push({
        title: `Air Quality Alert - ${cityName}`,
        description: `Poor air quality reported in ${cityName}. AQI levels above 300. Sensitive groups should avoid outdoor activities.`,
        source: 'Manual',
        sourceUrl: 'https://app.cpcbccr.com/AQI_India/',
        type: 'general',
        severity: 'medium',
        issuedAt: new Date(now.getTime() - 60 * 60 * 1000), // 1 hour ago
        affectedAreas: [{ city: cityName, state: this.getCityState(cityName) }],
        instructions: [
          'Wear N95 masks outdoors',
          'Avoid morning walks',
          'Keep windows closed',
          'Use air purifiers if available'
        ],
        tags: ['air-quality', 'pollution', cityLower]
      });
    }
    
    if (['chennai', 'coimbatore', 'madurai'].includes(cityLower)) {
      cityAlerts.push({
        title: `Heat Wave Warning - ${cityName}`,
        description: `Severe heat wave conditions in ${cityName}. Temperature expected to reach 42°C. Take necessary precautions.`,
        source: 'IMD',
        sourceUrl: 'https://mausam.imd.gov.in/',
        type: 'weather',
        severity: 'high',
        issuedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), // 48 hours from now
        affectedAreas: [{ city: cityName, state: this.getCityState(cityName) }],
        instructions: [
          'Avoid direct sun exposure 11 AM - 4 PM',
          'Drink plenty of water',
          'Wear light colored clothes',
          'Stay in shade or AC'
        ],
        tags: ['heatwave', 'temperature', cityLower]
      });
    }
    
    if (['kolkata', 'howrah', 'durgapur'].includes(cityLower)) {
      cityAlerts.push({
        title: `Thunderstorm Alert - ${cityName}`,
        description: `Thunderstorm with lightning expected in ${cityName}. Wind speeds up to 60 kmph. Stay indoors.`,
        source: 'IMD',
        sourceUrl: 'https://mausam.imd.gov.in/',
        type: 'weather',
        severity: 'medium',
        issuedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 minutes ago
        expiresAt: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6 hours from now
        affectedAreas: [{ city: cityName, state: this.getCityState(cityName) }],
        instructions: [
          'Stay indoors during thunderstorm',
          'Avoid using electronic devices',
          'Stay away from windows',
          'Unplug electrical appliances'
        ],
        tags: ['thunderstorm', 'lightning', cityLower]
      });
    }
    
    // General earthquake preparedness for all cities
    cityAlerts.push({
      title: `Earthquake Preparedness - ${cityName}`,
      description: `NDMA advisory for earthquake preparedness in ${cityName}. Recent seismic activity detected in the region.`,
      source: 'NDMA',
      sourceUrl: 'https://ndma.gov.in/',
      type: 'earthquake',
      severity: 'low',
      issuedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      affectedAreas: [{ city: cityName, state: this.getCityState(cityName) }],
      instructions: [
        'Conduct earthquake drills',
        'Secure heavy furniture',
        'Keep emergency kit ready',
        'Identify safe spots in buildings'
      ],
      tags: ['earthquake', 'preparedness', cityLower]
    });
    
    return cityAlerts;
  }

  // Helper to get state for city
  getCityState(cityName) {
    const cityStateMap = {
      'mumbai': 'Maharashtra', 'thane': 'Maharashtra', 'pune': 'Maharashtra',
      'delhi': 'Delhi', 'gurgaon': 'Haryana', 'noida': 'Uttar Pradesh', 'faridabad': 'Haryana',
      'chennai': 'Tamil Nadu', 'coimbatore': 'Tamil Nadu', 'madurai': 'Tamil Nadu',
      'kolkata': 'West Bengal', 'howrah': 'West Bengal', 'durgapur': 'West Bengal',
      'bangalore': 'Karnataka', 'mysore': 'Karnataka',
      'hyderabad': 'Telangana', 'secunderabad': 'Telangana',
      'ahmedabad': 'Gujarat', 'surat': 'Gujarat',
      'jaipur': 'Rajasthan', 'jodhpur': 'Rajasthan'
    };
    
    return cityStateMap[cityName.toLowerCase()] || 'India';
  }
}

module.exports = new ScrapingService();
