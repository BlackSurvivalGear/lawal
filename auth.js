import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const firebaseConfig={apiKey:'AIzaSyCxaE30HO0NrEvjRZbp2Qa1V2RCzpVQ8Y4',authDomain:'soro-7f7f3.firebaseapp.com',projectId:'soro-7f7f3',storageBucket:'soro-7f7f3.firebasestorage.app',messagingSenderId:'793394051299',appId:'1:793394051299:web:f259b281218375d3c82dd6'};
const app=getApps()[0]||initializeApp(firebaseConfig);
const auth=getAuth(app);
const provider=new GoogleAuthProvider();
provider.setCustomParameters({prompt:'select_account'});
const button=document.querySelector('#google-auth');
const message=document.querySelector('#auth-message');

function status(text,error=false){if(!message)return;message.textContent=text;message.classList.toggle('error',error)}

button?.addEventListener('click',async event=>{
  event.preventDefault();
  event.stopImmediatePropagation();
  status('Opening Google account selection…');
  try{
    await signInWithPopup(auth,provider);
    status('Google account connected. Loading your family access…');
    sessionStorage.setItem('lawal-google-authenticated','1');
    window.dispatchEvent(new CustomEvent('lawal:google-authenticated'));
  }catch(err){
    console.error('Standalone Google sign-in failed',err);
    if(err?.code==='auth/popup-closed-by-user')status('Google sign-in window was closed. Please try again.',true);
    else if(err?.code==='auth/popup-blocked')status('Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again. [auth/popup-blocked]',true);
    else if(err?.code==='auth/unauthorized-domain')status('This LAWAL.UK address is not authorized for Google sign-in. [auth/unauthorized-domain]',true);
    else status((err?.message||'Google sign-in failed.')+(err?.code?' ['+err.code+']':''),true);
  }
});