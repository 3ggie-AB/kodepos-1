import { createFullText, haversineDistance, nearestDetection } from './kodepos'
import { DataResult } from '../../types'

describe('kodepos helpers', () => {
  describe('createFullText', () => {
    it('should create a string with all relevant fields', () => {
      const data: DataResult = {
        code: 12345,
        village: 'Test Village',
        district: 'Test District',
        regency: 'Test Regency',
        province: 'Test Province',
        latitude: 0,
        longitude: 0,
        elevation: 0,
        timezone: 'Asia/Jakarta',
      }
      const fullText = createFullText(data)
      expect(fullText).toContain('12345 Test Village')
      expect(fullText).toContain('Test Village Test District')
      expect(fullText).toContain('Test District Test Regency')
      expect(fullText).toContain('Test Regency Test Province')
    })
  })

  describe('haversineDistance', () => {
    it('should return 0 for the same coordinates', () => {
      expect(haversineDistance(10, 10, 10, 10)).toBe(0)
    })

    it('should calculate the correct distance between two points', () => {
      const lat1 = 48.8566
      const lon1 = 2.3522
      const lat2 = 51.5074
      const lon2 = -0.1278
      const distance = haversineDistance(lat1, lon1, lat2, lon2)

      expect(distance).toBeCloseTo(343.56, 2)
    })

    it('should handle negative coordinates', () => {
      const distance = haversineDistance(-10, -10, 10, 10)
      expect(distance).toBeGreaterThan(0)

      expect(distance).toBeCloseTo(3137.04, 2)
    })
  })

  describe('nearestDetection', () => {
    const sampleData: DataResult[] = [
      {
        province: 'A',
        regency: 'B',
        district: 'C',
        village: 'D',
        code: 11111,
        latitude: 1,
        longitude: 1,
        elevation: 10,
        timezone: 'UTC',
      },
      {
        province: 'E',
        regency: 'F',
        district: 'G',
        village: 'H',
        code: 22222,
        latitude: 10,
        longitude: 10,
        elevation: 20,
        timezone: 'UTC',
      },
      {
        province: 'I',
        regency: 'J',
        district: 'K',
        village: 'L',
        code: 33333,
        latitude: -5,
        longitude: -5,
        elevation: 30,
        timezone: 'UTC',
      },
    ]

    it('should return the nearest location', () => {
      const nearest = nearestDetection(sampleData, 0.9, 0.9)
      expect(nearest).not.toBeNull()
      expect(nearest?.code).toBe(11111)
      expect(nearest?.distance).toBeCloseTo(haversineDistance(0.9, 0.9, 1, 1), 2)
    })

    it('should return the nearest location even if it is further away', () => {
      const nearest = nearestDetection(sampleData, 8, 8)
      expect(nearest).not.toBeNull()
      expect(nearest?.code).toBe(22222)
      expect(nearest?.distance).toBeCloseTo(haversineDistance(8, 8, 10, 10), 2)
    })

    it('should handle target coordinates far from any data point', () => {
      const nearest = nearestDetection(sampleData, 100, 100)

      expect(nearest).not.toBeNull()
      expect(nearest?.code).toBe(22222)
    })

    it('should return null if data is empty', () => {
      expect(nearestDetection([], 1, 1)).toBeNull()
    })

    it('should include distance in the result', () => {
      const nearest = nearestDetection(sampleData, 1, 1)
      expect(nearest).not.toBeNull()
      expect(nearest?.distance).toBeDefined()
      expect(nearest?.distance).toBe(0)
    })
  })
})
