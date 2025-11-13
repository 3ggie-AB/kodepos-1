import qs from 'node:querystring'
import { SearchQueries } from '../../types'
import type { FastifyReply, FastifyRequest } from 'fastify'

export const home = async (
  request: FastifyRequest<{ Querystring: SearchQueries }>,
  reply: FastifyReply
) => {
  const { q } = request.query
  const baseurl = `${request.protocol}://${request.hostname}`

  if (typeof q !== 'undefined' && q.trim() !== '') {
    return reply.status(200).send({
      status: 'success',
      message: 'Redirect handled as JSON',
      query: request.query,
      redirect_url: `${baseurl}/search/?${qs.stringify(request.query)}`,
      author: {
        name: 'Egi Ahmad Baihaqi',
        role: 'Development IT'
      }
    })
  }

  return reply.status(200).send({
    status: 'info',
    message: 'Tidak ada parameter pencarian. Lihat dokumentasi di GitHub.',
    forked_from: 'https://github.com/sooluh/kodepos',
    edited_by: {
      name: 'Egi Ahmad Baihaqi',
      role: 'Development IT'
    }
  })
}
