import { initTRPC } from '@trpc/server'
import { Context } from 'hono'
import { z } from 'zod'

export type ContextType = {
  env: any
  req: any
  res: any
}

export const createContext = (c: Context): ContextType => {
  return {
    env: c.env,
    req: c.req,
    res: c.res,
  }
}

const t = initTRPC.context<ContextType>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const middleware = t.middleware
