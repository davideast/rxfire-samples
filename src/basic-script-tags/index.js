(function(window, firebase, rxjs, rxfire) {

  const refs = {};
  Array.from(document.querySelectorAll('[data-ref]')).forEach(element => {
    refs[element.dataset.ref] = element;
  });

  const app = firebase.initializeApp({
    apiKey: "AIzaSyDSCt10qc78S8X9-7e_8pBkq92CwAzyV60",
    authDomain: "rxfire-samples.firebaseapp.com",
    databaseURL: "https://rxfire-samples.firebaseio.com",
    projectId: "rxfire-samples",
    storageBucket: "rxfire-samples.appspot.com",
    messagingSenderId: "981415657278"
  });
  const firestore = app.firestore();
  const settings = { timestampsInSnapshots: true };
  firestore.settings(settings);

  const col = firestore.collection('records');
  const { collectionData } = rxfire;
  const { fromEvent, operators, merge } = rxjs;
  const buttons = [refs.btnSmall, refs.btnLarge, refs.btnMedium];
  const clickEvents = buttons.map(element => {
    return fromEvent(element, 'click');
  });

  merge(...clickEvents)
    .pipe(
      operators.mergeMap(event => {
        const clickedButton = event.target;
        const { query, value } = clickedButton.dataset;
        // make sure no other buttons other than the clicked buttons are disabled
        buttons.filter(b => b !== clickedButton).forEach(b => b.disabled = false);
        clickedButton.disabled = true;
        const queriedCol = col.where(query, '==', value);
        return collectionData(queriedCol, 'id');
      }),
      operators.map(records => {
        const fragment = document.createDocumentFragment();
        records.forEach(record => {
          const li = document.createElement('li');
          li.textContent = record.name;
          li.id = record.id;
          fragment.appendChild(li);
        });
        return fragment;
      })
    ).subscribe(fragment => {
      refs.list.innerHTML = '';
      refs.list.appendChild(fragment);
    });
    
}(window, window.firebase, window.rxjs, window.rxfire));
