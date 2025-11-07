import { ApiMetadataRequestBody, HeartbeatRequestBody } from './types'

export class APIRequester {
  private static instance: APIRequester
  private apiKey: string
  private static readonly API_URL =
    process.env.API_URL || 'http://localhost:3000/graphql' // Use a fixed api url for now (TBD whether to use it from env or prompt user to type it).

  private constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  public static getInstance(apiKey?: string): APIRequester {
    if (!APIRequester.instance) {
      if (!apiKey) {
        throw new Error('API key must be provided for the first initialization')
      }
      APIRequester.instance = new APIRequester(apiKey)
    } else if (apiKey) {
      APIRequester.instance.updateApiKey(apiKey)
    }
    return APIRequester.instance
  }

  public updateApiKey(key: string) {
    this.apiKey = key
  }

  public async setApiMetadata(metadata: ApiMetadataRequestBody) {
    const query = `
    mutation SetApiMetadata($api_key: String!, $editor: EditorInput!, $machine_name: String!, $os: String!) {
      setApiMetadata(
        api_key: $api_key
        editor: $editor
        machine_name: $machine_name
        os: $os
      ) {
        success
        errors
      }
    }`

    const response = await fetch(APIRequester.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: {
          api_key: metadata.api_key,
          editor: metadata.editor,
          machine_name: metadata.machine_name,
          os: metadata.os,
        },
      }),
    })

    const json_response: any = await response.json()
    const data = json_response.data.setApiMetadata

    if (data.errors.length > 0) {
      throw new Error('Failed to set API metadata', { cause: data.errors })
    }

    return data.success
  }

  public async sendHeartbeat(heartbeat: HeartbeatRequestBody) {
    const query = `
      mutation Heartbeat($session: SessionInput!) {
        heartbeat(session: $session) {
          success
          errors
        }
      }
    `

    const response = await fetch(APIRequester.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Chronicle-Api-Key': `${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables: { session: heartbeat.session },
      }),
    })

    const json_response: any = await response.json()
    const data = json_response.data.heartbeat

    if (data.errors.length > 0) {
      throw new Error('Failed to send heartbeat', { cause: data.errors })
    }

    return data.success
  }
}
