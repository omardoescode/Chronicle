import Cookies from 'js-cookie'

export interface User {
  user_id: string
  name: string
  email: string
}

export interface AuthResponse {
  success: boolean
  errors: string[] | null
  data: {
    token: string
    user: User
  } | null
}

interface GraphQLResponse<T> {
  data: T
  errors?: { message: string }[]
}

const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/graphql'

export async function fetchGraphQL<T>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T> {
  const token = Cookies.get('auth_token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })

  const json: GraphQLResponse<T> = await response.json()

  // Handle top-level GraphQL errors
  if (json.errors) {
    if (json.errors.some((e) => e.message.includes('InvalidToken'))) {
      window.dispatchEvent(new Event('auth:unauthorized'))
      throw new Error('Session expired')
    }
    throw new Error(json.errors.map((e) => e.message).join(', '))
  }

  // Handle nested resolver errors
  if (json.data) {
    const hasInvalidToken = Object.values(json.data as any).some((val: any) => {
      if (!val?.errors?.length) return false
      return val.errors.some((err: any) => {
        const msg = typeof err === 'string' ? err : err?.message || ''
        return msg.includes('InvalidToken')
      })
    })

    if (hasInvalidToken) {
      window.dispatchEvent(new Event('auth:unauthorized'))
      throw new Error('Session expired')
    }
  }

  return json.data
}
