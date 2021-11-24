import * as A from './api'

export function zap(...args: any): void {
  // tslint:disable-next-line:no-console
  console.log.apply(console, args);
}

interface FBAuthResponse {
  accessToken: string
  expiresIn: string
  reauthorize_required_in: string
  signedRequest: string
  userID: string
}

export async function handleFacebookResponse(response: any) : Promise<UserSchema | undefined> {
  let user
  if (response.status == 'connected') {
    const graphResult = await A.getFacebookUser(response.authResponse.accessToken)
    zap('handleFacebookResponse: result from graphApi: ', graphResult)
    user = await recordFacebookLogin(response.authResponse)
    if (user as any === 403) {
      zap('handleFacebookResponse: got 403 back from recordFacebookLogin')
      user = undefined
    } else {
      zap('handleFacebookResponse: recorded login, got this user back: ', user)
    }
  } else {
    zap('handleFacebookResponse: FB.getLoginStatus response: ', response)
  }
  return user
}

// TODO - make sure this stays in sync with the copy in savemy-lambdas and savemy-backend
export interface UserSchema {
  _id: string
  sourcePlatformId: string
  sourcePlatform: string
  lastLoginAt: string
  lastLoginToken: string
  hasCredit?: boolean
  lastPaymentAt?: string
  lastPaymentId?: string
  hasRunningJob?: boolean
  lastJobStartedAt?: string
  lastJobId?: string
}

export interface JobSchema {
  _id: string
  userId: string
  status: string
  completed: boolean
  startedAt: Date
  type: string
  jobData?: any
  lastUpdatedAt: string
  completedAt?: string
}

// TODO - honestly I do not know why I started this indirection ... why not just have the app call the api functions directly?
async function recordFacebookLogin(authResponse: FBAuthResponse) : Promise<UserSchema> {
  zap('recordFacebookLogin: recording on backend for: ', authResponse)
  const user = await A.apiEvent_login_facebook(authResponse.accessToken)
  return user
}
  
export async function startFacebookBackup(accessToken: string) : Promise<UserSchema> {
  zap('startFacebookBackup: starting backup on backend')
  const user = await A.apiEvent_start_facebook_backup(accessToken)
  zap('startFAcebookBackup: returned user: ', user)
  return user
}

export async function getJobInfo(jobId: string, userId: string) : Promise<JobSchema> {
  zap(`getJobInfo: ${jobId} @ ${userId}`)
  const job = await A.apiEvent_get_document('jobs', jobId, userId)
  return job
}