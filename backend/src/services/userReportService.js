const cache = require('../utils/cache');
const logger = require('../utils/logger');

class UserReportService {
  constructor() {
    // In-memory storage (use MongoDB in production)
    this.reports = [];
    this.reportIdCounter = 1;
    // Track report submissions per phone for rate limiting
    this.phoneSubmissions = new Map(); // phone -> [{ timestamp, reportId }]
  }

  /**
   * Submit a pollution report (legacy method)
   */
  async submitReport(reportData) {
    try {
      const report = {
        id: `RPT${Date.now()}_${this.reportIdCounter++}`,
        type: reportData.type || 'general',
        description: reportData.description,
        location: {
          lat: reportData.lat,
          lon: reportData.lon,
          address: reportData.address || 'Unknown location',
        },
        category: reportData.category || 'pollution',
        severity: reportData.severity || 'medium',
        imageUrl: reportData.imageUrl || null,
        imageBase64: reportData.imageBase64 || null,
        status: 'pending',
        userId: reportData.userId || 'anonymous',
        userContact: reportData.userContact || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
        verified: false,
      };

      // Validate report
      this.validateReport(report);

      // Store report
      this.reports.push(report);

      // Log for admin notification
      logger.info(`New pollution report: ${report.id} - ${report.type} at ${report.location.address}`);

      return {
        success: true,
        reportId: report.id,
        message: 'Report submitted successfully. Thank you for contributing to cleaner air!',
        report,
      };
    } catch (error) {
      logger.error(`Report submission error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit report with phone verification (new OTP flow)
   */
  async submitReportWithPhone(reportData) {
    try {
      const report = {
        _id: `RPT${Date.now()}_${this.reportIdCounter++}`,
        reportId: reportData.reportId,
        phone: reportData.phone,
        phoneMasked: reportData.phoneMasked,
        category: reportData.category,
        description: reportData.description,
        images: reportData.images || [],
        location: reportData.location,
        address: reportData.address,
        submittedAt: reportData.submittedAt,
        verificationMeta: reportData.verificationMeta,
        status: reportData.status || 'new',
        source: reportData.source || 'public-report',
        ip: reportData.ip,
        userAgent: reportData.userAgent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        votes: 0,
      };

      // Validate report
      this.validateReport(report);

      // Store report
      this.reports.push(report);

      // Track submission for rate limiting
      const phone = reportData.phone;
      if (!this.phoneSubmissions.has(phone)) {
        this.phoneSubmissions.set(phone, []);
      }
      this.phoneSubmissions.get(phone).push({
        timestamp: Date.now(),
        reportId: report.reportId,
      });

      // Log for admin notification
      logger.info(`New verified pollution report: ${report.reportId} from ${this.maskPhone(phone)}`);

      return report;
    } catch (error) {
      logger.error(`Report submission error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check rate limits for report submission
   */
  async checkReportRateLimit(phone) {
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const submissions = this.phoneSubmissions.get(phone) || [];
    
    // Check: max 1 report per 10 minutes
    const recentSubmissions = submissions.filter(s => s.timestamp > tenMinutesAgo);
    if (recentSubmissions.length >= 1) {
      const oldestRecent = recentSubmissions[0];
      const retryAfter = Math.ceil((oldestRecent.timestamp + (10 * 60 * 1000) - now) / 1000);
      return {
        allowed: false,
        retryAfterSeconds: retryAfter,
        error: `You may submit only 1 report every 10 minutes. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`,
      };
    }

    // Check: max 5 reports per day
    const dailySubmissions = submissions.filter(s => s.timestamp > oneDayAgo);
    if (dailySubmissions.length >= 5) {
      return {
        allowed: false,
        retryAfterSeconds: null,
        error: 'You have reached the daily limit of 5 reports. Please try again tomorrow.',
      };
    }

    return { allowed: true };
  }

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    if (!phone || phone.length < 4) return 'XXXX';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 4) return 'XXXX';
    const last4 = cleaned.slice(-4);
    return `+${cleaned.slice(0, -4).replace(/\d/g, 'X')}-${last4}`;
  }

  /**
   * Validate report data
   */
  validateReport(report) {
    if (!report.description || report.description.length < 10) {
      throw new Error('Description must be at least 10 characters');
    }
    if (!report.location.lat || !report.location.lon) {
      throw new Error('Location coordinates are required');
    }
    if (report.description.length > 1000) {
      throw new Error('Description must be less than 1000 characters');
    }
  }

  /**
   * Get all reports (admin) - masks phone numbers
   */
  async getAllReports(filters = {}) {
    let filteredReports = [...this.reports];

    // Apply filters
    if (filters.status) {
      filteredReports = filteredReports.filter(r => r.status === filters.status);
    }
    if (filters.category) {
      filteredReports = filteredReports.filter(r => r.category === filters.category);
    }
    if (filters.type) {
      filteredReports = filteredReports.filter(r => r.type === filters.type);
    }
    if (filters.severity) {
      filteredReports = filteredReports.filter(r => r.severity === filters.severity);
    }
    if (filters.startDate) {
      filteredReports = filteredReports.filter(r => new Date(r.createdAt || r.submittedAt) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filteredReports = filteredReports.filter(r => new Date(r.createdAt || r.submittedAt) <= new Date(filters.endDate));
    }

    // Sort by date (newest first)
    filteredReports.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.submittedAt);
      const dateB = new Date(b.createdAt || b.submittedAt);
      return dateB - dateA;
    });

