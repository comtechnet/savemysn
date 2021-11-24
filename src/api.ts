import * as U from './util'

const API_URL = 'https://oc2oa03354.execute-api.us-east-2.amazonaws.com/dev/v1'

async function api(method: string, route: string, json?: any) : Promise<any> {
  let result
  const url = `${API_URL}${route}`
  try {
    U.zap(`api: ${method} ${url} :`, json)
    const response = await fetch(url, { 
      method,
      mode: 'cors',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json) 
    })
    result = await response.json()  
  } catch (err) {
    U.zap(`api: error ${method}ing to ${url}: `, err)
  }

  return result
}

export async function apiEvent_login_facebook(accessToken: string) : Promise<any> {
  const json = {
    event: 'login_facebook',
    access_token: accessToken
  }
  const result = await api('POST', '/login', json)
  return result
}

export async function apiEvent_start_facebook_backup(accessToken: string) : Promise<any> {
  const json = {
    event: 'start_facebook_backup',
    access_token: accessToken
  }
  const result = await api('POST', '/start', json)
  return result
}

export async function apiEvent_get_document(collection: string, docId: string, userId: string) : Promise<any> {
  const json = {
    event: 'get_document',
    collection,
    document_id: docId,
    user_id: userId
  }
  const result = await api('POST', '/job', json)
  return result
}

export async function apiEvent_get_download_link(jobId: string, userId: string) : Promise<any> {
  const json = {
    event: 'get_download_link',
    job_id: jobId,
    user_id: userId
  }
  const result = await api('POST', '/link', json)
  return result
}

// Facebook lies in its response to getLoginStatus. Therefore, when we get its token back, we need
// to call the graph API to get the real status of the token

export async function getFacebookUser(token: string) : Promise<any | undefined> {
  U.zap(`getFacebookUserId: token: ${token}`)
  const url = `https://graph.facebook.com/v12.0/me?access_token=${token}`
  try {
    const response = await fetch(url)
    const result = await response.json()
    return result
  } catch (err) {
    U.zap('getFacebookUserId: caught error: ', err)
    return undefined
  }
}