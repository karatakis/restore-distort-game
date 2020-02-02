import 'babel-polyfill'
import firebase from 'firebase/app'
import 'firebase/analytics'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyADQQty74l5gokTHILsNSj973IPD4ppMSQ',
  authDomain: 'oss-ac-ip.firebaseapp.com',
  databaseURL: 'https://oss-ac-ip.firebaseio.com',
  projectId: 'oss-ac-ip',
  storageBucket: 'oss-ac-ip.appspot.com',
  messagingSenderId: '616835285159',
  appId: '1:616835285159:web:4a7eac687b60c41446db82',
  measurementId: 'G-ZLXW1FVML8'
}

// Initialize Firebase
firebase.initializeApp(firebaseConfig)
firebase.analytics()

export default async function () {
  const user = (await firebase.auth().signInAnonymously()).user
  const idToken = await user.getIdToken()

  return {
    user,
    idToken
  }
}
