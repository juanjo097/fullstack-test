import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { TokenGenerator } from '@modules/auth/domain'

export function createAuthMiddleware(tokenGenerator: TokenGenerator): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({ error: 'Authorization header is required' })
      return
    }

    const [bearer, token] = authHeader.split(' ')

    if (bearer !== 'Bearer' || !token) {
      res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' })
      return
    }

    const payload = tokenGenerator.verify(token)

    if (!payload) {
      res.status(401).json({ error: 'Invalid or expired token' })
      return
    }

    ;(req as any).user = {
      userId: payload.userId,
      organizationId: payload.organizationId,
      roleId: payload.roleId,
    }

    next()
  }
}
