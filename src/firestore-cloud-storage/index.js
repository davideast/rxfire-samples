import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/storage';
import { collectionData } from 'rxfire/firestore';
import { getDownloadURL } from 'rxfire/storage';
import { of, combineLatest, merge } from 'rxjs';
import { switchMap, map, mergeMap, concatAll, withLatestFrom } from 'rxjs/operators';

const app = firebase.initializeApp({
  apiKey: "AIzaSyDSCt10qc78S8X9-7e_8pBkq92CwAzyV60",
  authDomain: "rxfire-samples.firebaseapp.com",
  databaseURL: "https://rxfire-samples.firebaseio.com",
  projectId: "rxfire-samples",
  storageBucket: "rxfire-samples.appspot.com",
  messagingSenderId: "981415657278"
});

const firestore = app.firestore();
const storage = app.storage();
const settings = { timestampsInSnapshots: true };
firestore.settings(settings);

const citiesRef = firestore.collection('cities');
citiesRef.where('state', '==', 'CO');

function imageCard(data) {
  return document.createRange().createContextualFragment(`
<div class="container mx-auto combine-image-card">

  <div style="width: 33%" class="w-50">
    <img height="200px" width="255px" src="${data.imageURL}" alt="${data.name} photo" />
  </div>

  <div class="flex flex-col ml-4">
    <h4 class="mb-2">${data.name}</h4>
    <span class="mb-2">
      <span class="font-bold">Country</span>:
      <span>${data.country}</span>
    </span>
    <span class="mb-2">
      <span class="font-bold">Population</span>:
      <span>${data.population} (${data.year})</span>
    </span>
    <p>
      ${data.description}
    </p>
  </div>
</div>
  `);
}

collectionData(citiesRef, 'id')
  .pipe(
    switchMap(cities => {
      return combineLatest(...cities.map(c => {
        const ref = storage.ref(`/cities/${c.id}.png`);
        return getDownloadURL(ref).pipe(map(imageURL => ({ imageURL, ...c })));
      }));
    }),
    map(cities => {
      const fragment = document.createDocumentFragment();
      cities.forEach(c => fragment.appendChild(imageCard(c)));
      return fragment;
    })
  )
  .subscribe(fragment => {
    const container = document.querySelector('#container');
    container.innerHTML = '';
    container.appendChild(fragment);
  });
