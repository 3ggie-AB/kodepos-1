import Fuse from 'fuse.js'
import { SearchQueries } from '../../types'
import { createSpecResponse, sendBadRequest } from '../helpers/spec'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'

export const search = (app: FastifyInstance) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const queryParams = request.query as Record<string, string | undefined>

    const validKeys = [
      'code',
      'village',
      'district',
      'regency',
      'province',
      'latitude',
      'longitude',
      'elevation',
      'timezone',
    ]

    const filters = Object.fromEntries(
      Object.entries(queryParams).filter(([key, value]) => value && validKeys.includes(key))
    )

    if (Object.keys(filters).length === 0) {
      const response = createSpecResponse(app.data || [])
      reply.header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
      return reply.send(response)
    }


    let result: any[] = app.data || []

    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue

      if (/^-?\d+(\.\d+)?$/.test(value)) {
        result = result.filter((item) => String(item[key]) === value)
      } else {
        const fuse = new Fuse(result, {
          keys: [key],
          threshold: 0.3,
        })
        const found = fuse.search(value)
        result = found.map(({ item }) => item)
      }
    }

    const response = createSpecResponse(result)
    reply.header('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800')
    return reply.send(response)
  }
}
