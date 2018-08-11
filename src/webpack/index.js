import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/storage';

import { fromEvent, combineLatest } from 'rxjs';
import { filter, map, switchMap, mergeMap, tap } from 'rxjs/operators';
import { authState } from 'rxfire/auth';
import { getDownloadURL, put } from 'rxfire/storage';

/**
 * This is a trick to get all elements with the [data-ref] attribute
 */
const refs = {};
Array.from(document.querySelectorAll('[data-ref]')).forEach(element => {
  refs[element.dataset.ref] = element;
});

// Create a Firebase app
const app = firebase.initializeApp({
  apiKey: "AIzaSyDSCt10qc78S8X9-7e_8pBkq92CwAzyV60",
  authDomain: "rxfire-samples.firebaseapp.com",
  databaseURL: "https://rxfire-samples.firebaseio.com",
  projectId: "rxfire-samples",
  storageBucket: "rxfire-samples.appspot.com",
  messagingSenderId: "981415657278"
});

// Login on click, this will trigger the auth$ observable
fromEvent(refs.btnLogin, 'click').subscribe(event => {
  app.auth().signInAnonymously();
});

// Only emit when a user is logged in
const loggedInUser$ = authState(app.auth()).pipe(filter(user => user !== null));
// Get the file when selected
const fileSelect$ = fromEvent(refs.inputFile, 'change');

loggedInUser$.pipe(
  map(_ => {
    refs.viewLogin.style.display = 'none';
    refs.viewUpload.style.display = 'block';
  })
).subscribe();

combineLatest(loggedInUser$, fileSelect$).pipe(
  switchMap(([user, event]) => {
    const name = Math.random().toString(36).substring(5);
    const blob = event.target.files[0];
    const type = blob.type.replace('image/');
    const ref = app.storage().ref(`uploads/${user.uid}/${name}.${type}`);
    return put(ref, blob);
  }),
  map(snapshot => {
    refs.progressUpload.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    return snapshot;
  }),
  filter(snapshot => snapshot.totalBytes === snapshot.bytesTransferred),
  mergeMap(snapshot => getDownloadURL(snapshot.ref))
)
  .subscribe(url => {
    const uploadLink = document.createElement('a');
    uploadLink.href = url;
    uploadLink.textContent = url;
    document.body.appendChild(uploadLink);
  });