    // Mask phone numbers for admin view
    const maskedReports = filteredReports.map(report => {
      const masked = { ...report };
      if (masked.phone && !masked.phoneMasked) {
        masked.phoneMasked = this.maskPhone(masked.phone);
      }
      // Remove full phone from admin view
      delete masked.phone;
      return masked;
    });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginatedReports = maskedReports.slice(startIndex, startIndex + limit);

    return {
      reports: paginatedReports,
      pagination: {
        total: maskedReports.length,
        page,
        limit,
        pages: Math.ceil(maskedReports.length / limit),
      },
      summary: this.getReportsSummary(filteredReports),
    };
  }

  /**
   * Get reports summary
   */
  getReportsSummary(reports) {
    return {
      total: reports.length,
      byStatus: {
        pending: reports.filter(r => r.status === 'pending').length,
        investigating: reports.filter(r => r.status === 'investigating').length,
        resolved: reports.filter(r => r.status === 'resolved').length,
        dismissed: reports.filter(r => r.status === 'dismissed').length,
      },
      byCategory: {
        pollution: reports.filter(r => r.category === 'pollution').length,
        burning: reports.filter(r => r.category === 'burning').length,
        construction: reports.filter(r => r.category === 'construction').length,
        industrial: reports.filter(r => r.category === 'industrial').length,
        traffic: reports.filter(r => r.category === 'traffic').length,
        other: reports.filter(r => r.category === 'other').length,
      },
      bySeverity: {
        low: reports.filter(r => r.severity === 'low').length,
        medium: reports.filter(r => r.severity === 'medium').length,
        high: reports.filter(r => r.severity === 'high').length,
        critical: reports.filter(r => r.severity === 'critical').length,
      },
    };
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId) {
    const report = this.reports.find(r => r.id === reportId);
    if (!report) {
      throw new Error('Report not found');
    }
    return report;
  }

  /**
   * Update report status (admin)
   */
  async updateReportStatus(reportId, status, adminNote = '') {
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      throw new Error('Report not found');
    }

    const validStatuses = ['pending', 'investigating', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    this.reports[reportIndex].status = status;
    this.reports[reportIndex].adminNote = adminNote;
    this.reports[reportIndex].updatedAt = new Date().toISOString();

    return this.reports[reportIndex];
  }

  /**
   * Vote on a report
   */
  async voteReport(reportId, voteType = 'up') {
    const reportIndex = this.reports.findIndex(r => r.id === reportId);
    if (reportIndex === -1) {
      throw new Error('Report not found');
    }

    if (voteType === 'up') {
      this.reports[reportIndex].votes += 1;
    } else if (voteType === 'down') {
      this.reports[reportIndex].votes -= 1;
    }

    return this.reports[reportIndex];
  }

  /**
   * Get nearby reports
   */
  async getNearbyReports(lat, lon, radiusKm = 5) {
    const nearbyReports = this.reports.filter(report => {
      const distance = this.calculateDistance(lat, lon, report.location.lat, report.location.lon);
      return distance <= radiusKm;
    });

    return nearbyReports.map(report => ({
      ...report,
      distance: this.calculateDistance(lat, lon, report.location.lat, report.location.lon),
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Get report statistics
   */
  async getStatistics() {
    const now = new Date();
    const last24h = new Date(now - 24 * 60 * 60 * 1000);
    const last7d = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now - 30 * 24 * 60 * 60 * 1000);

    return {
      total: this.reports.length,
      last24h: this.reports.filter(r => new Date(r.createdAt) >= last24h).length,
      last7d: this.reports.filter(r => new Date(r.createdAt) >= last7d).length,
      last30d: this.reports.filter(r => new Date(r.createdAt) >= last30d).length,
      resolutionRate: this.reports.length > 0 
        ? Math.round((this.reports.filter(r => r.status === 'resolved').length / this.reports.length) * 100)
        : 0,
      averageResponseTime: this.calculateAverageResponseTime(),
      topReportedAreas: this.getTopReportedAreas(),
    };
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime() {
    const resolvedReports = this.reports.filter(r => r.status === 'resolved');
    if (resolvedReports.length === 0) return null;

    const totalTime = resolvedReports.reduce((sum, r) => {
      return sum + (new Date(r.updatedAt) - new Date(r.createdAt));
    }, 0);

    const avgMs = totalTime / resolvedReports.length;
    const avgHours = Math.round(avgMs / (1000 * 60 * 60));
    return `${avgHours} hours`;
  }

  /**
   * Get top reported areas
   */
  getTopReportedAreas() {
    const areaCounts = {};
    
    this.reports.forEach(report => {
      const area = report.location.address.split(',')[0] || 'Unknown';
      areaCounts[area] = (areaCounts[area] || 0) + 1;
    });

    return Object.entries(areaCounts)
      .map(([area, count]) => ({ area, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /**
   * Get report categories
   */
  getCategories() {
    return [
      { id: 'pollution', label: 'General Pollution', icon: '💨', description: 'Smoke, smog, or unusual air quality' },
      { id: 'burning', label: 'Waste/Stubble Burning', icon: '🔥', description: 'Open burning of garbage, leaves, or crop residue' },
      { id: 'construction', label: 'Construction Dust', icon: '🏗️', description: 'Dust from construction sites' },
      { id: 'industrial', label: 'Industrial Emission', icon: '🏭', description: 'Factory smoke or industrial pollution' },
      { id: 'traffic', label: 'Vehicle Pollution', icon: '🚗', description: 'Excessive vehicle smoke or traffic congestion' },
      { id: 'other', label: 'Other', icon: '📍', description: 'Other pollution-related issues' },
    ];
  }
}

module.exports = new UserReportService();

