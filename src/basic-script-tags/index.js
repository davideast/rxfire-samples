(function(window, firebase, rxjs, rxfire) {

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
  // Initialize Firestore and create a records collection
  const firestore = app.firestore();
  const settings = { timestampsInSnapshots: true };
  firestore.settings(settings);
  const col = firestore.collection('records');
  
  // Grab the exports from rxfire
  const { collectionData } = rxfire;
  // Grab the exports from rxjs
  const { fromEvent, operators, merge } = rxjs;
  // Collect all buttons in an array
  const buttons = [refs.btnSmall, refs.btnLarge, refs.btnMedium];
  // Map over the buttons to create an observable of click events
  const clickEvents = buttons.map(element => {
    return fromEvent(element, 'click');
  });

  /**
   * Merge the click stream off all buttons. This observable 
   * emits whenever any button is clicked. The value emitted is 
   * the clicked button. We can use this event to create a new
   * Firestore query.
   */
  merge(...clickEvents)
    .pipe(
      /**
       * ---------------------------------------
       * ALERT: switchMap is very important!
       * If you use mergeMap it won't unsubscribe when you click another
       * button. This will lead to very unexpected results. It will keep
       * all queries active and the list will render whatever query emits
       * last. Using switchMap will cancel the previous subscription and
       * eliminate this problem.
       * ---------------------------------------
       */
      operators.switchMap(event => {
        // get the clicked button
        const clickedButton = event.target;
        // get the query criteria (eg: 'size', 'small')
        const { query, value } = clickedButton.dataset;
        // make sure no other buttons other than the clicked buttons are disabled
        buttons.filter(b => b !== clickedButton).forEach(b => b.disabled = false);
        // disable the currently clicked button
        clickedButton.disabled = true;
        // create the new query based off the clicked button
        const queriedCol = col.where(query, '==', value);
        // create an observable of the query and map the 'id' to the unwrapped
        // snapshot
        return collectionData(queriedCol, 'id');
      }),
      operators.map(records => {
        // create a fragment of lis based on the updated record list
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
      // clear the list items
      refs.list.innerHTML = '';
      // apend to the DOM
      refs.list.appendChild(fragment);
    });
    
// This pattern below is an old school way importing external libraries
// into a closure. The function parameters up to correspond to these
// imported libraries.
}(window, window.firebase, window.rxjs, window.rxfire));
