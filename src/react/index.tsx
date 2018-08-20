import * as React from "react";
import { render } from 'react-dom';
import { from, combineLatest, Subscription } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators';

const CONFIG = {
  apiKey: "AIzaSyDSCt10qc78S8X9-7e_8pBkq92CwAzyV60",
  authDomain: "rxfire-samples.firebaseapp.com",
  databaseURL: "https://rxfire-samples.firebaseio.com",
  projectId: "rxfire-samples",
  storageBucket: "rxfire-samples.appspot.com",
  messagingSenderId: "981415657278"
};

function lazyLoad(config: any) {
  const app$ = from(import('firebase/app'));
  // NOTE: The lazy load for Firestore does not work with TypeScipt
  // w/out hacking the node_modules/firebase/firestore/package.json file
  // to use "typings": "../index.d.ts".
  const firestore$ = from(import('firebase/firestore'));
  const rxfire$ = from(import('rxfire/firestore'));
  return combineLatest(app$, firestore$, rxfire$, (firebase, _, rxfire) => ({ firebase, rxfire }))
    .pipe(
      map(load => {
        const { rxfire, firebase } = load;
        const app = firebase.initializeApp(config);
        const settings = { timestampsInSnapshots: true};
        app.firestore().settings(settings);
        return { app, rxfire };
      })
    );
}

function lazyCollection(config: any, collectionName: string) {
  return lazyLoad(config)
    .pipe(
      mergeMap(load => {
        const { app, rxfire } = load;
        const ref = app.firestore().collection(collectionName);
        return rxfire.collectionData(ref, 'id');
      })
    );
}

class App extends React.Component<any, any, any> {
  sub: Subscription | null;
  constructor(props: any) {
    super(props);
    this.sub = null;
    this.state = {
      todos: []
    };
  }
  componentDidMount() {
    this.sub = lazyCollection(CONFIG, 'todos')
      .subscribe(todos => { 
        this.setState({ ...this.state, todos }); 
      });
  }
  render() {
    const lis = this.state.todos.map((t: any) => <li key={t.id} className="p-4 my-2 text-purple font-bold border-purple border-2">{t.title}</li>);
    return (
      <div className="font-sans">
        <header className="container mx-auto p-4 border-purple border-b-4">
          <h2 className="text-lg text-purple-dark">My Todos</h2>
        </header>
        <div className="container mx-auto p-4">

          <ul className="list-reset">
            {lis}
          </ul>

        </div>
      </div>
    );
  }
}

const root = document.querySelector('#app');
render(<App />, root);
