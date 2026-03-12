/**
 * Unit tests for sourceIdentificationController
 * Tests API endpoint structure and HTTP 200 response
 */

const sourceIdentificationController = require('../src/controllers/sourceIdentificationController');

describe('SourceIdentificationController', () => {
  let mockReq, mockRes;
  
  beforeEach(() => {
    mockReq = {
      query: {
        lat: '28.6139',
        lng: '77.2090',
        pm25: '120',
        pm10: '180',
        no2: '60',
        co: '2.5',
        so2: '25',
        trafficLevel: 'heavy',
        distance_km: '0.05'
      }
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });
  
  test('should return HTTP 200 with required keys', async () => {
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalled();
    
    const responseData = mockRes.json.mock.calls[0][0];
    
    expect(responseData).toHaveProperty('vehicular');
    expect(responseData).toHaveProperty('industrial');
    expect(responseData).toHaveProperty('construction');
    expect(responseData).toHaveProperty('biomass');
    expect(responseData).toHaveProperty('summary');
  });
  
  test('should include summary with highest source', async () => {
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    const responseData = mockRes.json.mock.calls[0][0];
    
    expect(responseData.summary).toHaveProperty('highest');
    expect(responseData.summary).toHaveProperty('overallConfidence');
    expect(responseData.summary).toHaveProperty('timestamp');
    expect(responseData.summary).toHaveProperty('contributions');
  });
  
  test('should handle missing coordinates gracefully', async () => {
    mockReq.query.lat = undefined;
    mockReq.query.lng = undefined;
    
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    const responseData = mockRes.json.mock.calls[0][0];
    expect(responseData.summary).toHaveProperty('location');
  });
  
  test('should include notes_readable in response', async () => {
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    const responseData = mockRes.json.mock.calls[0][0];
    
    expect(responseData).toHaveProperty('notes_readable');
    expect(typeof responseData.notes_readable).toBe('string');
  });
  
  test('should always return HTTP 200 even with errors', async () => {
    // Force an error by passing invalid data
    mockReq.query.lat = 'invalid';
    mockReq.query.lng = 'invalid';
    
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    expect(mockRes.status).toHaveBeenCalledWith(200);
    const responseData = mockRes.json.mock.calls[0][0];
    expect(responseData).toHaveProperty('warnings');
  });
  
  test('should include human-readable warnings', async () => {
    await sourceIdentificationController.identifySources(mockReq, mockRes);
    
    const responseData = mockRes.json.mock.calls[0][0];
    
    if (responseData.warnings && responseData.warnings.length > 0) {
      responseData.warnings.forEach(warning => {
        expect(typeof warning).toBe('string');
        expect(warning.length).toBeGreaterThan(0);
      });
    }
  });
});

