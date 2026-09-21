import 'server-only'
import { countUsers, createUser } from './users'

/**
 * Crée le premier compte administrateur si la base est vide et que
 * AUTH_SEED_EMAIL / AUTH_SEED_PASSWORD sont définis. Idempotent.
 */
let done: Promise<void> | null = null

export function bootstrap() {
  if (!done) {
    done = (async () => {
      const email = process.env.AUTH_SEED_EMAIL
      const password = process.env.AUTH_SEED_PASSWORD
      if (!email || !password) return
      if ((await countUsers()) > 0) return
      await createUser({ email, password, name: process.env.AUTH_SEED_NAME ?? 'Administrateur', role: 'admin' })
      console.info(`[auth] compte administrateur initial créé : ${email}`)
    })().catch((error) => {
      done = null
      throw error
    })
  }
  return done
}
