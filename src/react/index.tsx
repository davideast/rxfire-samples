
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

/**
 * Lazy load Firebase App, Firestore, and RxFire. 
 * @param config 
 */
function lazyLoad(config: any, enablePersistence = true) {
  const app$ = from(import('firebase/app'));
  // NOTE: The lazy load for Firestore does not work with TypeScipt
  // w/out hacking the node_modules/firebase/firestore/package.json file
  // to use "typings": "../index.d.ts".
  const firestore$ = from(import('firebase/firestore'));
  const rxfire$ = from(import('rxfire/firestore'));
  return combineLatest(app$, firestore$, rxfire$)
    .pipe(
      map(([firebase, firestore, rxfire]) => {
        const app = firebase.apps[0] || firebase.initializeApp(config);
        const settings = { timestampsInSnapshots: true};
        app.firestore().settings(settings);
        if(enablePersistence) { app.firestore().enablePersistence(); }
        return { app, rxfire };
      })
    );
}

// TODO: Figure out why this method flakes really hard
/**
 * Lazy load a list of todos from RxFire
 * @param config 
 * @param collectionName 
 */
function lazyTodos(config: any, collectionName: string) {
  return lazyLoad(config)
    .pipe(
      mergeMap(load => {
        const { app, rxfire } = load;
        const ref = app.firestore().collection(collectionName);
        return rxfire.collectionData(ref, 'id');
      })
    );
}

/**
 * Lazy load a collection reference from Firestore
 * @param config 
 * @param collectionName 
 */
function lazyCollection(config: any, collectionName: string) {
  return lazyLoad(config, false)
    .pipe(
      map(load => {
        const { app, rxfire } = load;
        return app.firestore().collection(collectionName);
      })
    );
}

/**
 * Lazy load a collection reference and perform an add operation
 * @param config 
 * @param collectionName 
 * @param data 
 */
function lazyAdd(config: any, collectionName: string, data: any) {
  return lazyCollection(config, collectionName)
    .pipe(
      mergeMap(ref => from(ref.add(data)))
    )
}

class App extends React.Component<any, any, any> {
  sub: Subscription | null;
  inputText: HTMLInputElement | null;
  constructor(props: any) {
    super(props);
    this.sub = null;
    this.inputText = null;
    this.state = {
      todos: []
    };
  }
  componentDidMount() {
    this.sub = lazyTodos(CONFIG, 'todos')
      .subscribe(todos => { 
        this.setState({ ...this.state, todos }); 
      });
  }
  addTodo() {
    const title = this.inputText!.value;
    this.inputText!.value = '';
    lazyAdd(CONFIG, 'todos', { title, completed: false })
      .subscribe();
  }
  render() {
    const lis = this.state.todos.map((t: any) => <li key={t.id} className="p-4 my-2 text-purple font-bold border-purple border-2">{t.title}</li>);
    return (
      <div className="font-sans min-h-screen">
        <header className="container mx-auto p-4 border-purple border-b-4">
          <h2 className="text-lg text-purple-dark">My Todos</h2>
        </header>
        <div className="container mx-auto p-4">

          <ul className="list-reset">
            {lis}
          </ul>
          <div className="h-12 flex w-full">
            <input
              ref={(ref) => { this.inputText = ref; }} 
              placeholder="Write unit test..." 
              type="text" 
              className="h-full border-4 border-purple px-4 w-full" />
            <button 
              onClick={this.addTodo.bind(this)}
              className="px-4 bg-purple text-white">Add</button>
          </div>
        </div>
      </div>
    );
  }
}

const root = document.querySelector('#app');
render(<App />, root);
