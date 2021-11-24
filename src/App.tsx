import * as U from './util'
import * as A from './api'
import React, { useState, useEffect } from 'react'
import './App.css'
import logo from './sms-logo.png'
import { loadStripe } from '@stripe/stripe-js'
import { DateTime } from 'luxon'
import { SocialIcon } from 'react-social-icons'

import {
  CheckCircleIcon,
  ChevronDownIcon,
  MailIcon,
} from '@heroicons/react/solid'

declare global { interface Window { FB: any } }
let loggedInUser : U.UserSchema | undefined
let currentJob : U.JobSchema | undefined

const stripeLoadPromise = loadStripe("pk_test_51JcGE3ICcbqfIBEKGJeEgNpeJRFAKpR4mnTrpHlzT4csjObyjVJTgyCdCj1lnLInWxe4Rhgyk0c7BAHm9VdZfCCW00pMBXkmUx")

async function collectPayment(user: U.UserSchema | undefined) {
  U.zap(`collectPayment: for: `, user)
  if (user) {
    const stripe = await stripeLoadPromise;
    if (stripe) {
      const { error } = await stripe.redirectToCheckout({
        lineItems: [{
          price: 'price_1JcGu0ICcbqfIBEKAvIkmxNL',
          quantity: 1,
        }],
        mode: 'payment',
        clientReferenceId: user._id,
        successUrl: `https://savemystuff.net`,
        cancelUrl: 'https://savemystuff.net',
      })

    }  
  } else {
    U.zap('collectPayment: no user logged in - cannot redirect to payment screen')
  }
}

type accountState = 'unknown' | 'login' | 'credit' | 'backing' | 'complete'

