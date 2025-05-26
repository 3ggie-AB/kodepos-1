import { detect } from './detect'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { DataResult, DetectQueries } from '../../types'
import * as kodeposHelpers from '../helpers/kodepos'
import * as specHelpers from '../helpers/spec'

const mockRequest = (query: Partial<Record<keyof DetectQueries, string | number | undefined>>) =>
  ({
    query: query as DetectQueries,
  }) as FastifyRequest<{ Querystring: DetectQueries }>

const mockReply = () => {
  const reply: Partial<FastifyReply> = {
    send: jest.fn().mockReturnThis(),
    header: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
  }
  return reply as FastifyReply
}

const mockApp = (data: DataResult[] = []) =>
  ({
    data: data,
  }) as unknown as FastifyInstance

describe('detect controller', () => {
  let appMock: FastifyInstance
  let requestMock: FastifyRequest<{ Querystring: DetectQueries }>
  let replyMock: FastifyReply

  let nearestDetectionSpy: jest.SpyInstance
  let sendBadRequestSpy: jest.SpyInstance
  let sendNotFoundSpy: jest.SpyInstance
  let createSpecResponseSpy: jest.SpyInstance

  beforeEach(() => {
    appMock = mockApp([
      {
        province: 'Test Province',
        regency: 'Test Regency',
        district: 'Test District',
        village: 'Test Village',
        code: 12345,
        latitude: 10,
        longitude: 20,
        distance: 0,
        elevation: 0,
        timezone: '',
      },
    ])
    replyMock = mockReply()

    nearestDetectionSpy = jest.spyOn(kodeposHelpers, 'nearestDetection')
    sendBadRequestSpy = jest
      .spyOn(specHelpers, 'sendBadRequest')
      .mockImplementation(() => replyMock)
    sendNotFoundSpy = jest.spyOn(specHelpers, 'sendNotFound').mockImplementation(() => replyMock)
    createSpecResponseSpy = jest
      .spyOn(specHelpers, 'createSpecResponse')
      .mockImplementation((data) => data as any)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should call sendBadRequest if latitude is missing', async () => {
    requestMock = mockRequest({ longitude: 10 })
    const handler = detect(appMock)
    await handler(requestMock, replyMock)

    expect(sendBadRequestSpy).toHaveBeenCalledWith(
      replyMock,
      "The 'latitude' and 'longitude' parameters is required."
    )
    expect(nearestDetectionSpy).not.toHaveBeenCalled()
    expect(replyMock.send).not.toHaveBeenCalled()
  })

  it('should call sendBadRequest if longitude is missing', async () => {
    requestMock = mockRequest({ latitude: 10 })
    const handler = detect(appMock)
    await handler(requestMock, replyMock)

    expect(sendBadRequestSpy).toHaveBeenCalledWith(
      replyMock,
      "The 'latitude' and 'longitude' parameters is required."
    )
    expect(nearestDetectionSpy).not.toHaveBeenCalled()
    expect(replyMock.send).not.toHaveBeenCalled()
  })

  it('should call sendBadRequest if latitude is empty string', async () => {
    requestMock = mockRequest({ latitude: NaN, longitude: 10 })
    const handler = detect(appMock)
    await handler(requestMock, replyMock)
    expect(sendBadRequestSpy).toHaveBeenCalledWith(
      replyMock,
      "The 'latitude' and 'longitude' parameters is required."
    )
  })

  it('should call sendNotFound if nearestDetection returns null', async () => {
    nearestDetectionSpy.mockReturnValue(null)

    requestMock = mockRequest({ latitude: 1, longitude: 1 })
    const handler = detect(appMock)
    await handler(requestMock, replyMock)

    expect(nearestDetectionSpy).toHaveBeenCalledWith(appMock.data, 1, 1)
    expect(sendNotFoundSpy).toHaveBeenCalledWith(replyMock)
    expect(replyMock.send).not.toHaveBeenCalled()
  })

  it('should send response if nearestDetection returns a result', async () => {
    const mockResult: DataResult = {
      province: 'Test Province',
      regency: 'Test Regency',
      district: 'Test District',
      village: 'Test Village',
      code: 12345,
      latitude: 10,
      longitude: 20,
      distance: 1,
      elevation: 0,
      timezone: '',
    }
    nearestDetectionSpy.mockReturnValue(mockResult)
    createSpecResponseSpy.mockReturnValue({ data: mockResult })

    requestMock = mockRequest({ latitude: 10.0, longitude: 20.0 })
    const handler = detect(appMock)
    await handler(requestMock, replyMock)

    expect(nearestDetectionSpy).toHaveBeenCalledWith(appMock.data, 10.0, 20.0)
    expect(sendBadRequestSpy).not.toHaveBeenCalled()
    expect(sendNotFoundSpy).not.toHaveBeenCalled()
    expect(createSpecResponseSpy).toHaveBeenCalledWith(mockResult)
    expect(replyMock.header).toHaveBeenCalledWith(
      'Cache-Control',
      's-maxage=86400, stale-while-revalidate=604800'
    )
    expect(replyMock.send).toHaveBeenCalledWith({ data: mockResult })
  })
})