// Some of this is copy-paste from sample tailwindcss code - should probably go through and make sure I understand it all someday
export default function App() {
  U.zap('App.render()')
  const [status, setStatus] = useState<accountState>('unknown');
  const showBuyButton = (status === 'login') || (status === 'complete')
  const showDownloadButton = !!(status !== 'unknown' && loggedInUser?.lastJobId && currentJob?.status === 'finished_success')
  const updateStatusFromUser = async (user: U.UserSchema | undefined) => {
    if (user) {
      if (user.hasCredit) {
        U.zap('updateStatusFromUser: --> credit')
        setStatus('credit')
      } else if (user.hasRunningJob) {
        currentJob = await U.getJobInfo(user.lastJobId!, user._id)
        U.zap('updateStatusFromUser: job is running - set currentJob to: ', currentJob)
        if (currentJob.status === 'finished_success') {
          U.zap('updateStatusFromUser: --> complete')
          setStatus('complete')  
        } else {
          U.zap('updateStatusFromUser: --> backing')
          setStatus('backing')  
        }
      } else {
        U.zap('updateStatusFromUser: --> login')
        setStatus('login')
      }
    } else {
      U.zap('updateStatusFromUser: --> unknown')
      setStatus('unknown')
    }
  }

  const handleDownloadButton = async () => {
    U.zap('handleDownloadButton')
    if (loggedInUser) {
      const result = await A.apiEvent_get_download_link(loggedInUser.lastJobId!, loggedInUser._id)
      U.zap(`handleDownloadButton: got link: ${result?.link}`)
      const filename = `fbphotos_${DateTime.fromISO(loggedInUser.lastJobStartedAt!).toFormat('yMMdd-HHmm')}.zip`
      download(result.link, filename)
    }
  }

  const handleStartButton = async () => { 
    U.zap('handleStartButton')
    if (loggedInUser) {
      loggedInUser = await U.startFacebookBackup(loggedInUser.lastLoginToken)
      updateStatusFromUser(loggedInUser)
    } 
    else U.zap('handleStartButton: unable to launch job - no loggedInUser')
  }
  const checkFacebookStatus = async () => {
    window.FB.getLoginStatus(async (response:any) => {
      U.zap('App FB.getLoginStatus returned ... now checking graphApi')
      loggedInUser = await U.handleFacebookResponse(response)
      updateStatusFromUser(loggedInUser)
    })
  }

  const handleFacebookLogin = async () => {
    U.zap('handleFacebookLogin')
    // Arggggh - facebook would not let this be async :(
    window.FB.login((response: any) => {
      U.zap('handleFacebookLogin: response: ', response)
      U.handleFacebookResponse(response).then((result) => {
        loggedInUser = result
        updateStatusFromUser(loggedInUser)
      })
    }, { scope: 'user_photos', return_scopes: true})
  }

  const handleFacebookLogout = async () => {
    U.zap('handleFacebookLogout')
    window.FB.logout((response: any) => {
      U.zap('handleFacebookLogout: response: ', response)
      U.handleFacebookResponse(response).then(() => {
        loggedInUser = undefined
        updateStatusFromUser(loggedInUser)
      })
    })
  }

  useEffect(() => {
    // We need to have an up-to-date token from the user so record that anytime they load this page
    U.zap('App calling FB.getLoginStatus')
    checkFacebookStatus()
    // We ONLY want this to run on page load - the empty array keeps it from rerunning when state changes
  }, [])

  // The facebook button is unreliable
  // <div className="fb-login-button" data-width="" data-size="large" data-button-type="continue_with" data-layout="default" data-auto-logout-link="false" data-use-continue-as="true"></div>

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="bg-gradient-to-r from-blue-300 to-blue-600 shadow-lg sm:rounded-3xl py-2 my-2">
            <div className="flex justify-center">
              <img src={logo} className="h-16" />
            </div>
        </div>
        <div className="relative p-10 bg-white shadow-lg sm:rounded-3xl">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-300">
              <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <p className='text-center'>The EASIEST way to backup your social media photos.</p>
                <p className='text-center text-red-600 font-bold'>Use them to make prints or digital albums.</p>

                <p className='text-center' >A simple process ...</p>
                <p className='text-center' >Login, Purchase, Start, <span className='text-blue-400'>(chill)</span>, Download</p>
                <ul className="list-disc space-y-2">
                  <li className={'flex flex-col items-center' + (status === 'unknown' ? '' : ' hidden')}>
                    <button onClick={handleFacebookLogin} type="button" className=" w-48 inline-flex justify-center items-center px-4 py-2 border-2 border-blue-900 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      <SocialIcon network='facebook' style={{ height: 24, width: 24 }} fgColor='#ffffff'/><span className='mx-1'>Login to Facebook</span>
                    </button>
                  </li>
                  <li className={'flex flex-col items-center' + (showBuyButton ? '' : ' hidden')}>
                    <button onClick={() => collectPayment(loggedInUser)} type="button" className=" w-48 inline-flex justify-center items-center px-4 py-2 border-2 border-green-400 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Buy A Backup - $2
                    </button>
                  </li>
                  <li className={'flex flex-col items-center' + (status === 'credit' ? '' : ' hidden')}>
                    <button onClick={handleStartButton} type="button" className="w-48 inline-flex justify-center items-center px-4 py-2 border border-blue-400 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Start Your Backup
                    </button>
                  </li>
                  <li className={'flex flex-col items-center' + (status === 'backing' ? '' : ' hidden')}>
                    <span className='text-blue-400'>Started backing up @ {loggedInUser?.lastJobStartedAt && DateTime.fromISO(loggedInUser.lastJobStartedAt).toLocaleString(DateTime.DATETIME_MED)}</span>
                  </li>
                  <li className={'flex flex-col items-center' + (status === 'unknown' ? ' hidden' : '')}>
                    <button onClick={handleFacebookLogout} type="button" className=" w-48 inline-flex justify-center items-center px-4 py-2 border-2 border-blue-900 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    <SocialIcon network='facebook' style={{ height: 24, width: 24 }} fgColor='#ffffff'/><span className='mx-1'>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
                <div className="py-4 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <li className={'flex flex-col items-center' + (showDownloadButton ? '' : ' hidden')}>
                    <p className='text-black py-1'>Backup Result from {loggedInUser?.lastJobStartedAt && DateTime.fromISO(loggedInUser.lastJobStartedAt).toLocaleString(DateTime.DATETIME_MED)}</p>
                    <button onClick={handleDownloadButton} type="button" className="w-48 inline-flex justify-center items-center px-4 py-2 border-2 border-blue-500 rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                      Download Results
                    </button>
                  </li>
              </div>
              <div className="py-4 text-base leading-6  text-gray-700 sm:text-lg sm:leading-7 flex flex-row items-center justify-center">
                <p>Any questions?</p>
                <MailIcon className='px-1 w-8 h-8'/>
                <a className='text-blue-500 font-bold inline' href='info@savemystuff.net'>
                  Email Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

 // Copied from https://attacomsian.com/blog/javascript-download-file
 function download(url: string, filename: string) {
  U.zap(`downloading: ${filename} from ${url}`)
  // Create a new link
  const anchor = document.createElement('a');
  anchor.href = url
  anchor.download = filename

  // Append to the DOM
  document.body.appendChild(anchor);

  // Trigger `click` event
  anchor.click();

  // Remove element from DOM
  document.body.removeChild(anchor);
}